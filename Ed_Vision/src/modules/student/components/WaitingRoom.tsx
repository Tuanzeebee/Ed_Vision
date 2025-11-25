import { useState } from 'react';

type Props = {
  visible: boolean;
  onClose: () => void;
  onJoinCall: () => void;
  roomTitle: string;
};

export default function WaitingRoom({ visible, onClose, onJoinCall, roomTitle }: Props) {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'room' | 'participants'>('room');

  // Mock participants data
  const participants = [
    { id: 1, name: 'shesxherry', avatar: null, isHost: false },
    { id: 2, name: 'tem', avatar: null, isHost: false },
    { id: 3, name: 'kokoj6875', avatar: null, isHost: false },
    { id: 4, name: 'govtexams', avatar: '/avatar4.jpg', isHost: false },
    { id: 5, name: 'nobodyblue', avatar: '/avatar5.jpg', isHost: false },
    { id: 6, name: 'auroraeos01', avatar: null, isHost: true },
    { id: 7, name: 'salmazahir896', avatar: '/avatar7.jpg', isHost: false },
  ];

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-[90vh] flex gap-4 p-6">
        {/* Left Panel - Settings */}
        <div className="w-[400px] bg-[#1a1a1a] rounded-2xl p-6 flex flex-col">
          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold mb-2">Tham gia cuộc gọi</h2>
            <p className="text-white/60 text-sm">{roomTitle}</p>
          </div>

          {/* Camera/Mic Toggle */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-video-slash'} text-white`}></i>
                </div>
                <span className="text-white font-medium">Camera</span>
              </div>
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`relative w-12 h-6 rounded-full transition ${
                  isCameraOn ? 'bg-pink-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isCameraOn ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-white`}></i>
                </div>
                <span className="text-white font-medium">Microphone</span>
              </div>
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`relative w-12 h-6 rounded-full transition ${
                  isMicOn ? 'bg-pink-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isMicOn ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Participants Info */}
            <div className="mt-8 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-users text-white/60"></i>
                <span className="text-white/60 text-sm">Người tham gia</span>
              </div>
              <p className="text-white text-2xl font-bold">3 người</p>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={onJoinCall}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-full transition text-lg shadow-lg hover:shadow-xl"
          >
            Tham gia cuộc gọi
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-3 mt-3 text-white/60 hover:text-white transition text-sm flex items-center justify-center gap-2"
          >
            <i className="fas fa-times"></i>
            Hủy
          </button>
        </div>

        {/* Right Panel - Video Preview */}
        <div className="flex-1 bg-[#2a2d3a] rounded-2xl flex items-center justify-center relative overflow-hidden">
          {isCameraOn ? (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-video text-white/40 text-6xl mb-4"></i>
                <p className="text-white/60">Camera preview</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 bg-[#3a3d4a] rounded-full flex items-center justify-center mb-6 border-4 border-white/10">
                <i className="fas fa-user text-white/40 text-5xl"></i>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Camera đã tắt</h3>
              <p className="text-white/60 text-sm">Bật camera để người khác nhìn thấy bạn</p>
            </div>
          )}

          {/* Audio Indicator */}
          {isMicOn && (
            <div className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-sm">Mic đang bật</span>
            </div>
          )}

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-full flex items-center justify-center transition"
          >
            <i className={`fas ${showSidebar ? 'fa-chevron-right' : 'fa-users'} text-white`}></i>
          </button>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-[320px] bg-[#1a1a1a] rounded-2xl flex flex-col overflow-hidden">
            {/* Tab Header */}
            <div className="flex-shrink-0 border-b border-white/10">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarTab('room')}
                  className={`flex-1 py-4 px-4 text-sm font-semibold transition ${
                    sidebarTab === 'room'
                      ? 'text-white border-b-2 border-pink-500'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Phòng
                </button>
                <button
                  onClick={() => setSidebarTab('participants')}
                  className={`flex-1 py-4 px-4 text-sm font-semibold transition ${
                    sidebarTab === 'participants'
                      ? 'text-white border-b-2 border-pink-500'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Thành viên
                </button>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-12 h-12 hover:bg-white/10 flex items-center justify-center transition"
                >
                  <i className="fas fa-times text-white/60"></i>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {sidebarTab === 'room' ? (
              <div className="flex-1 overflow-y-auto">
                {/* Room Detail Section */}
                <div className="p-4 border-b border-white/10">
              
              {/* Timer Display */}
              <div className="text-center mb-4">
                <div className="text-white text-5xl font-bold mb-2">25 : 00</div>
                <div className="flex items-center justify-center gap-4">
                  <button className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition">
                    <i className="far fa-heart text-white/60 text-lg"></i>
                  </button>
                  <button className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition">
                    <i className="fas fa-external-link-alt text-white/60 text-lg"></i>
                  </button>
                </div>
              </div>

              {/* Room Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-cube text-white/60"></i>
                    <span className="text-white text-sm">Chế độ nhóm</span>
                  </div>
                  <button className="relative w-12 h-6 rounded-full bg-pink-500">
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <i className="fab fa-youtube text-white/60"></i>
                    <span className="text-white text-sm">Video Youtube</span>
                  </div>
                  <button className="relative w-12 h-6 rounded-full bg-pink-500">
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>

                {/* Youtube Video Input */}
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl">
                  <input
                    type="text"
                    placeholder="Youtube Video"
                    className="flex-1 bg-transparent text-white/60 text-sm outline-none px-2"
                  />
                  <button className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition">
                    <i className="fas fa-sync-alt text-white/60"></i>
                  </button>
                  <button className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition">
                    <i className="fas fa-search text-white/60"></i>
                  </button>
                </div>

                {/* Youtube Video Preview */}
                <div className="relative rounded-xl overflow-hidden bg-[#2a2d3a] aspect-video">
                  <img 
                    src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=225&fit=crop" 
                    alt="Video preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                      <i className="fab fa-youtube text-white text-3xl"></i>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                    <img 
                      src="https://via.placeholder.com/24" 
                      alt="Channel"
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-white text-xs">sometimes, it's ok...</span>
                    <button className="text-white/60 hover:text-white">
                      <i className="fas fa-ellipsis-v text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-th text-white/60"></i>
                    <span className="text-white text-sm">Tập trung</span>
                  </div>
                  <button className="relative w-12 h-6 rounded-full bg-white/20">
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Participants Section */}
                <div className="p-4 border-b border-white/10">
                  {/* Participant Count and Actions */}
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                      <i className="fas fa-users text-white/80 text-sm"></i>
                      <span className="text-white font-bold">{participants.length}</span>
                    </div>
                    <button className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition">
                      <i className="fas fa-crown text-yellow-400"></i>
                    </button>
                    <button className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition">
                      <i className="fas fa-clock text-white/60"></i>
                    </button>
                  </div>
                </div>

                {/* Participants List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                          {participant.avatar ? (
                            <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fas fa-user text-white text-sm"></i>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{participant.name}</span>
                            {participant.isHost && (
                              <i className="fas fa-crown text-yellow-400 text-xs"></i>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition">
                        <i className="fas fa-ellipsis-h text-white/60 hover:text-white"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
