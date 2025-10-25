import { useNavigate } from "react-router-dom"
import MeetingDetailView from "./MeetingDetailView"

export default function MeetingDetailDemo() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <MeetingDetailView
        date="17/01/2024"
        weekday="Thứ 4"
        onBack={() => {
          navigate("/teacher/appointments")
        }}
      />
    </div>
  )
}
