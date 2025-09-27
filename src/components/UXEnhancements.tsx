import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Zap, 
  Star, 
  TrendingUp, 
  Award, 
  Target,
  CheckCircle,
  Clock,
  Users,
  Coins,
  Flame,
  Crown,
  Gem
} from 'lucide-react';

// Shimmer Effect Component
export const ShimmerEffect = ({ className = "" }: { className?: string }) => (
  <div className={`animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent ${className}`} />
);

// Skeleton Loaders with Shimmer
export const CardSkeleton = ({ showImage = true, className = "" }: { showImage?: boolean; className?: string }) => (
  <Card className={`bg-gradient-card border-border/50 ${className}`}>
    <CardContent className="p-6">
      {showImage && <Skeleton className="h-32 w-full mb-4" />}
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <ShimmerEffect className="absolute inset-0 rounded-lg" />
    </CardContent>
  </Card>
);

// Animated Progress Ring
export const ProgressRing = ({ 
  progress, 
  size = 60, 
  strokeWidth = 4, 
  color = "hsl(var(--primary))" 
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{progress}%</span>
      </div>
    </div>
  );
};

// Floating Action Button
export const FloatingActionButton = ({ 
  onClick, 
  icon: Icon, 
  label, 
  position = "bottom-right" 
}: {
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) => {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Button
        onClick={onClick}
        className="rounded-full shadow-lg bg-gradient-primary hover:opacity-90 w-14 h-14 p-0"
        title={label}
      >
        <Icon className="h-6 w-6" />
      </Button>
    </motion.div>
  );
};

// Animated Counter
export const AnimatedCounter = ({ 
  value, 
  duration = 1, 
  className = "" 
}: {
  value: number;
  duration?: number;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const currentValue = startValue + (difference * progress);
      
      setDisplayValue(Math.floor(currentValue));
      
      if (progress >= 1) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, displayValue]);

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
    </span>
  );
};

// Confetti Effect
export const ConfettiEffect = ({ trigger }: { trigger: boolean }) => {
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    if (trigger) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!showConfetti) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -10,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            y: window.innerHeight + 10,
            rotate: 360,
            scale: 0,
          }}
          transition={{
            duration: 3,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// Hover Card with Preview
export const PreviewCard = ({ 
  children, 
  preview, 
  side = "top" 
}: {
  children: React.ReactNode;
  preview: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: side === "top" ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: side === "top" ? 10 : -10 }}
            className={`absolute z-50 ${
              side === "top" ? "bottom-full mb-2" :
              side === "bottom" ? "top-full mt-2" :
              side === "left" ? "right-full mr-2" :
              "left-full ml-2"
            }`}
          >
            <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg max-w-sm">
              <CardContent className="p-4">
                {preview}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Success Animation
export const SuccessAnimation = ({ show, onComplete }: { show: boolean; onComplete?: () => void }) => {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="bg-gradient-primary text-primary-foreground rounded-full p-8"
          >
            <CheckCircle className="h-16 w-16" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Loading States
export const LoadingStates = {
  // Pulse loading
  Pulse: ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  ),
  
  // Skeleton with shimmer
  Skeleton: ({ className = "" }: { className?: string }) => (
    <div className="relative overflow-hidden">
      <Skeleton className={className} />
      <ShimmerEffect className="absolute inset-0" />
    </div>
  ),
  
  // Spinner
  Spinner: ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6", 
      lg: "h-8 w-8"
    };
    
    return (
      <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`} />
    );
  },
  
  // Dots loading
  Dots: () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  ),
};

// Micro-interactions
export const MicroInteractions = {
  // Ripple effect
  Ripple: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

    const handleClick = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = {
        id: Date.now(),
        x,
        y,
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
      
      onClick?.();
    };

    return (
      <div className="relative overflow-hidden" onClick={handleClick}>
        {children}
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </div>
    );
  },

  // Hover lift
  HoverLift: ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <motion.div
      className={className}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.div>
  ),

  // Bounce on mount
  BounceIn: ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 10,
        delay 
      }}
    >
      {children}
    </motion.div>
  ),
};

// Empty States
export const EmptyStates = {
  NoData: ({ 
    icon, 
    title, 
    description, 
    action 
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {action}
    </motion.div>
  ),

  Error: ({ 
    title = "Something went wrong", 
    description, 
    onRetry 
  }: {
    title?: string;
    description?: string;
    onRetry?: () => void;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </motion.div>
  ),
};

export default {
  ShimmerEffect,
  CardSkeleton,
  ProgressRing,
  FloatingActionButton,
  AnimatedCounter,
  ConfettiEffect,
  PreviewCard,
  SuccessAnimation,
  LoadingStates,
  MicroInteractions,
  EmptyStates,
};
