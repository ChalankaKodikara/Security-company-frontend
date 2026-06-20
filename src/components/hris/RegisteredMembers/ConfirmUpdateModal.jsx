import React from 'react';
import { motion } from 'framer-motion';

const ConfirmUpdateModal = ({ onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 opacity-70">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center"
            >
                <div className="flex justify-end -mt-3 -mr-3">
                    
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Confirm Update?</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to save these changes?
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onConfirm}
                        className="bg-primary text-white px-6 py-2 rounded hover:bg-red-600"
                    >
                        Yes
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-100 text-gray-500 px-6 py-2 rounded hover:bg-gray-200"
                    >
                        No
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ConfirmUpdateModal;
