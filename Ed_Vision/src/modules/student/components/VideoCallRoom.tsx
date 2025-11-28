import { useState } from 'react';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomTitle: string;
};

type Participant = {
  id: number;
  name: string;
  isPresenting?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  avatar?: string;
};

export default function VideoCallRoom({ visible, onClose, roomTitle }: Props) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'room' | 'participants'>('room');

  const participants: Participant[] = [
    { id: 1, name: 'tothestars', isVideoOff: true, isMuted: true },
    { id: 2, name: 'tothestars', isPresenting: true, isMuted: false },
    { id: 3, name: 'ahmedquadri450', isMuted: false },
    { id: 4, name: 'raizelt', isMuted: false },
  ];

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
      <div className="w-full max-w-7xl h-[95vh] flex gap-4 p-6">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col gap-4">{/* Top Bar */}
          <div className="flex-shrink-0 backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-2xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fas fa-video text-pink-500"></i>
              <span className="text-white font-semibold">{roomTitle}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm">{participants.length} Participants</span>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition"
              >
                <i className={`fas ${showSidebar ? 'fa-chevron-right' : 'fa-users'} text-white/60`}></i>
              </button>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 backdrop-blur-[20px] bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-2 gap-4 overflow-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden aspect-video flex items-center justify-center group"
              >
                {participant.isPresenting ? (
                  // Screen Share View
                  <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center p-4">
                    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-red-50 to-yellow-50 p-6">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-red-600 mb-3">Clasificación de la Lumbalgia</h2>
                          <div className="space-y-2 text-left max-w-xl mx-auto text-sm">
                            <div className="text-purple-700 font-semibold mb-2">B. POR ALTERACIÓN NEUROFISIOLÓGICA:</div>
                            <div className="pl-4 space-y-1">
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-600">■</span>
                                <span className="text-gray-800">Síndrome de rama posterior.</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-600">■</span>
                                <span className="text-gray-800">Disfunción intervertebral menor.</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-600">■</span>
                                <span className="text-gray-800">Sensibilización espinal segmentaria.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : participant.isVideoOff ? (
                  // Video Off View
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-2">
                      <i className="fas fa-user text-white/40 text-2xl"></i>
                    </div>
                  </div>
                ) : (
                  // Video On View
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                    <img
                      src={`https://i.pravatar.cc/400?u=${participant.id}`}
                      alt={participant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Participant Name - Always Visible */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <i className={`fas ${participant.isMuted ? 'fa-microphone-slash text-red-400' : 'fa-microphone text-green-400'} text-xs`}></i>
                  <span className="text-white text-sm font-medium">{participant.name}</span>
                  {participant.isPresenting && (
                    <span className="text-xs text-pink-400 ml-1">(Presenting)</span>
                  )}
                </div>

                {/* Three Dots Menu */}
                <button className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <i className="fas fa-ellipsis-h text-white text-sm"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Control Bar */}
          <div className="flex-shrink-0 backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-2xl px-6 py-4 flex items-center justify-center gap-3">
            {/* Camera Toggle */}
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                isCameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-video-slash'} text-white`}></i>
            </button>

            {/* Microphone Toggle */}
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-white`}></i>
            </button>

            {/* Share Screen */}
            <button className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition">
              <i className="fas fa-desktop text-white"></i>
            </button>

            {/* More Options */}
            <button className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition">
              <i className="fas fa-ellipsis-h text-white"></i>
            </button>

            {/* End Call */}
            <button
              onClick={onClose}
              className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center transition ml-2"
            >
              <i className="fas fa-phone-slash text-white"></i>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-[320px] backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-2xl flex flex-col overflow-hidden">
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
                {/* Timer Display */}
                <div className="p-4 border-b border-white/10">
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
                </div>

                {/* Room Features */}
                <div className="p-4 space-y-3">
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

                  <div className="relative rounded-xl overflow-hidden bg-black/40 aspect-video">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                          <i className="fab fa-youtube text-white text-3xl"></i>
                        </div>
                        <p className="text-white/60 text-sm">Video không có sẵn</p>
                      </div>
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
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Participant Count */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 rounded-full">
                      <i className="fas fa-users text-pink-400 text-sm"></i>
                      <span className="text-white font-bold">{participants.length}</span>
                    </div>
                    <span className="text-white/60 text-sm">người tham gia</span>
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
                          <i className="fas fa-user text-white text-sm"></i>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-sm">{participant.name}</span>
                          {participant.isPresenting && (
                            <span className="text-pink-400 text-xs">Đang chia sẻ màn hình</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className={`fas ${participant.isMuted ? 'fa-microphone-slash text-red-400' : 'fa-microphone text-green-400'} text-sm`}></i>
                        <button className="opacity-0 group-hover:opacity-100 transition">
                          <i className="fas fa-ellipsis-h text-white/60 hover:text-white"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-t border-white/10">
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition flex items-center justify-center gap-2">
                    <i className="fas fa-user-plus"></i>
                    Mời người khác
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
