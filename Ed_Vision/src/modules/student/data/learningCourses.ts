export type LearningCourseMapLayout =
  | 'linear'
  | 'branching'
  | 'spiral'
  | 'tree'
  | 'circular';

export type StudentLearningCourse = {
  id: string;
  name: string;
  subject: string;
  moduleCount: number;
  completedModules: number;
  totalStars: number;
  earnedStars: number;
  mapLayout: LearningCourseMapLayout;
  description: string;
};

export const STUDENT_LEARNING_COURSES: StudentLearningCourse[] = [
  {
    id: 'ai-101',
    name: 'Artificial Intelligence Fundamentals',
    subject: 'Computer Science',
    moduleCount: 7,
    completedModules: 4,
    totalStars: 21,
    earnedStars: 11,
    mapLayout: 'linear',
    description: 'Learn the basics of AI and machine learning'
  },
  {
    id: 'ds-201',
    name: 'Data Structures & Algorithms',
    subject: 'Computer Science',
    moduleCount: 8,
    completedModules: 5,
    totalStars: 24,
    earnedStars: 15,
    mapLayout: 'branching',
    description: 'Master fundamental data structures'
  },
  {
    id: 'web-301',
    name: 'Web Development Advanced',
    subject: 'Software Engineering',
    moduleCount: 9,
    completedModules: 3,
    totalStars: 27,
    earnedStars: 9,
    mapLayout: 'spiral',
    description: 'Build modern web applications'
  },
  {
    id: 'db-401',
    name: 'Database Systems',
    subject: 'Information Systems',
    moduleCount: 10,
    completedModules: 2,
    totalStars: 30,
    earnedStars: 6,
    mapLayout: 'tree',
    description: 'Design and manage databases'
  },
  {
    id: 'sec-501',
    name: 'Cybersecurity Essentials',
    subject: 'Network Security',
    moduleCount: 11,
    completedModules: 1,
    totalStars: 33,
    earnedStars: 3,
    mapLayout: 'circular',
    description: 'Protect systems and data'
  }
];
