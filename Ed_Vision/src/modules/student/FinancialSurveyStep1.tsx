import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { BackButton } from "@/components/ui/student/Student_BackButton"

type IncomeRange = 'under-10' | '10-20' | '20-30' | 'over-30'

type Props = {
  onNext?: (selectedOption: IncomeRange) => void
  onBack?: () => void
}

export default function FinancialSurveyStep1({ onNext, onBack }: Props) {
  const [selectedOption, setSelectedOption] = useState<IncomeRange | null>(null)

  const incomeOptions = [
    { value: 'under-10' as const, label: 'Dưới 10 triệu' },
    { value: '10-20' as const, label: '10–20 triệu' },
    { value: '20-30' as const, label: '20–30 triệu' },
    { value: 'over-30' as const, label: 'Trên 30 triệu' }
  ]

  const handleOptionSelect = (value: IncomeRange) => {
    setSelectedOption(value)
  }

  const handleContinue = () => {
    if (selectedOption && onNext) {
      onNext(selectedOption)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, value: IncomeRange) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOptionSelect(value)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-3 md:p-4">
          <BackButton onBack={handleBack} />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 pb-6">
          <div className="w-full max-w-md">
            {/* Instruction Text */}
            <p className="text-center text-gray-600 mb-4 text-sm leading-relaxed px-2">
              Trả lời một số câu hỏi nhanh để chúng tôi giúp bạn phân tích mức độ hỗ trợ tài chính từ gia đình một cách chính xác nhất.
            </p>

            {/* Survey Card */}
            <Card className="bg-white rounded-lg shadow-md">
              <CardContent className="p-4 md:p-5">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700">Câu hỏi 1 / 4</span>
                    <span className="text-sm font-medium text-[#5B4BDB]">25%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-[#5B4BDB] h-1 rounded-full transition-all duration-300" 
                      style={{ width: '25%' }}
                    />
                  </div>
                </div>

                {/* Question */}
                <h2 className="text-base md:text-ms font-bold text-gray-900 mb-4 leading-tight">
                  Thu nhập hằng tháng trung bình của gia đình bạn khoảng bao nhiêu?
                </h2>

                {/* Options */}
                <div className="space-y-2 mb-4" role="radiogroup" aria-labelledby="income-question">
                  {incomeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleOptionSelect(option.value)}
                      onKeyDown={(e) => handleKeyDown(e, option.value)}
                      className={`w-full p-2.5 md:p-3 text-left border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB] focus:ring-offset-1 text-sm font-medium cursor-pointer ${
                        selectedOption === option.value
                          ? 'border-[#5B4BDB] bg-[#F3F2FF] text-[#5B4BDB]'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      role="radio"
                      aria-checked={selectedOption === option.value}
                      tabIndex={0}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Continue Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedOption}
                    className={`px-5 md:px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                      selectedOption
                        ? 'bg-[#5B4BDB] text-white hover:bg-purple-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5B4BDB] focus:ring-offset-2'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    aria-disabled={!selectedOption}
                  >
                    Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}