import { useEffect, useRef, useState } from 'react';

interface AnimatedListProps<T> {
  items: T[];
  onItemSelect: (item: T, index: number) =>void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  displayScrollbar?: boolean;
  renderItem?: (item: T, index: number, isActive: boolean) =>React.ReactNode;
  itemHeight?: number;
}

export default function AnimatedList<T>({
  items,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  renderItem,
  itemHeight = 120,
}: AnimatedListProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to active item
  const scrollToItem = (index: number) => {
    const container = containerRef.current;
    const itemRef = itemRefs.current[index];
    
    if (container && itemRef) {
      const containerHeight = container.clientHeight;
      const itemTop = itemRef.offsetTop;
      const scrollPosition = itemTop - (containerHeight / 2) + (itemHeight / 2);
      
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  };

  // Handle item click
  const handleItemClick = (index: number) => {
    setActiveIndex(index);
    onItemSelect(items[index], index);
    scrollToItem(index);
  };

  // Arrow key navigation
  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = Math.max(0, activeIndex - 1);
        handleItemClick(newIndex);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = Math.min(items.length - 1, activeIndex + 1);
        handleItemClick(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () =>window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, items.length, enableArrowNavigation]);

  // Auto scroll on mount
  useEffect(() => {
    scrollToItem(activeIndex);
  }, []);

  // Calculate opacity based on distance from active item
  const getItemOpacity = (index: number): number => {
    const distance = Math.abs(index - activeIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.6;
    if (distance === 2) return 0.3;
    return 0.15;
  };

  // Calculate scale based on distance from active item
  const getItemScale = (index: number): number => {
    const distance = Math.abs(index - activeIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.95;
    return 0.9;
  };

  return (
    <div className="relative h-full w-full">
      {/* Top Gradient */}
      {showGradients && (
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none z-10"/>)}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className={`h-full overflow-y-auto ${displayScrollbar ? '': 'scrollbar-none'} px-4 py-32`}
        style={{
          scrollbarWidth: displayScrollbar ? 'thin': 'none',
          scrollbarColor: displayScrollbar ? 'rgba(255,255,255,0.3) transparent': undefined,
        }}
      >
        <div className="space-y-4">
          {items.map((item, index) =>(
            <div
              key={index}
              ref={(el) => { itemRefs.current[index] = el; }}
              onClick={() =>handleItemClick(index)}
              className="transition-all duration-500 ease-out cursor-pointer"style={{
                opacity: getItemOpacity(index),
                transform: `scale(${getItemScale(index)})`,
                height: `${itemHeight}px`,
              }}
            >
              {renderItem ? (
                renderItem(item, index, index === activeIndex)
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 h-full flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {typeof item === 'string'? item : JSON.stringify(item)}
                  </span>
                </div>)}
            </div>))}
        </div>
      </div>

      {/* Bottom Gradient */}
      {showGradients && (
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none z-10"/>)}

      {/* Navigation Arrows */}
      {enableArrowNavigation && (
        <>
          <button
            onClick={() =>handleItemClick(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm rounded-full flex items-center justify-center text-white transition">
            <i className="fas fa-chevron-up"></i>
          </button>
          <button
            onClick={() =>handleItemClick(Math.min(items.length - 1, activeIndex + 1))}
            disabled={activeIndex === items.length - 1}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm rounded-full flex items-center justify-center text-white transition">
            <i className="fas fa-chevron-down"></i>
          </button>
        </>)}
    </div>);
}
