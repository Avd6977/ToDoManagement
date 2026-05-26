import { useEffect, type ReactNode } from "react";

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
  useEffect(() => {
    if (!isOpen || isConfirming) {
      return;
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, isConfirming, onCancel]);

  if (!isOpen) {
    return null;
  }

  const modalTitleId = `${modalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      onMouseDown={(event) => {
        if (!isConfirming && event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
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
