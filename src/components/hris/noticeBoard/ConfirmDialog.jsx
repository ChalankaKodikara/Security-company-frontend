import React from "react";
import "./noticeBoard.css";

export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="nb-modal-overlay">
            <div className="nb-modal-box">
                <p>{message}</p>
                <div className="nb-modal-actions">
                    <button onClick={onConfirm} className="nb-btn primary">
                        Yes
                    </button>
                    <button onClick={onCancel} className="nb-btn ghost">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
