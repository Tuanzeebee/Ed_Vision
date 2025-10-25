import { Heart, Users, Share } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FavoriteRoom {
  id: string
  title: string
  subtitle: string
  students: string
  image: string
  gradient: string
}

export default function FavoritesView() {
  const favoriteRooms: FavoriteRoom[] = [
    {
      id: 'biology',
      title: 'Biology Workshop',
      subtitle: 'Cell Biology · Dr. Garcia',
      students: '14',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=225&fit=crop',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'art',
      title: 'Art & Design',
      subtitle: 'Digital Art · Ms. Taylor',
      students: '11',
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      id: 'economics',
      title: 'Economics Study Group',
      subtitle: 'Microeconomics · Prof. Anderson',
      students: '21',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
      gradient: 'from-indigo-500 to-blue-600'
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Rooms</h2>
        
        {/* Sorting and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-3 flex-wrap">
            <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              All
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              CS
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              Biology
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              Art
            </button>
          </div>
          <select className="px-4 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>Recently added</option>
            <option>Most active</option>
            <option>A-Z</option>
          </select>
        </div>
      </div>
      
      {/* Favorites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteRooms.map((room) => (
          <Card 
            key={room.id}
            className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
          >
            <div className="relative aspect-video">
              <img 
                src={room.image} 
                alt={room.title}
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${room.gradient}/80`} />
              <button className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-red-500 hover:bg-white transition-all">
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{room.title}</h3>
              <p className="text-gray-600 mb-4">{room.subtitle}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{room.students} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                    Join
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Share className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
