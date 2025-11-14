/**
 * Example Usage of LearningSpace Component
 * 
 * This file demonstrates how to integrate the LearningSpace component
 * into your React application.
 */

import LearningSpace from './LearningSpace';
import '../student/styles/learningSpace.css';

/**
 * Basic Usage
 */
export function BasicExample() {
  return <LearningSpace />;
}

/**
 * With Custom Styling
 */
export function StyledExample() {
  return <LearningSpace className="custom-learning-space" />;
}

/**
 * Full Page Example
 */
export default function LearningSpaceDemo() {
  return (
    <div className="w-full h-screen">
      <LearningSpace />
    </div>
  );
}

/**
 * Integration Notes:
 * 
 * 1. Make sure to import the custom CSS file:
 *    import '@/modules/student/styles/learningSpace.css';
 * 
 * 2. The component uses Font Awesome icons loaded via CDN.
 *    The CDN link is included in the component itself.
 * 
 * 3. For a full-screen experience, ensure the parent container
 *    has 100vh height.
 * 
 * 4. The component manages its own state. To persist data,
 *    consider lifting state up or using a state management solution.
 */
