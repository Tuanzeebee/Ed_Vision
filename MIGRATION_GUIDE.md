# Migration Guide - Learning Space Performance Update

## Overview
This guide helps you understand the changes made to the Learning Space component and how to work with the new optimized architecture.

## What Changed?

### 1. Component Imports
**Before:**
```typescript
import MusicPanel from './components/MusicPanel';
import ThemePanel from './components/ThemePanel';
```

**After:**
```typescript
const MusicPanel = lazy(() => import('./components/MusicPanel'));
const ThemePanel = lazy(() => import('./components/ThemePanel'));
```

### 2. Component Rendering
**Before:**
```tsx
<MusicPanel visible={visible} {...props} />
```

**After:**
```tsx
{visible && (
  <Suspense fallback={null}>
    <MusicPanel visible={visible} {...props} />
  </Suspense>
)}
```

### 3. LocalStorage Operations
**Before:**
```typescript
localStorage.setItem('key', JSON.stringify(value));
const data = JSON.parse(localStorage.getItem('key'));
```

**After:**
```typescript
import { setCachedItem, getCachedItem } from '@/lib/cacheStorage';

setCachedItem('key', value);
const data = getCachedItem('key', defaultValue);
```

## New Features You Can Use

### 1. Performance Monitoring
```typescript
import { performanceMonitor } from '@/lib/performanceUtils';

// In your component
useEffect(() => {
  performanceMonitor.start('my-operation');
  
  // Your code here
  
  performanceMonitor.end('my-operation');
  performanceMonitor.report();
}, []);
```

### 2. Image Preloading
```typescript
import { useImagePreloader } from '@/hooks/useImagePreloader';

const { isImageLoaded, progress } = useImagePreloader([
  '/image1.jpg',
  '/image2.jpg',
], {
  enabled: true,
  priority: 'low', // or 'high'
});
```

### 3. Cache Storage
```typescript
import { setCachedItem, getCachedItem, batchSetCached } from '@/lib/cacheStorage';

// Single item
setCachedItem('user-settings', settings, 3600000); // 1 hour expiry

// Batch operations
batchSetCached({
  'setting1': value1,
  'setting2': value2,
  'setting3': value3,
});

// Get with default
const settings = getCachedItem('user-settings', defaultSettings);
```

### 4. Device Detection
```typescript
import { isLowEndDevice, getOptimizationRecommendations } from '@/lib/performanceUtils';

if (isLowEndDevice()) {
  // Reduce animations, lower quality, etc.
}

const recommendations = getOptimizationRecommendations();
if (recommendations.reduceAnimations) {
  // Disable heavy animations
}
```

## Breaking Changes

### None!
All changes are backward compatible. The API remains the same for all components.

## Testing Your Code

### 1. Development Testing
```bash
cd Ed_Vision
npm run dev
```
Open browser DevTools → Performance tab and monitor:
- Initial load time
- Time to interactive
- Memory usage
- Network requests

### 2. Production Testing
```bash
npm run build
npm run preview
```

### 3. Performance Metrics
```typescript
// Add this to your component for debugging
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    performanceMonitor.start('component-mount');
    return () => {
      performanceMonitor.end('component-mount');
      performanceMonitor.report();
    };
  }
}, []);
```

## Common Patterns

### Pattern 1: Lazy Loading New Heavy Component
```typescript
// 1. Import as lazy
const NewHeavyComponent = lazy(() => import('./components/NewHeavyComponent'));

// 2. Add state for visibility
const [newComponentVisible, setNewComponentVisible] = useState(false);

// 3. Render conditionally with Suspense
{newComponentVisible && (
  <Suspense fallback={<div>Loading...</div>}>
    <NewHeavyComponent
      visible={newComponentVisible}
      onClose={() => setNewComponentVisible(false)}
    />
  </Suspense>
)}
```

### Pattern 2: Memoizing Callbacks
```typescript
// Before
const handleClick = () => {
  doSomething();
};

// After
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

### Pattern 3: Memoizing Computed Values
```typescript
// Before
const filteredItems = items.filter(item => item.active);

// After
const filteredItems = useMemo(
  () => items.filter(item => item.active),
  [items]
);
```

### Pattern 4: Async State Updates
```typescript
// Before
setState(newValue);
localStorage.setItem('key', newValue);

// After
setState(newValue);
setCachedItem('key', newValue); // Non-blocking
```

## Troubleshooting

### Issue: Component not loading
**Cause:** Missing Suspense wrapper
**Solution:** Wrap lazy component with Suspense
```tsx
<Suspense fallback={null}>
  <LazyComponent />
</Suspense>
```

### Issue: Cache not working
**Cause:** Using old localStorage methods
**Solution:** Use cacheStorage utilities
```typescript
import { getCachedItem, setCachedItem } from '@/lib/cacheStorage';
```

### Issue: Performance not improved
**Cause:** May need to clear cache
**Solution:**
```typescript
import { clearCache } from '@/lib/cacheStorage';
clearCache('ed-vision'); // Clear app-specific cache
```

## Best Practices

1. **Always use Suspense with lazy components**
2. **Memoize callbacks passed to child components**
3. **Use cacheStorage for all localStorage operations**
4. **Preload critical images**
5. **Monitor performance in development**
6. **Test on low-end devices**
7. **Use conditional rendering for panels**

## Performance Checklist

- [ ] New heavy components are lazy loaded
- [ ] All lazy components have Suspense wrappers
- [ ] Callbacks are memoized with useCallback
- [ ] Computed values use useMemo
- [ ] LocalStorage uses cacheStorage utilities
- [ ] Critical images are preloaded
- [ ] Performance is monitored in development
- [ ] Tested on low-end device

## Need Help?

1. Check Chrome DevTools → Performance tab
2. Run `performanceMonitor.report()` in console
3. Review PERFORMANCE_OPTIMIZATIONS.md
4. Check PERFORMANCE_SUMMARY_VI.md for Vietnamese docs

## Resources

- **Performance Docs**: `PERFORMANCE_OPTIMIZATIONS.md`
- **Summary (Vietnamese)**: `PERFORMANCE_SUMMARY_VI.md`
- **Cache Utils**: `src/lib/cacheStorage.ts`
- **Performance Utils**: `src/lib/performanceUtils.ts`
- **Preloader Hook**: `src/hooks/useImagePreloader.ts`

---

Happy coding! 🚀
