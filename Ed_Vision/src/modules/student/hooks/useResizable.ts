import { useState, useEffect, useCallback } from 'react';
import type { ResizeState } from '../types/learningSpace';

type UseResizableReturn = {
  size: { width: number; height: number };
  handleMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
};

export const useResizable = (
  initialWidth: number,
  initialHeight: number,
  minWidth: number = 300,
  minHeight: number = 300
): UseResizableReturn => {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: initialWidth,
    startHeight: initialHeight,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setResizeState({
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    });
  }, [size.width, size.height]);

  useEffect(() => {
    if (!resizeState.isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;

      setSize({
        width: Math.max(minWidth, resizeState.startWidth + deltaX),
        height: Math.max(minHeight, resizeState.startHeight + deltaY),
      });
    };

    const handleMouseUp = () => {
      setResizeState(prev => ({ ...prev, isResizing: false }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState.isResizing, resizeState.startX, resizeState.startY, resizeState.startWidth, resizeState.startHeight, minWidth, minHeight]);

  return {
    size,
    handleMouseDown,
    isResizing: resizeState.isResizing,
  };
};
