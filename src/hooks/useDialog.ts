import { useState, useCallback } from 'react';

interface DialogState<T = any> {
  open: boolean;
  data: T | null;
}

interface UseDialogResult<T = any> {
  dialogState: DialogState<T>;
  openDialog: (data?: T) => void;
  closeDialog: () => void;
  toggleDialog: () => void;
  updateDialogData: (data: T) => void;
}

export function useDialog<T = any>(initialState: boolean = false): UseDialogResult<T> {
  const [dialogState, setDialogState] = useState<DialogState<T>>({
    open: initialState,
    data: null
  });

  const openDialog = useCallback((data?: T) => {
    setDialogState({
      open: true,
      data: data || null
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const toggleDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      open: !prev.open
    }));
  }, []);

  const updateDialogData = useCallback((data: T) => {
    setDialogState(prev => ({
      ...prev,
      data
    }));
  }, []);

  return {
    dialogState,
    openDialog,
    closeDialog,
    toggleDialog,
    updateDialogData
  };
}