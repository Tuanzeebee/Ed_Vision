import { Search, PlusCircle, MessageCircle, Heart } from "lucide-react"

interface Friend {
  id: string
  name: string
  initials: string
  status: 'online' | 'offline' | 'in-room'
  statusText: string
  avatarGradient: string
}

export default function FriendsView() {
  const friends: Friend[] = [
    {
      id: '1',
      name: 'Linh Nguyễn',
      initials: 'LN',
      status: 'online',
      statusText: 'CS Freshman · Online now',
      avatarGradient: 'from-blue-500 to-purple-600'
    },
    {
      id: '2',
      name: 'Huy Phạm',
      initials: 'HP',
      status: 'offline',
      statusText: 'History Seminar · Last active 12 min ago',
      avatarGradient: 'from-amber-500 to-orange-600'
    },
    {
      id: '3',
      name: 'Trâm Lê',
      initials: 'TL',
      status: 'in-room',
      statusText: 'Biology Workshop · In a room',
      avatarGradient: 'from-green-500 to-emerald-600'
    },
    {
      id: '4',
      name: 'Minh Châu',
      initials: 'MC',
      status: 'offline',
      statusText: 'Spanish Exchange · Available this evening',
      avatarGradient: 'from-pink-500 to-rose-600'
    },
    {
      id: '5',
      name: 'Khoa Trần',
      initials: 'KT',
      status: 'online',
      statusText: 'Microeconomics · Online now',
      avatarGradient: 'from-indigo-500 to-blue-600'
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Friends</h2>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search friends..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">⌘K</span>
        </div>
        
        {/* Filter Pills */}
        <div className="flex gap-3 mb-6">
          <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            All
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
            Online
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
            Classmates
          </button>
        </div>
      </div>
      
      {/* Friends List */}
      <div className="space-y-4">
        {friends.map((friend) => (
          <div 
            key={friend.id}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${friend.avatarGradient} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {friend.initials}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                    friend.status === 'online' || friend.status === 'in-room' 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                  <p className="text-sm text-gray-600">{friend.statusText}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                  <PlusCircle className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
