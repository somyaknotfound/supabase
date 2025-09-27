import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    
    // Also set the class on the body for better compatibility
    document.body.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Toggle classes on both html and body elements
    document.documentElement.classList.toggle('dark', newTheme);
    document.body.classList.toggle('dark', newTheme);
    
    // Save preference
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Force a re-render by updating the state
    setIsDark(newTheme);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="relative overflow-hidden"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-blue-500" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
};
