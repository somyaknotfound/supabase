import React from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalLoadingBar = () => {
  const isFetching = useIsFetching();

  return (
    <AnimatePresence>
      {isFetching > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-primary"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoadingBar;
