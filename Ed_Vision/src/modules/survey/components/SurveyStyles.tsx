// Tailwind class utilities cho Survey components
// Dùng để tái sử dụng styles khi load câu hỏi từ DB

export const surveyStyles = {
  // Glass card effect
  glassCard: "bg-white/90 backdrop-blur-md border border-white/50 shadow-[0_4px_16px_0_rgba(31,38,135,0.1)]",
  
  // Gradient background
  gradientBg: "bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100",
  
  // Choice card
  choiceCard: {
    base: "p-3 border-2 border-gray-200 rounded-xl text-left bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]",
    selected: "bg-gradient-to-br from-indigo-300 to-purple-300 text-white border-transparent",
  },
  
  // Likert scale button
  likertButton: {
    base: "w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-gray-300 bg-white font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5",
    selected: "bg-gradient-to-br from-indigo-300 to-purple-300 text-white border-transparent",
  },
  
  // Checkbox label wrapper
  checkboxLabel: {
    base: "flex items-center p-3 bg-white border-2 rounded-xl hover:border-indigo-300 transition-all cursor-pointer",
    checked: "border-indigo-400 bg-indigo-50",
    unchecked: "border-gray-200",
  },
  
  // Slider
  slider: {
    track: "w-full h-1.5 rounded-full outline-none cursor-pointer appearance-none",
    thumb: "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-indigo-300 [&::-webkit-slider-thumb]:to-purple-300 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(99,102,241,0.3)] [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-indigo-300 [&::-moz-range-thumb]:to-purple-300 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(99,102,241,0.3)]",
  },
  
  // Checkbox custom
  checkbox: "w-5 h-5 rounded border-2 border-gray-300 transition-all duration-200 accent-indigo-400 checked:bg-gradient-to-br checked:from-indigo-300 checked:to-purple-300 checked:border-transparent",
  
  // Primary button
  primaryButton: "bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300",
  
  // Secondary button
  secondaryButton: "bg-white/90 backdrop-blur-md border border-white/50 text-gray-700 font-semibold rounded-xl hover:bg-white/95 transition-all duration-300",
  
  // Disabled button
  disabledButton: "opacity-50 cursor-not-allowed from-gray-300 to-gray-400",
  
  // Fade in animation
  fadeIn: "animate-[fadeIn_0.4s_ease-in]",
} as const;

// Slider gradient backgrounds theo loại câu hỏi
export const sliderGradients = {
  stress: {
    track: "bg-gradient-to-r from-green-300 via-yellow-300 to-red-400",
    bg: "bg-gradient-to-r from-green-50 via-yellow-50 to-red-50",
  },
  study: {
    track: "bg-gradient-to-r from-blue-300 to-indigo-400",
    bg: "bg-blue-50/50",
  },
  work: {
    track: "bg-gradient-to-r from-emerald-300 to-teal-400",
    bg: "bg-emerald-50/50",
  },
  financial: {
    track: "bg-gradient-to-r from-blue-300 via-purple-300 to-pink-400",
    bg: "bg-purple-50/50",
  },
  default: {
    track: "bg-gradient-to-r from-indigo-300 to-purple-400",
    bg: "bg-indigo-50/50",
  },
} as const;
