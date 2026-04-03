// Types for Learning Space components

export type PanelPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
};

export type MusicWidgetState = {
  visible: boolean;
  x: number;
  y: number;
  expanded: boolean;
};

export type PomoMode = 'focus'| 'short'| 'long';

export type AmbienceTab = 'sounds'| 'animations';

export type SoundType = 'rain'| 'birds'| 'campfire'| 'waves'| 'thunderstorm'| 'keyboard'| 'cafe'| 'wind-chimes'| 'singing-bowl'| 'white-noise'| 'crickets'| 'forest'| 'wind'| 'river'| 'owl'| 'city'| 'clock'| 'fan'| 'train';

export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  albumArt: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  mood: string;
  content: string;
  title: string;
};

export type DragState = {
  isDragging: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

export type ResizeState = {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};
