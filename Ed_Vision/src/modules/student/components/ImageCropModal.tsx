import { useState, useRef, useCallback, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  imageSrc: string;
  onClose: () =>void;
  onCropComplete: (croppedBlob: Blob) =>void;
};

export default function ImageCropModal({ isOpen, imageSrc, onClose, onCropComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const CROP_SIZE = 200; // Size of the circular crop area

  // Load image when source changes
  useEffect(() => {
    if (!imageSrc) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Center the image initially
      const minScale = CROP_SIZE / Math.min(img.width, img.height);
      setScale(Math.max(minScale, 1));
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw image on canvas
  const drawImage = useCallback(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerSize = 300;
    canvas.width = containerSize;
    canvas.height = containerSize;

    // Clear canvas
    ctx.clearRect(0, 0, containerSize, containerSize);

    // Draw scaled and positioned image
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (containerSize - scaledWidth) / 2 + position.x;
    const y = (containerSize - scaledHeight) / 2 + position.y;

    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

    // Draw circular overlay
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(containerSize / 2, containerSize / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [image, scale, position]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // Handle mouse/touch drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = prev + delta;
      const minScale = image ? CROP_SIZE / Math.min(image.width, image.height) : 0.5;
      return Math.max(minScale, Math.min(3, newScale));
    });
  };

  // Crop and save
  const handleCrop = () => {
    if (!canvasRef.current || !image) return;

    // Create a new canvas for the cropped result
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = CROP_SIZE;
    outputCanvas.height = CROP_SIZE;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    const containerSize = 300;
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (containerSize - scaledWidth) / 2 + position.x;
    const y = (containerSize - scaledHeight) / 2 + position.y;

    // Calculate crop area offset
    const cropX = (containerSize - CROP_SIZE) / 2;
    const cropY = (containerSize - CROP_SIZE) / 2;

    // Draw circular clipped image
    outputCtx.beginPath();
    outputCtx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    outputCtx.clip();

    // Draw the portion of the image that falls within the crop area
    outputCtx.drawImage(
      image,
      (cropX - x) / scale,
      (cropY - y) / scale,
      CROP_SIZE / scale,
      CROP_SIZE / scale,
      0,
      0,
      CROP_SIZE,
      CROP_SIZE
    );

    // Convert to blob
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Chỉnh sửa ảnh đại diện</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition p-1">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Preview Container */}
        <div
          ref={containerRef}
          className="relative mx-auto mb-4 rounded-xl overflow-hidden bg-gray-800"style={{ width: 300, height: 300 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background layer with full image for reference */}
          {image && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-30"style={{ pointerEvents: 'none'}}
            >
              <img
                src={imageSrc}
                alt="preview"style={{
                  width: image.width * scale,
                  height: image.height * scale,
                  transform: `translate(${position.x}px, ${position.y}px)`,
                }}
                draggable={false}
              />
            </div>)}

          {/* Cropped canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-move"style={{ pointerEvents: 'none'}}
          />

          {/* Crop circle overlay */}
          <div
            className="absolute inset-0 pointer-events-none"style={{
              background: `radial-gradient(circle ${CROP_SIZE / 2}px at center, transparent 100%, rgba(0,0,0,0.6) 100%)`,
            }}
          />

          {/* Circle border */}
          <div
            className="absolute border-2 border-white/50 rounded-full pointer-events-none"style={{
              width: CROP_SIZE,
              height: CROP_SIZE,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Drag hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/50 px-2 py-1 rounded">Kéo để di chuyển
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() =>handleZoom(-0.1)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <i className="fas fa-minus"></i>
          </button>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <i className="fas fa-search"></i>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <button
            onClick={() =>handleZoom(0.1)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition">Hủy
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2">
            <i className="fas fa-check"></i>Áp dụng
          </button>
        </div>
      </div>
    </div>);
}
