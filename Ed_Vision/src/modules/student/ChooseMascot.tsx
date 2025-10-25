import { useState } from "react"
import { Button } from "@/components//ui/student/Student_button"
import { Card, CardContent } from "@/components/ui/card"

type MascotId = "airi" | "bolt" | "mizu" | "luna"

interface Mascot {
  id: MascotId
  name: string
  emoji: string
  skillName: string
  skillIcon: string
  description: string
  gradient: string
}

type Props = {
  onConfirm?: (mascotId: MascotId) => void
  onSkip?: () => void
}

const mascots: Mascot[] = [
  {
    id: "airi",
    name: "Airi the Owl",
    emoji: "🦉",
    skillName: "Wisdom Boost",
    skillIcon: "🧠",
    description: "Gain extra XP for completing quizzes faster.",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
  {
    id: "bolt",
    name: "Bolt the Fox",
    emoji: "🦊",
    skillName: "Speed Learner",
    skillIcon: "⚡",
    description: "Reduce study timer cooldowns by 20%.",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
  {
    id: "mizu",
    name: "Mizu the Dolphin",
    emoji: "🐬",
    skillName: "Focus Flow",
    skillIcon: "🌊",
    description: "Extend your concentration streak bonus during focus sessions.",
    gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  },
  {
    id: "luna",
    name: "Luna the Cat",
    emoji: "🐱",
    skillName: "Curiosity Bonus",
    skillIcon: "🌙",
    description: "Unlock hidden insights or fun facts during lessons.",
    gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
  },
]

export default function ChooseMascot({ onConfirm, onSkip }: Props) {
  const [selectedMascot, setSelectedMascot] = useState<MascotId | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleSelectMascot = (mascotId: MascotId) => {
    setSelectedMascot(mascotId)
    setShowTooltip(true)
  }

  const handleConfirm = () => {
    if (selectedMascot) {
      if (onConfirm) {
        onConfirm(selectedMascot)
      } else {
        alert(
          `Great choice! ${selectedMascot.charAt(0).toUpperCase() + selectedMascot.slice(1)} will be your learning companion. Redirecting to Learning Adventure...`
        )
      }
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #E6E6FA 0%, #87CEEB 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-gray-800">PREDICA</span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div
              className="px-3 py-1 rounded-full backdrop-blur-[20px] border border-white/20"
              style={{ background: "rgba(255, 255, 255, 0.6)" }}
            >
              <span className="text-purple-600 font-semibold">XP 0</span>
            </div>
            <div
              className="px-3 py-1 rounded-full backdrop-blur-[20px] border border-white/20"
              style={{ background: "rgba(255, 255, 255, 0.6)" }}
            >
              <span className="text-gray-700 font-medium">Level 1 – Rookie Explorer</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Choose Your Learning Companion
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Each mascot has a unique skill to support your journey.
            </p>
          </div>

          {/* Mascot Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {mascots.map((mascot) => (
              <MascotCard
                key={mascot.id}
                mascot={mascot}
                isSelected={selectedMascot === mascot.id}
                onSelect={() => handleSelectMascot(mascot.id)}
              />
            ))}
          </div>

          {/* Tooltip */}
          <div
            className={`text-center mb-8 transition-all duration-300 ${
              showTooltip ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[10px]"
            }`}
          >
            <div
              className="inline-block px-6 py-3 rounded-2xl backdrop-blur-[20px] border border-white/20"
              style={{ background: "rgba(255, 255, 255, 0.6)" }}
            >
              <span className="text-purple-600 font-semibold flex items-center justify-center">
                <span className="mr-2">✨</span>
                Ready to begin your adventure!
                <span className="ml-2">✨</span>
              </span>
            </div>
          </div>

          {/* Action Area */}
          <div className="text-center">
            <Button
              onClick={handleConfirm}
              disabled={!selectedMascot}
              className="text-white font-bold py-4 px-12 rounded-2xl text-lg mb-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(102,126,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:bg-gray-400"
              style={{
                background: selectedMascot
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#9CA3AF",
              }}
            >
              Confirm Mascot
            </Button>
            <div>
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

interface MascotCardProps {
  mascot: Mascot
  isSelected: boolean
  onSelect: () => void
}

function MascotCard({ mascot, isSelected, onSelect }: MascotCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer transition-all duration-300 rounded-3xl"
      style={{
        background: isSelected
          ? "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1))"
          : "rgba(255, 255, 255, 0.6)",
        transform:
          isHovered && !isSelected
            ? "translateY(-8px) rotateY(5deg)"
            : isSelected
            ? "none"
            : "translateY(0) rotateY(0)",
        boxShadow: isSelected
          ? "0 0 30px rgba(124, 58, 237, 0.4)"
          : isHovered
          ? "0 20px 40px rgba(124, 58, 237, 0.2)"
          : "none",
      }}
    >
      <Card
        className={`rounded-3xl p-6 text-center backdrop-blur-[20px] border bg-transparent ${
          isSelected
            ? "border-purple-600 border-2 animate-[sparkle_2s_infinite]"
            : "border-white/20"
        }`}
      >
        <CardContent className="p-0">
        {/* Mascot Illustration */}
        <div
          className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-5xl mx-auto mb-4 transition-transform duration-300"
          style={{
            background: mascot.gradient,
            transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1) rotate(0)",
          }}
        >
          {mascot.emoji}
        </div>

        {/* Name and Skill Icon */}
        <div className="flex items-center justify-center mb-3">
          <h3 className="text-xl font-bold text-gray-800 mr-2">{mascot.name}</h3>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            <span className="text-white text-sm">{mascot.skillIcon}</span>
          </div>
        </div>

        {/* Skill Description */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-purple-600 mb-2">{mascot.skillName}</div>
          <p className="text-sm text-gray-600 leading-relaxed">{mascot.description}</p>
        </div>

        {/* Select Button */}
        <Button
          className={`w-full bg-white/50 hover:bg-white/70 text-gray-700 font-semibold py-2 px-4 rounded-xl transition-all duration-300 ${
            isSelected ? "animate-[pulse_2s_infinite]" : ""
          }`}
          variant="ghost"
        >
          {isSelected ? "Selected ✓" : "Select"}
        </Button>
      </CardContent>
    </Card>
    </div>
  )
}
