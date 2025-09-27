import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Smile, 
  Paperclip,
  Mic,
  MicOff,
  PhoneOff,
  VideoOff,
  Users,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'file';
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface ChatRoom {
  id: string;
  student_id: string;
  instructor_id: string;
  skill_listing_id: string;
  created_at: string;
  student_profile?: {
    full_name: string;
    avatar_url: string;
  };
  instructor_profile?: {
    full_name: string;
    avatar_url: string;
  };
  skill_listing?: {
    title: string;
  };
}

interface ChatProductionProps {
  skillId: string;
  onClose?: () => void;
}

const MessageBubble = ({ message, isOwn, showAvatar }: { 
  message: Message; 
  isOwn: boolean; 
  showAvatar: boolean;
}) => {
  const [isRead, setIsRead] = useState(message.is_read);

  useEffect(() => {
    if (!isOwn && !message.is_read) {
      // Mark as read after a delay
      const timer = setTimeout(() => {
        setIsRead(true);
        // TODO: Update message as read in database
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message.is_read, isOwn]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.profiles?.avatar_url} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
            {message.profiles?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className="w-8" />}
      
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : ''}`}>
        <motion.div
          className={`rounded-lg px-4 py-2 ${
            isOwn 
              ? 'bg-gradient-primary text-primary-foreground' 
              : 'bg-muted text-foreground'
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm">{message.content}</p>
        </motion.div>
        <div className={`flex items-center space-x-1 mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : ''}`}>
          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOwn && (
            <div className="flex items-center">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TypingIndicator = ({ isTyping, userName }: { isTyping: boolean; userName: string }) => {
  if (!isTyping) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg"
    >
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-muted-foreground">{userName} is typing...</span>
    </motion.div>
  );
};

const ChatProduction: React.FC<ChatProductionProps> = ({ skillId, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isAudioCall, setIsAudioCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat room and messages
  useEffect(() => {
    const loadChatData = async () => {
      try {
        setIsLoading(true);

        // Get or create chat room
        const { data: existingRoom, error: roomError } = await supabase
          .from('course_chat_rooms')
          .select(`
            *,
            student_profile:profiles!course_chat_rooms_student_id_fkey(full_name, avatar_url),
            instructor_profile:profiles!course_chat_rooms_instructor_id_fkey(full_name, avatar_url),
            skill_listing:skill_listings(title)
          `)
          .eq('skill_listing_id', skillId)
          .single();

        if (roomError && roomError.code !== 'PGRST116') {
          throw roomError;
        }

        let room = existingRoom;
        if (!existingRoom) {
          // Create new chat room
          const { data: skillListing } = await supabase
            .from('skill_listings')
            .select('user_id')
            .eq('id', skillId)
            .single();

          if (!skillListing) {
            throw new Error('Skill not found');
          }

          const { data: newRoom, error: createError } = await supabase
            .from('course_chat_rooms')
            .insert({
              student_id: user?.id,
              instructor_id: skillListing.user_id,
              skill_listing_id: skillId,
            })
            .select(`
              *,
              student_profile:profiles!course_chat_rooms_student_id_fkey(full_name, avatar_url),
              instructor_profile:profiles!course_chat_rooms_instructor_id_fkey(full_name, avatar_url),
              skill_listing:skill_listings(title)
            `)
            .single();

          if (createError) throw createError;
          room = newRoom;
        }

        setChatRoom(room);

        // Load messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profiles(full_name, avatar_url)
          `)
          .eq('chat_room_id', room.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

      } catch (error) {
        console.error('Error loading chat data:', error);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && skillId) {
      loadChatData();
    }
  }, [user?.id, skillId]);

  // Real-time message subscription
  useEffect(() => {
    if (!chatRoom?.id) return;

    const subscription = supabase
      .channel(`chat_${chatRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_room_id=eq.${chatRoom.id}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatRoom?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoom || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: user.id,
          receiver_id: chatRoom.student_id === user.id ? chatRoom.instructor_id : chatRoom.student_id,
          content: newMessage.trim(),
          message_type: 'text',
          is_read: false,
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      // TODO: Send typing indicator via socket
    }

    // Clear typing indicator after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVideoCall = () => {
    setIsVideoCall(true);
    toast.success('Starting video call...');
    // TODO: Implement WebRTC video call
  };

  const startAudioCall = () => {
    setIsAudioCall(true);
    toast.success('Starting audio call...');
    // TODO: Implement WebRTC audio call
  };

  const endCall = () => {
    setIsVideoCall(false);
    setIsAudioCall(false);
    toast.success('Call ended');
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] bg-gradient-card border-border/50">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chatRoom) {
    return (
      <Card className="h-[600px] bg-gradient-card border-border/50">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="text-6xl">💬</div>
            <h3 className="text-lg font-semibold">Chat Not Available</h3>
            <p className="text-muted-foreground">
              You need to be enrolled in this course to access the chat.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherUser = chatRoom.student_id === user?.id 
    ? chatRoom.instructor_profile 
    : chatRoom.student_profile;

  return (
    <Card className="h-[600px] bg-gradient-card border-border/50 shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-primary/30">
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {otherUser?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{otherUser?.full_name || 'Unknown User'}</h3>
              <p className="text-sm text-muted-foreground">
                {chatRoom.skill_listing?.title}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isVideoCall && !isAudioCall ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startAudioCall}
                  className="hover:bg-green-500 hover:text-white"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVideoCall}
                  className="hover:bg-blue-500 hover:text-white"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={endCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[calc(100%-80px)]">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={messagesContainerRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user?.id}
                  showAvatar={index === 0 || messages[index - 1]?.sender_id !== message.sender_id}
                />
              ))}
            </AnimatePresence>
            <TypingIndicator 
              isTyping={otherUserTyping} 
              userName={otherUser?.full_name || 'User'} 
            />
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-12"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Enter to send</span>
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3" />
              <span>2 online</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatProduction;
