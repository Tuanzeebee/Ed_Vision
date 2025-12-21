import { useState, useEffect, useCallback } from 'react';
import type { DragState } from '../types/learningSpace';

type UseDraggableReturn = {
  position: { x: number; y: number };
  setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  handleMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
};

export const useDraggable = (initialX: number, initialY: number): UseDraggableReturn => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    });
  }, [position.x, position.y]);

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragState.offsetX,
        y: e.clientY - dragState.offsetY,
      });
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, isDragging: false }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.offsetX, dragState.offsetY]);

  return {
    position,
    setPosition,
    handleMouseDown,
    isDragging: dragState.isDragging,
  };
};
