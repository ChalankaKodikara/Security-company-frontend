import React from "react";

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
      <div className="bg-white rounded-md p-6 shadow-lg relative">
        {/* Close Button - Moved outside */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-gray-100 rounded-md p-1 hover:bg-gray-200 focus:outline-none"
        >
          <svg
            className="h-5 w-5 text-gray-500 hover:text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Confirm <span>{itemName}</span> Removal
        </h2>
        <p className="text-gray-600 mb-4">
        Are you sure you want to remove this {itemName}?
        </p>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            Yes
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;