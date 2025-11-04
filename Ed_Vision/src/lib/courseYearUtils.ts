/**
 * Course Year Utilities
 * Helper functions for generating and managing course years
 */

/**
 * Generate available course years based on current date
 * Base year: K28 started in August 2022
 * Each August, a new course year begins (start of academic year)
 * 
 * Current courses (as of Nov 2025): K28, K29, K30, K31
 * K32 will be added in August 2026
 */
export const getAvailableCourseYears = (): string[] => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Base: K28 started in August 2022
  const baseYear = 2022;
  const baseCourseNumber = 28;
  
  // Calculate how many years have passed since base year
  let yearsPassed = currentYear - baseYear;
  
  // Only add the new course year if we're in August or later of the current year
  if (currentMonth >= 8) {
    yearsPassed += 1;
  }
  
  // Generate course years array
  const courseYears: string[] = [];
  for (let i = 0; i < yearsPassed; i++) {
    courseYears.push(`K${baseCourseNumber + i}`);
  }
  
  return courseYears;
};
