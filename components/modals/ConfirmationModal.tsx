
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 20, stiffness: 200 } },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={!isLoading ? onClose : undefined}
        >
          <motion.div
            variants={modalVariants}
            className="bg-surface rounded-xl p-6 w-full max-w-sm border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-absent/10">
                    <span className="material-symbols-outlined text-absent text-3xl">warning</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-6 text-white">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-zinc-400">{message}</p>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full rounded-lg bg-zinc-800 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full rounded-lg bg-absent px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                    </>
                ) : 'Delete'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;