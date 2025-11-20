// ============================================
// src/components/common/ConfirmDialog.jsx
// ============================================
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = () => {
  const { confirmDialog, closeConfirm } = useUIStore();

  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    danger: <XCircle className="w-6 h-6 text-red-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirm();
  };

  return (
    <Modal
      isOpen={confirmDialog.isOpen}
      onClose={closeConfirm}
      title={confirmDialog.title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={closeConfirm}>
            {confirmDialog.cancelText}
          </Button>
          <Button
            variant={confirmDialog.type === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmDialog.confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {icons[confirmDialog.type]}
        </div>
        <p className="text-sm text-gray-600">{confirmDialog.message}</p>
      </div>
    </Modal>
  );
};