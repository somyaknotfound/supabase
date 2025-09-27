import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  CreditCard, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  Trophy,
  Star,
  Users
} from "lucide-react";

interface PurchaseStepperProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  instructorName: string;
  price: number;
  userCredits: number;
  onConfirmPurchase: () => Promise<boolean>;
}

type Step = 'confirm' | 'processing' | 'success' | 'error';

export const PurchaseStepper = ({
  isOpen,
  onClose,
  skillName,
  instructorName,
  price,
  userCredits,
  onConfirmPurchase
}: PurchaseStepperProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('confirm');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 'confirm', title: 'Confirm Purchase', icon: CreditCard },
    { id: 'processing', title: 'Processing', icon: Loader2 },
    { id: 'success', title: 'Success!', icon: CheckCircle },
    { id: 'error', title: 'Error', icon: AlertCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleConfirm = async () => {
    if (userCredits < price) {
      setError('Insufficient credits');
      setCurrentStep('error');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    setError(null);

    try {
      const success = await onConfirmPurchase();
      if (success) {
        setCurrentStep('success');
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
          resetModal();
        }, 2000);
      } else {
        setError('Purchase failed. Please try again.');
        setCurrentStep('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('confirm');
    setIsProcessing(false);
    setError(null);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      resetModal();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'confirm':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Confirm Your Purchase</h3>
              <p className="text-muted-foreground">
                You're about to enroll in this skill course
              </p>
            </div>

            <div className="bg-gradient-card p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Course:</span>
                <span className="text-primary font-semibold">{skillName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Instructor:</span>
                <span className="text-muted-foreground">{instructorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Price:</span>
                <span className="text-accent font-bold">{price} credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Your Credits:</span>
                <span className="text-success font-bold">{userCredits}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Remaining Credits:</span>
                <span className={`font-bold ${userCredits - price >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {userCredits - price}
                </span>
              </div>
            </div>

            {userCredits < price && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
              >
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Insufficient Credits</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  You need {price - userCredits} more credits to purchase this course.
                </p>
              </motion.div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={userCredits < price || isProcessing}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirm Purchase
              </Button>
            </div>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto"
              >
                <Loader2 className="w-full h-full text-primary" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-sm"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Processing Your Purchase</h3>
              <p className="text-muted-foreground">
                Please wait while we process your enrollment...
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deducting credits</span>
                <span>✓</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Enrolling in course</span>
                <span>⏳</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sending confirmation</span>
                <span>⏳</span>
              </div>
            </div>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="relative"
            >
              <CheckCircle className="w-16 h-16 mx-auto text-success" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-success/20 rounded-full blur-sm"
              />
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-success">Purchase Successful!</h3>
              <p className="text-muted-foreground">
                You've successfully enrolled in <span className="font-semibold text-primary">{skillName}</span>
              </p>
            </div>

            <div className="bg-gradient-card p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="h-4 w-4 text-accent" />
                <span className="font-medium">Welcome to your new course!</span>
              </div>
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>Start learning</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>Join community</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start Learning Now!
            </Button>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-destructive">Purchase Failed</h3>
              <p className="text-muted-foreground">
                {error || "Something went wrong. Please try again."}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => setCurrentStep('confirm')}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Course Enrollment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <motion.div
                  key={step.id}
                  className={`flex flex-col items-center space-y-1 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                  }`}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-success text-success-foreground' :
                    'bg-muted'
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive && step.id === 'processing' ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
