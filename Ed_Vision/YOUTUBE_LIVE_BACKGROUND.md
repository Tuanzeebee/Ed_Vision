# YouTube Live Background - Implementation Guide

## Overview

YouTube Live Background cho phép phát video YouTube làm background động trong Learning Space với tính năng:
- ✅ Video loop tự động
- ✅ Không có âm thanh (muted)
- ✅ Fit với khung hình (16:9 aspect ratio, cover mode)
- ✅ Auto-play khi load
- ✅ Lưu trạng thái vào localStorage
- ✅ Overlay tối để text dễ đọc

## Architecture

### Component: `YouTubeBackground.tsx`

**Location:** `src/modules/student/components/YouTubeBackground.tsx`

**Features:**
1. Load YouTube IFrame API dynamically
2. Create IFrame player với config:
   - autoplay: 1
   - controls: 0 (hide controls)
   - mute: 1 (no audio)
   - loop: 1 (continuous playback)
   - start/end time support
3. Cover screen giữ nguyên aspect ratio 16:9
4. Overlay rgba(0,0,0,0.3) cho readability

**Props:**
```typescript
type Props = {
  videoId: string;      // YouTube video ID
  start?: number;       // Start time in seconds
  end?: number;         // End time in seconds
  className?: string;   // Additional CSS classes
};
```

**CSS Technique:**
```css
.youtube-player {
  /* Center và scale để cover toàn màn hình */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  /* 16:9 aspect ratio calculations */
  width: 100vw;
  height: 56.25vw;      /* 16:9 = 9/16 = 0.5625 */
  min-height: 100vh;
  min-width: 177.77vh;  /* 16:9 = 16/9 = 1.7777 */
}
```

## Integration

### LearningSpace.tsx Updates

**State Management:**
```typescript
const [activeLiveTheme, setActiveLiveTheme] = useState<LiveTheme | null>(null);
const [liveEnabled, setLiveEnabled] = useState(false);
```

**Load from localStorage:**
```typescript
useEffect(() => {
  const savedState = loadThemeState();
  if (savedState.activeLiveThemeId && savedState.liveEnabled) {
    const theme = getLiveThemeById(savedState.activeLiveThemeId);
    if (theme) {
      setActiveLiveTheme(theme);
    }
  }
}, []);
```

**Save to localStorage:**
```typescript
useEffect(() => {
  saveThemeState({
    activeLiveThemeId: activeLiveTheme?.id || null,
    liveEnabled,
    backgroundImage,
  });
}, [activeLiveTheme, liveEnabled, backgroundImage]);
```

**Render Logic:**
```typescript
return (
  <div style={{
    backgroundImage: liveEnabled && activeLiveTheme 
      ? 'none' 
      : `url('${backgroundImage}')`
  }}>
    {/* YouTube Live Background */}
    {liveEnabled && activeLiveTheme && (
      <YouTubeBackground
        videoId={activeLiveTheme.youtubeVideoId}
        start={activeLiveTheme.start}
        end={activeLiveTheme.end}
      />
    )}
    
    {/* Rest of content */}
  </div>
);
```

## User Flow

1. **Select Live Theme:**
   - Click "Theme" icon in Dock Menu
   - Switch to "Live Themes" tab
   - Choose a theme (Featured or from list)
   - Filter by category (Chill, Focus, Anime, etc.)

2. **Video Playback:**
   - YouTube IFrame API loads
   - Video auto-plays muted
   - Loops continuously
   - Start/end times respected (if set)

3. **Persistence:**
   - Theme selection saved to localStorage
   - Page reload restores live theme
   - Works across browser sessions

4. **Switch Back:**
   - Select "Static Themes" tab
   - Choose image background
   - YouTube player automatically removed

## YouTube IFrame API

### API Loading
```javascript
// Auto-load YouTube API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.body.appendChild(tag);

// Callback when ready
window.onYouTubeIframeAPIReady = () => {
  // Initialize player
};
```

### Player Configuration
```javascript
new YT.Player(element, {
  videoId: 'jfKfPfyJRdk',
  playerVars: {
    autoplay: 1,        // Auto-start
    controls: 0,        // Hide controls
    disablekb: 1,       // Disable keyboard
    fs: 0,              // No fullscreen button
    modestbranding: 1,  // Minimal YouTube branding
    playsinline: 1,     // iOS inline playback
    rel: 0,             // No related videos
    loop: 1,            // Loop video
    playlist: videoId,  // Required for loop
    mute: 1,            // No audio
    start: 0,           // Start time (seconds)
    end: 30,            // End time (seconds)
  },
  events: {
    onReady: (event) => {
      event.target.mute();
      event.target.playVideo();
    },
    onStateChange: (event) => {
      // Backup loop logic
      if (event.data === YT.PlayerState.ENDED) {
        event.target.seekTo(startTime);
        event.target.playVideo();
      }
    }
  }
});
```

## Browser Compatibility

✅ **Chrome/Edge:** Full support
✅ **Firefox:** Full support
✅ **Safari:** Full support (with playsinline)
✅ **Mobile:** Works on iOS/Android (muted required for autoplay)

## Performance Considerations

### Optimization:
- YouTube handles streaming và adaptive bitrate
- Video quality tự động điều chỉnh theo bandwidth
- Sử dụng `z-index: -1` để tránh block interactions
- `pointer-events: none` trên background layer

### Memory:
- Player instance cleanup khi unmount
- Chỉ 1 player instance tại một thời điểm
- localStorage chỉ lưu ID (< 100 bytes)

## Testing Checklist

- [ ] Video plays automatically
- [ ] Video is muted (no audio)
- [ ] Video loops continuously
- [ ] Video fits screen (no black bars)
- [ ] Start/end times work correctly
- [ ] Overlay darkness appropriate
- [ ] UI elements visible over video
- [ ] State persists after reload
- [ ] Switching themes works
- [ ] Mobile responsive
- [ ] No console errors

## Troubleshooting

### Video không play:
```javascript
// Check if video is embeddable
// Some videos block iframe embedding
// Solution: Use different video or check restrictions
```

### Loop không hoạt động:
```javascript
// Ensure playlist parameter matches videoId
playerVars: {
  loop: 1,
  playlist: videoId  // MUST be same as videoId
}
```

### Video bị crop:
```css
/* Adjust min-width/min-height ratios */
.youtube-player {
  width: 100vw;
  height: 56.25vw;      /* 16:9 */
  min-height: 100vh;
  min-width: 177.77vh;  /* 16:9 */
}
```

### Autoplay bị block:
```javascript
// Must be muted for autoplay to work
playerVars: {
  mute: 1  // Required!
}
```

## Future Enhancements

🔮 **Potential Features:**
1. Volume control (unmute option)
2. Playback speed control
3. Video quality selector
4. Picture-in-Picture mode
5. Multiple video playlist
6. Shuffle mode
7. Scheduled theme changes
8. Video filters/effects
9. Sync with music player
10. Community uploaded videos

## API Reference

### YouTubeBackground Component

```typescript
<YouTubeBackground
  videoId="jfKfPfyJRdk"  // Required
  start={0}               // Optional (seconds)
  end={30}                // Optional (seconds)
  className=""            // Optional
/>
```

### LearningSpace Handlers

```typescript
// Select live theme
handleSelectLiveTheme(theme: LiveTheme): void

// Clear live theme (back to static)
handleChangeBackground(url: string): void
```

### Storage Functions

```typescript
// Save state
saveThemeState({
  activeLiveThemeId: string | null,
  liveEnabled: boolean,
  backgroundImage: string | null
}): void

// Load state
loadThemeState(): ThemeState
```

## Examples

### Basic Usage:
```tsx
<YouTubeBackground videoId="jfKfPfyJRdk" />
```

### With Time Range:
```tsx
<YouTubeBackground 
  videoId="jfKfPfyJRdk" 
  start={0} 
  end={30} 
/>
```

### With Custom Class:
```tsx
<YouTubeBackground 
  videoId="jfKfPfyJRdk" 
  className="custom-video-bg" 
/>
```

## Notes

- YouTube API free và không cần API key cho public videos
- Videos phải public và embeddable
- Autoplay chỉ work khi muted (browser policy)
- Loop cần playlist parameter = videoId
- z-index: -1 để background không block UI
- Overlay 30% opacity cho text readability
