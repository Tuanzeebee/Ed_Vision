# Live Themes System Documentation

## Overview

Hệ thống Live Themes cho phép người dùng chọn và phát video YouTube làm background động trong Learning Space, với khả năng lưu trạng thái và filter theo category.

## Architecture

### 1. Data Layer (`src/data/liveThemes.ts`)

**Type Definition:**
```typescript
export type LiveTheme = {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  category: "Custom" | "Exclusive" | "Chill" | "Focus" | "Anime" | "Pets" | "Kpop";
  youtubeVideoId: string;        // YouTube video ID
  start?: number;                // Optional start time (seconds)
  end?: number;                  // Optional end time (seconds)
  thumbnailUrl: string;          // Thumbnail image URL
  attribution?: string;          // Creator credit
};
```

**Data:**
- `LIVE_THEMES`: Array of 16 predefined themes
- Utility functions: `getLiveThemesByCategory()`, `getFeaturedLiveTheme()`, `getLiveThemeById()`

### 2. Service Layer (`src/services/themeService.ts`)

Mock service để simulate API calls với delay:

```typescript
export async function listLiveThemes(): Promise<LiveTheme[]>
export async function listLiveThemesByCategory(category): Promise<LiveTheme[]>
export async function getLiveThemeById(id: string): Promise<LiveTheme | undefined>
export async function getFeaturedLiveTheme(): Promise<LiveTheme>
```

**Replace with real API later:**
```typescript
// TODO: Replace mock with actual API
// export async function listLiveThemes() {
//   const response = await fetch('/api/live-themes');
//   return response.json();
// }
```

### 3. Storage Layer (`src/lib/themeStorage.ts`)

LocalStorage persistence cho theme state:

```typescript
export type ThemeState = {
  activeLiveThemeId: string | null;
  liveEnabled: boolean;
  backgroundImage: string | null;
};

// Save/Load functions
export const saveThemeState(state: ThemeState): void
export const loadThemeState(): ThemeState
export const clearThemeState(): void
```

**Storage Keys:**
- `ed-vision-active-live-theme-id`: ID của theme đang active
- `ed-vision-live-enabled`: Boolean live mode enabled
- `ed-vision-background-image`: URL của background image

### 4. UI Layer (`src/modules/student/components/ThemePanel.tsx`)

Modal component với 2 tabs:
- **Static Themes**: Traditional background images
- **Live Themes**: YouTube video backgrounds

**Features:**
- Category filtering (Custom, Exclusive, Chill, Focus, Anime, Pets, Kpop)
- Featured theme showcase
- Grid layout với thumbnails
- Hover effects với play icon
- Click handler để select theme

**Props:**
```typescript
type Props = {
  visible: boolean;
  onClose: () => void;
  onChangeBackground: (url: string) => void;
  onUploadBackground: (file: File) => void;
  onSelectLiveTheme?: (theme: LiveTheme) => void;
  // ... positioning props
};
```

### 5. Integration (`src/modules/student/LearningSpace.tsx`)

Main Learning Space component integrates:

```typescript
const [activeLiveTheme, setActiveLiveTheme] = useState<LiveTheme | null>(null);
const [liveEnabled, setLiveEnabled] = useState(false);

// Load from localStorage on mount
useEffect(() => {
  const savedState = loadThemeState();
  // ... restore state
}, []);

// Save to localStorage when changed
useEffect(() => {
  saveThemeState({ activeLiveThemeId, liveEnabled, backgroundImage });
}, [activeLiveTheme, liveEnabled, backgroundImage]);

// Handler
const handleSelectLiveTheme = (theme: LiveTheme) => {
  setActiveLiveTheme(theme);
  setLiveEnabled(true);
  setBackgroundImage(theme.thumbnailUrl);
  setThemeVisible(false);
};
```

## Current Implementation Status

✅ **Completed:**
- Data structure (`liveThemes.ts`)
- Mock service (`themeService.ts`)
- LocalStorage persistence (`themeStorage.ts`)
- UI integration in ThemePanel
- State management in LearningSpace
- Category filtering
- Featured theme support
- Build successful

🚧 **Pending (Future Work):**
1. **YouTube Video Player Integration:**
   - Embed YouTube iframe player
   - Control playback (play/pause/volume)
   - Handle start/end time parameters
   - Fullscreen background mode

2. **Backend API:**
   - Replace mock service with real API endpoints
   - Database schema for live themes
   - Admin CRUD operations
   - User preferences storage

3. **Enhanced Features:**
   - Search functionality
   - User-uploaded custom themes
   - Playlist/shuffle mode
   - Volume controls
   - Keyboard shortcuts

## Usage Example

```typescript
// In ThemePanel component
import { LIVE_THEMES } from '@/data/liveThemes';

// Render themes
{LIVE_THEMES.map((theme) => (
  <div 
    key={theme.id}
    onClick={() => handleSelectLiveTheme(theme)}
    style={{ backgroundImage: `url('${theme.thumbnailUrl}')` }}
  >
    <h4>{theme.title}</h4>
    <p>by {theme.attribution}</p>
  </div>
))}
```

## Thumbnails

Temporary using Unsplash images. To add custom thumbnails:

1. Place images in `public/thumbs/`
2. Format: `<theme-id>.jpg` (e.g., `rainy-lofi-japan.jpg`)
3. Recommended size: 400x225px (16:9 aspect ratio)
4. Update `thumbnailUrl` in `liveThemes.ts` to `/thumbs/<filename>.jpg`

See `public/thumbs/README.md` for detailed instructions.

## Testing

```bash
# Build project
npm run build

# Test in browser
npm run dev
# Navigate to Learning Space
# Click Theme icon in Dock
# Switch to "Live Themes" tab
# Select a theme
# Verify localStorage saved state
# Reload page - state should persist
```

## Migration Path to Real API

**Step 1: Create backend endpoints**
```typescript
// Backend API routes
GET    /api/live-themes              // List all
GET    /api/live-themes/:id          // Get one
POST   /api/live-themes              // Create (admin)
PUT    /api/live-themes/:id          // Update (admin)
DELETE /api/live-themes/:id          // Delete (admin)
GET    /api/live-themes/featured     // Get featured
```

**Step 2: Update service**
```typescript
// Replace mock in themeService.ts
export async function listLiveThemes(): Promise<LiveTheme[]> {
  const response = await fetch('/api/live-themes');
  if (!response.ok) throw new Error('Failed to fetch themes');
  return response.json();
}
```

**Step 3: Add loading states**
```typescript
const [liveThemes, setLiveThemes] = useState<LiveTheme[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  listLiveThemes()
    .then(setLiveThemes)
    .finally(() => setLoading(false));
}, []);
```

## File Structure

```
Ed_Vision/
├── src/
│   ├── data/
│   │   └── liveThemes.ts           # Theme data & types
│   ├── services/
│   │   └── themeService.ts         # Mock API service
│   ├── lib/
│   │   └── themeStorage.ts         # LocalStorage utilities
│   └── modules/student/
│       ├── LearningSpace.tsx       # Main integration
│       └── components/
│           └── ThemePanel.tsx      # UI component
└── public/
    └── thumbs/
        └── README.md               # Thumbnail instructions
```

## Contributing

To add new Live Themes:

1. Add entry to `LIVE_THEMES` array in `liveThemes.ts`
2. Get YouTube video ID from URL (e.g., `jfKfPfyJRdk` from `youtube.com/watch?v=jfKfPfyJRdk`)
3. Add thumbnail to `public/thumbs/` or use Unsplash URL
4. Set appropriate category
5. Add attribution/creator credit
6. Test in UI

## Notes

- YouTube videos must be embeddable (not all videos allow embedding)
- Start/end times useful for long videos or music streams
- Consider copyright for music/videos
- Test across browsers for iframe compatibility
- LocalStorage has 5-10MB limit (plenty for theme IDs)
