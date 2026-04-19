import { lazy, Suspense } from 'react';
import { useMusicPlayer } from '../music/MusicPlayerContext';

const MusicWidget = lazy(() =>import('./MusicWidget'));

type Props = {
  musicPanelVisible: boolean;
};

/**
 * MusicWidgetWrapper - Wrapper component that shows MusicWidget only when:
 * 1. There's a track playing in the context
 * 2. MusicPanel is not visible
 */
export default function MusicWidgetWrapper({ musicPanelVisible }: Props) {
  const { currentTrack, stop } = useMusicPlayer();
  
  // Only show widget when there's a track (playing or paused) and MusicPanel is closed
  const shouldShow = currentTrack !== null && !musicPanelVisible;
  
  if (!shouldShow) return null;
  
  // When closing widget, stop the music which will clear the track
  const handleClose = () => {
    stop();
  };
  
  return (
    <Suspense fallback={null}>
      <MusicWidget
        visible={true}
        onClose={handleClose}
      />
    </Suspense>);
}
