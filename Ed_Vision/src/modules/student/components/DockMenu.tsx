type DockItem = {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
};

type Props = {
  items: DockItem[];
  className?: string;
};

export default function DockMenu({ items, className = '' }: Props) {
  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 ${className}`}>
      <div className="backdrop-blur-[20px] bg-black/30 border border-white/10 rounded-full px-4 py-3 flex items-center gap-3 shadow-2xl">
        {items.map((item) => (
          <div
            key={item.id}
            className="dock-item cursor-pointer group relative"
            onClick={item.onClick}
          >
            <div className="w-7 h-7 flex items-center justify-center text-white text-sm transition-all duration-300 hover:scale-115 hover:-translate-y-1.5 hover:brightness-120">
              <i className={item.icon}></i>
            </div>
            <div className="label absolute bottom-[-32px] left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap opacity-0 pointer-events-none transition-all duration-200 z-50 group-hover:opacity-100 group-hover:-translate-y-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
