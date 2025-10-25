import { MessageCircle } from "lucide-react"

export default function ChatView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chat Coming Soon</h3>
        <p className="text-gray-600">Connect with your study partners and classmates.</p>
      </div>
    </div>
  )
}
