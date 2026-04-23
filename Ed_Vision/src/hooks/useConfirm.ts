import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger'| 'warning'| 'info';
  confirmButtonClass?: string;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () =>void;
  onCancel: () =>void;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy bỏ',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean>=> {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        ...options,
        onConfirm: () => {
          setConfirmState(prev =>({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev =>({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  return {
    confirm,
    confirmState
  };
}
