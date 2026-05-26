import type { ReactNode } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  modalTitle: string;
  content: ReactNode;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isConfirming?: boolean;
  confirmButtonTitle?: string;
}

export const ConfirmationModal = ({
  isOpen,
  modalTitle,
  content,
  onConfirm,
  onCancel,
  isConfirming = false,
  confirmButtonTitle = "Confirm",
}: ConfirmationModalProps): JSX.Element | null => {
  if (!isOpen) {
    return null;
  }

  const modalTitleId = `${modalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby={modalTitleId}>
      <div className="modal-card">
        <h5 id={modalTitleId}>{modalTitle}</h5>
        {typeof content === "string" ? <p>{content}</p> : content}
        <div className="actions">
          <button type="button" className="danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? `${confirmButtonTitle}...` : confirmButtonTitle}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
