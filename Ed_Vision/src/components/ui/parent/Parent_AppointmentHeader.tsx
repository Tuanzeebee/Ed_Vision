import { Button } from "@/components/ui/parent/Parent_button"
import iconBooking from "@/assets/parent/iconBooking.svg"
import iconClose from "@/assets/parent/iconCloseBig.svg"

type Props = {
  title?: string
  onClose?: () => void
}

export default function AppointmentHeader({ 
  title = "Book Appointment", 
  onClose 
}: Props) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-600 rounded-lg p-2 mr-3">
              <img src={iconBooking} alt="" className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <img src={iconClose} alt="" className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}