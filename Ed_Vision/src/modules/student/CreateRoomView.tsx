import { useState } from 'react'
import { Minus, Plus, Copy, Image as ImageIcon, Users } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function CreateRoomView() {
  const [roomTitle, setRoomTitle] = useState('Computer Science 101')
  const [roomSubtitle, setRoomSubtitle] = useState('Programming Basics · Prof. Lee')
  const [roomDescription, setRoomDescription] = useState('Learn the fundamentals of programming with hands-on exercises.')
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop')
  const [maxParticipants, setMaxParticipants] = useState(30)
  const [selectedGradient, setSelectedGradient] = useState('gradient-overlay')
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const gradients = [
    { value: 'gradient-overlay', class: 'bg-gradient-to-br from-blue-500/80 to-purple-600/80' },
    { value: 'gradient-amber', class: 'bg-gradient-to-br from-amber-500/80 to-orange-600/80' },
    { value: 'gradient-green', class: 'bg-gradient-to-br from-green-500/80 to-emerald-600/80' },
    { value: 'gradient-pink', class: 'bg-gradient-to-br from-pink-500/80 to-rose-600/80' },
    { value: 'gradient-red', class: 'bg-gradient-to-br from-red-500/80 to-pink-600/80' },
    { value: 'gradient-indigo', class: 'bg-gradient-to-br from-indigo-500/80 to-blue-600/80' }
  ]

  const galleryImages = [
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop'
  ]

  const handleSelectImage = (url: string) => {
    setCoverUrl(url)
    setIsGalleryOpen(false)
  }

  const getGradientClass = (gradientValue: string) => {
    const gradient = gradients.find(g => g.value === gradientValue)
    return gradient ? gradient.class : gradients[0].class
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Create Room</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Room Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Title *</label>
              <input 
                type="text" 
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                maxLength={60}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1">60 characters max</div>
            </div>
            
            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
              <input 
                type="text" 
                value={roomSubtitle}
                onChange={(e) => setRoomSubtitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="computer-science">Computer Science</option>
                <option value="history">History</option>
                <option value="biology">Biology</option>
                <option value="art-design">Art & Design</option>
                <option value="language">Language</option>
                <option value="economics">Economics</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
              <div className="space-y-3">
                <input 
                  type="url" 
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button 
                  type="button"
                  onClick={() => setIsGalleryOpen(true)}
                  className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose from gallery
                </button>
              </div>
            </div>
            
            {/* Gradient Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Gradient Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {gradients.map((gradient) => (
                  <button
                    key={gradient.value}
                    type="button"
                    onClick={() => setSelectedGradient(gradient.value)}
                    className={`w-full h-12 rounded-xl ${gradient.class} border-2 transition-all ${
                      selectedGradient === gradient.value 
                        ? 'border-purple-500 ring-2 ring-purple-200' 
                        : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Visibility</label>
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button 
                  type="button"
                  className="flex-1 px-4 py-2 text-sm font-medium bg-white text-gray-900 rounded-xl shadow-sm"
                >
                  Public
                </button>
                <button 
                  type="button"
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Private
                </button>
              </div>
            </div>
            
            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setMaxParticipants(Math.max(1, maxParticipants - 1))}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  type="button"
                  onClick={() => setMaxParticipants(maxParticipants + 1)}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Schedule</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    defaultChecked
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Start immediately</span>
                </label>
                <div className="grid grid-cols-2 gap-3 opacity-50">
                  <input 
                    type="date" 
                    disabled
                    className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none"
                  />
                  <input 
                    type="time" 
                    disabled
                    className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Advanced Settings */}
            <details className="bg-gray-50 rounded-2xl">
              <summary className="px-6 py-4 cursor-pointer font-medium text-gray-700">
                Advanced Settings
              </summary>
              <div className="px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value="CS101-2024" 
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl"
                    />
                    <button 
                      type="button"
                      className="px-4 py-3 text-purple-600 border border-purple-200 rounded-2xl hover:bg-purple-50"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      defaultChecked
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Enable Chat</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      defaultChecked
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Enable File Share</span>
                  </label>
                </div>
              </div>
            </details>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <button 
                type="button"
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-2xl font-medium hover:bg-purple-700 transition-colors"
              >
                Create Room
              </button>
              <button 
                type="button"
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              >
                Save as Draft
              </button>
              <button 
                type="button"
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          
          {/* Live Preview */}
          <div className="lg:sticky lg:top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative aspect-video">
                <img 
                  src={coverUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 ${getGradientClass(selectedGradient)}`} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {roomTitle || 'Untitled Room'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {roomSubtitle || 'No subtitle'}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>0 students · Live soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Choose Cover Image</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectImage(url)}
                  className="aspect-video rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                >
                  <img 
                    src={url} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
