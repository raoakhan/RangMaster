import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationToastProps {
  id: string;
  message: string;
  onClose: () => void;
}

export function NotificationToast({ id, message, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 bg-neutral-800 shadow-lg rounded-md px-4 py-3 flex items-center z-50"
        >
          <div className="mr-3 bg-primary-700 rounded-full p-2">
            <span className="material-icons">notifications</span>
          </div>
          <div>
            <h4 className="font-medium">{message}</h4>
            <p className="text-sm text-neutral-300">Game notification</p>
          </div>
          <button 
            className="ml-3 text-neutral-400 hover:text-white"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
          >
            <span className="material-icons">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
