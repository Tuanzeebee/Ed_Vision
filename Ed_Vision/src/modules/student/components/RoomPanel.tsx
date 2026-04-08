import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import WaitingRoom, { type WaitingRoomJoinPayload } from './WaitingRoom';
import { TokenManager } from '@/lib/tokenManager';
import { studyRoomRealtime } from '@/services/student/studyRoomRealtime';
import {
  getStudyRoomErrorMessage,
  studyRoomService,
  type PublicStudyRoom,
} from '@/services/student/studyRoomService';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectRoom: (url: string) => void;
  onJoinCall?: (room: {
    roomId: number;
    roomTitle: string;
    password?: string;
    micOn: boolean;
    cameraOn: boolean;
    micDeviceId?: string;
    cameraDeviceId?: string;
    participantId: number;
    livekitToken: string;
    livekitUrl?: string;
  }) => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

type RoomCard = {
  id: string;
  roomId: number;
  title: string;
  url: string;
  roomMode: 'audio' | 'video' | 'focus';
  hasPassword: boolean;
  currentParticipantsCount: number;
  maxParticipants: number;
};

export default function RoomPanel({
  visible,
  onClose,
  onSelectRoom: _onSelectRoom,
  onJoinCall,
  initialX = (window.innerWidth - 900) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 900,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 600, 420);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'audio' | 'video' | 'focus'>('all');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'video' | 'voice' | 'focus'>('video');
  const [isLocked, setIsLocked] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [roomBackground, setRoomBackground] = useState('');
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [backgroundTab, setBackgroundTab] = useState<'static' | 'live'>('static');
  const [backgroundCategory, setBackgroundCategory] = useState<'custom' | 'exclusive' | 'chill' | 'focus' | 'anime' | 'pets' | 'kpop'>('custom');
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomCard | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicStudyRoom[]>([]);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isRealtimePreparing, setIsRealtimePreparing] = useState(false);
  const [isEndingRoom, setIsEndingRoom] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const loadPublicRooms = async () => {
    try {
      setRoomsLoading(true);
      setRoomsError(null);
      const rooms = await studyRoomService.getPublicRooms();
      setPublicRooms(rooms);
    } catch (error) {
      const message = getStudyRoomErrorMessage(error, 'Không thể tải danh sách phòng');
      setRoomsError(message);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    void loadPublicRooms();
  }, [visible]);

  useEffect(() => {
    if (!visible || studyRoomRealtime.isConnected()) {
      return;
    }

    const token = TokenManager.getToken();
    if (!token) {
      return;
    }

    let disposed = false;

    const warmupRealtime = async () => {
      try {
        setIsRealtimePreparing(true);
        await studyRoomRealtime.connect(token);
      } catch {
        // Ignore warmup errors here; action handlers will retry and show proper feedback.
      } finally {
        if (!disposed) {
          setIsRealtimePreparing(false);
        }
      }
    };

    void warmupRealtime();

    return () => {
      disposed = true;
    };
  }, [visible]);

  const roomCards = useMemo<RoomCard[]>(() => {
    return publicRooms.map((room) => ({
      id: String(room.roomId),
      roomId: room.roomId,
      title: room.title || `Phòng #${room.roomId}`,
      url:
        room.coverUrl ||
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop',
      roomMode: room.roomMode,
      hasPassword: room.hasPassword,
      currentParticipantsCount: room.currentParticipantsCount,
      maxParticipants: room.maxParticipants,
    }));
  }, [publicRooms]);

  const handleJoinRoom = (room: RoomCard) => {
    setSelectedRoom(room);
    setShowWaitingRoom(true);
  };

  const handleJoinCall = async (payload: WaitingRoomJoinPayload) => {
    if (isEndingRoom) {
      return;
    }

    if (selectedRoom) {
      try {
        setIsJoiningRoom(true);
        const joinResult = await studyRoomService.joinPublicRoom(payload.roomId, {
          password: payload.password,
        });

        if (!joinResult.success) {
          throw new Error('Join room rejected');
        }

        setShowWaitingRoom(false);
        onClose();

        if (onJoinCall) {
          onJoinCall({
            roomId: payload.roomId,
            roomTitle: selectedRoom.title,
            password: payload.password,
            micOn: payload.micOn,
            cameraOn: payload.cameraOn,
            micDeviceId: payload.micDeviceId,
            cameraDeviceId: payload.cameraDeviceId,
            participantId: joinResult.participantId,
            livekitToken: joinResult.livekitToken,
            livekitUrl: joinResult.livekitUrl ?? undefined,
          });
        }

        toast.success(`Đã vào phòng ${selectedRoom.title}`);
      } catch (error) {
        toast.error(getStudyRoomErrorMessage(error, 'Không thể vào phòng'));
      } finally {
        setIsJoiningRoom(false);
      }
    }
  };

  const handleEndRoomFromPreview = async (roomId: number) => {
    if (isEndingRoom || isRealtimePreparing) {
      return;
    }

    const token = TokenManager.getToken();
    if (!token) {
      toast.error('Vui lòng đăng nhập lại để kết thúc phòng.');
      return;
    }

    const roomTitleForToast = selectedRoom?.title ?? `#${roomId}`;

    try {
      setIsEndingRoom(true);
      if (!studyRoomRealtime.isConnected()) {
        await studyRoomRealtime.connect(token);
      }
      await studyRoomRealtime.endRoom({ roomId });

      toast.success(`Đã kết thúc phòng ${roomTitleForToast}.`);
      setPublicRooms((previous) =>
        previous.filter((room) => room.roomId !== roomId),
      );
      setShowWaitingRoom(false);
      setSelectedRoom(null);
      void loadPublicRooms();
    } catch (error) {
      toast.error(getStudyRoomErrorMessage(error, 'Không thể kết thúc phòng'));
    } finally {
      setIsEndingRoom(false);
    }
  };

  const handleCloseWaitingRoom = () => {
    if (isEndingRoom) {
      return;
    }

    setShowWaitingRoom(false);
    setSelectedRoom(null);
  };

  const resetCreateForm = () => {
    setShowCreateRoom(false);
    setRoomName('');
    setRoomType('video');
    setIsLocked(false);
    setRoomPassword('');
    setRoomBackground('');
    setCreateError(null);
  };

  const handleCreateRoom = async () => {
    const title = roomName.trim() || 'Phòng học mới';
    const password = roomPassword.trim();

    if (title.length > 255) {
      setCreateError('Tên phòng không được vượt quá 255 ký tự');
      return;
    }

    if (password.length > 120) {
      setCreateError('Mật khẩu không được vượt quá 120 ký tự');
      return;
    }

    const roomMode = roomType === 'voice' ? 'audio' : roomType;

    try {
      setIsCreatingRoom(true);
      setCreateError(null);

      const createdRoom = await studyRoomService.createStudyRoom({
        title,
        roomMode,
        password: isLocked ? password || undefined : undefined,
        coverType: roomBackground ? 'image' : undefined,
        coverUrl: roomBackground || undefined,
        isPublic: true,
      });

      if (roomBackground) {
        _onSelectRoom(roomBackground);
      }

      setPublicRooms((previous) => [
        {
          roomId: createdRoom.roomId,
          title: createdRoom.title,
          roomMode: createdRoom.roomMode,
          coverUrl: createdRoom.coverUrl,
          coverType: createdRoom.coverType,
          maxParticipants: createdRoom.maxParticipants,
          currentParticipantsCount: createdRoom.onlineCount,
          hasPassword: createdRoom.requiresPassword,
        },
        ...previous.filter((room) => room.roomId !== createdRoom.roomId),
      ]);

      toast.success(`Đã tạo phòng ${createdRoom.title}`);
      resetCreateForm();
    } catch (error) {
      setCreateError(getStudyRoomErrorMessage(error, 'Không thể tạo phòng mới'));
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Summer Special themes
  const summerSpecialThemes = [
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', name: 'Beach Sunset', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop', name: 'Ocean Waves', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1920&h=1080&fit=crop', name: 'Tropical Paradise', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1920&h=1080&fit=crop', name: 'Summer Vibes', author: 'Summer' },
  ];

  // All static backgrounds
  const allStaticBackgrounds = [
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop', name: 'Forest Path', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&h=1080&fit=crop', name: 'Waterfall', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop', name: 'Winter Landscape', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&h=1080&fit=crop', name: 'Misty Mountains', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1920&h=1080&fit=crop', name: 'Mountain Lake', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop', name: 'Mountain Range', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&h=1080&fit=crop', name: 'Foggy Hills', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1920&h=1080&fit=crop', name: 'Golden Hour', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop', name: 'Desert Sunset', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop', name: 'Northern Lights', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop', name: 'Alpine Lake', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1513366884929-f0b3d46eee4b?w=1920&h=1080&fit=crop', name: 'Cozy Cafe', author: 'Urban' },
  ];

  // Live themes
  const liveThemes = [
    { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&h=1080&fit=crop', name: 'Rainy Lofi Japan', author: 'Fall in Chill', featured: true },
    { url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&h=1080&fit=crop', name: 'Minimal Space', author: 'Lofi Study' },
    { url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=1920&h=1080&fit=crop', name: 'Cozy Cat Cafe', author: 'Chill Vibes' },
    { url: 'https://images.unsplash.com/photo-1513366884929-f0b3d46eee4b?w=1920&h=1080&fit=crop', name: 'Low Poly City', author: 'Study beats' },
    { url: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1920&h=1080&fit=crop', name: 'Peaceful Garden', author: 'Nature Sounds' },
    { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&h=1080&fit=crop', name: 'Forest Waterfall', author: 'Ambient' },
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop', name: 'Mountain View', author: 'Relax Music' },
    { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1920&h=1080&fit=crop', name: 'Sunset Sky', author: 'Chill Beats' },
    { url: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=1920&h=1080&fit=crop', name: 'Cozy Fireplace', author: 'Winter Vibes' },
    { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop', name: 'Aurora Borealis', author: 'Cosmic Sounds' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', name: 'Study with me', author: 'Focus Music' },
  ];

  const filtered = roomCards.filter((room) => {
    if (filter !== 'all' && room.roomMode !== filter) {
      return false;
    }

    if (search && !room.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  if (!visible) return null;

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex flex-col relative">
        <div
          className="flex-shrink-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-video text-white/80 text-lg"></i>
            <h2 className="text-xl font-semibold text-white">Phòng học</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {!showCreateRoom ? (
          <>
            <div className="flex-shrink-0 px-6 py-4 flex items-center gap-4">
              <div className="flex items-center bg-black/30 rounded-full px-3 py-1 gap-2">
                <i className="fas fa-search text-white/70"></i>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm phòng hoặc từ khóa"
                  className="bg-transparent text-white placeholder-white/60 outline-none text-sm w-64"
                />
              </div>

              <div className="flex items-center gap-2"> 
                <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-white/20 text-white' : 'text-white/70 bg-black/30'}`}>Tất cả</button>
                <button onClick={() => setFilter('video')} className={`px-3 py-1 rounded-full text-sm ${filter === 'video' ? 'bg-white/20 text-white' : 'text-white/70 bg-black/30'}`}>Video</button>
                <button onClick={() => setFilter('audio')} className={`px-3 py-1 rounded-full text-sm ${filter === 'audio' ? 'bg-white/20 text-white' : 'text-white/70 bg-black/30'}`}>Âm thanh</button>
                <button onClick={() => setFilter('focus')} className={`px-3 py-1 rounded-full text-sm ${filter === 'focus' ? 'bg-white/20 text-white' : 'text-white/70 bg-black/30'}`}>Tập trung</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-6 pb-6"> 
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-lg">Phòng đang mở</h3>
                  <button 
                    onClick={() => setShowCreateRoom(true)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-semibold rounded-full transition flex items-center gap-2"
                  >
                    <i className="fas fa-plus"></i>
                    Tạo phòng
                  </button>
                </div>

                {roomsError && (
                  <div className="mb-3 rounded-xl border border-red-300 bg-red-500/10 p-3 text-sm text-red-200">
                    {roomsError}
                    <button
                      onClick={() => void loadPublicRooms()}
                      className="ml-3 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/20"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {roomsLoading && (
                  <div className="mb-3 rounded-xl bg-white/10 p-3 text-sm text-white/80">
                    Đang tải danh sách phòng...
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  {filtered.map((room) => (
                    <div 
                      key={room.id} 
                      onClick={() => handleJoinRoom(room)}
                      className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-white/30 transition" 
                      style={{ backgroundImage: `url('${room.url.replace('w=1920&h=1080', 'w=600&h=360')}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="text-white text-sm font-semibold truncate">{room.title}</div>
                          <div className="text-white/70 text-[11px]">
                            {room.currentParticipantsCount}/{room.maxParticipants} · {room.roomMode === 'audio' ? 'âm thanh' : room.roomMode === 'focus' ? 'tập trung' : 'video'}
                            {room.hasPassword ? ' · có mật khẩu' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                        <i className="fas fa-sign-in-alt"></i>
                      </div>
                    </div>
                  ))}
                </div>

                {!roomsLoading && filtered.length === 0 && (
                  <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white/70">
                    Không tìm thấy phòng phù hợp.
                  </div>
                )}
              </div>

              
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto px-6 pb-6">
            {/* Create Room Content */}
            <div className="space-y-6 py-4">
              {/* Back Button */}
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex items-center gap-2 text-white/60 hover:text-white transition"
              >
                <i className="fas fa-arrow-left"></i>
                <span className="text-sm font-semibold">Quay lại</span>
              </button>

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-door-open text-white text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white">Phòng của tôi</h2>
              </div>

              {/* Room Name Input */}
              <div>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Nhập tên phòng"
                  className="w-full bg-transparent text-white placeholder-white/40 px-4 py-3 rounded-xl border border-white/10 focus:border-pink-500 focus:outline-none transition"
                />
              </div>

              {/* Room Type Selection */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setRoomType('video')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition ${
                    roomType === 'video'
                      ? 'bg-gradient-to-br from-pink-500 to-pink-600'
                      : 'bg-transparent border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    roomType === 'video' ? 'bg-white/20' : 'bg-slate-600'
                  }`}>
                    <i className="fas fa-video text-white text-lg"></i>
                  </div>
                  <span className="text-white text-sm font-bold text-center">Cuộc gọi video</span>
                </button>

                <button
                  onClick={() => setRoomType('voice')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition ${
                    roomType === 'voice'
                      ? 'bg-gradient-to-br from-pink-500 to-pink-600'
                      : 'bg-transparent border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    roomType === 'voice' ? 'bg-white/20' : 'bg-slate-600'
                  }`}>
                    <i className="fas fa-microphone text-white text-lg"></i>
                  </div>
                  <span className="text-white text-sm font-bold text-center">Cuộc gọi âm thanh</span>
                </button>

                <button
                  onClick={() => setRoomType('focus')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition ${
                    roomType === 'focus'
                      ? 'bg-gradient-to-br from-pink-500 to-pink-600'
                      : 'bg-transparent border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    roomType === 'focus' ? 'bg-white/20' : 'bg-slate-600'
                  }`}>
                    <i className="fas fa-stopwatch text-white text-lg"></i>
                  </div>
                  <span className="text-white text-sm font-bold text-center">Chế độ tập trung</span>
                </button>
              </div>

              {/* Room Lock Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-transparent rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <i className={`fas ${isLocked ? 'fa-lock' : 'fa-lock-open'} text-white/70 text-lg`}></i>
                    <span className="text-white font-bold">{isLocked ? 'Đã khóa' : 'Mở khóa'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsLocked(!isLocked);
                      if (isLocked) {
                        setRoomPassword('');
                      }
                    }}
                    className={`relative w-14 h-8 rounded-full transition ${
                      isLocked ? 'bg-pink-500' : 'bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        isLocked ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Password Input - Show when locked */}
                {isLocked && (
                  <div className="p-4 bg-transparent rounded-xl border border-white/10">
                    <label className="block text-white/80 text-sm font-bold mb-2 flex items-center gap-2">
                      <i className="fas fa-key"></i>
                      Mật khẩu phòng
                    </label>
                    <input
                      type="text"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder="Nhập mật khẩu để bảo vệ phòng"
                      className="w-full bg-transparent text-white placeholder-white/40 px-4 py-2.5 rounded-lg border border-white/10 focus:border-pink-500 focus:outline-none transition"
                    />
                    <p className="text-white/50 text-xs mt-2">Chỉ những người có mật khẩu mới có thể vào phòng</p>
                  </div>
                )}
              </div>

              {/* Room Background */}
              {!showBackgroundSelector ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 font-bold flex items-center gap-2">
                      <i className="fas fa-image"></i>
                      Ảnh bìa phòng
                    </span>
                    <button
                      onClick={() => setShowBackgroundSelector(true)}
                      className="group relative w-20 h-20 rounded-xl border-2 border-white/20 hover:border-pink-500 transition overflow-hidden"
                    >
                      {roomBackground ? (
                        <>
                          <div 
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${roomBackground}')` }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                            <i className="fas fa-edit text-white text-lg opacity-0 group-hover:opacity-100 transition"></i>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-white/5 group-hover:bg-white/10 transition flex items-center justify-center">
                          <div className="text-center">
                            <i className="fas fa-images text-white/60 text-2xl mb-1"></i>
                            <p className="text-white/60 text-[10px] font-semibold">Chọn ảnh</p>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {roomBackground && (
                    <div className="text-white/60 text-xs flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-400"></i>
                      Ảnh bìa đã được chọn
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Back Button */}
                  <button
                    onClick={() => setShowBackgroundSelector(false)}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition"
                  >
                    <i className="fas fa-arrow-left"></i>
                    <span className="text-sm font-semibold">Quay lại</span>
                  </button>

                  {/* Tabs */}
                  <div className="flex items-center gap-4 bg-transparent rounded-full p-1 w-fit">
                    <button
                      onClick={() => setBackgroundTab('static')}
                      className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundTab === 'static'
                          ? 'bg-white/20 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-image mr-2"></i>
                      Static Themes
                    </button>
                    <button
                      onClick={() => setBackgroundTab('live')}
                      className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundTab === 'live'
                          ? 'bg-white/20 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-play-circle mr-2"></i>
                      Live Themes
                    </button>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setBackgroundCategory('custom')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundCategory === 'custom'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 text-white/70 hover:bg-slate-600/50'
                      }`}
                    >
                      <i className="fas fa-camera text-lg"></i>
                      Custom
                    </button>
                    <button
                      onClick={() => setBackgroundCategory('exclusive')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundCategory === 'exclusive'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 text-white/70 hover:bg-slate-600/50'
                      }`}
                    >
                      <i className="fas fa-certificate text-lg"></i>
                      Exclusive
                    </button>
                    <button
                      onClick={() => setBackgroundCategory('chill')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundCategory === 'chill'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 text-white/70 hover:bg-slate-600/50'
                      }`}
                    >
                      <i className="fas fa-fan text-lg"></i>
                      Chill
                    </button>
                    <button
                      onClick={() => setBackgroundCategory('focus')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundCategory === 'focus'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 text-white/70 hover:bg-slate-600/50'
                      }`}
                    >
                      <i className="fas fa-book text-lg"></i>
                      Focus
                    </button>
                    <button
                      onClick={() => setBackgroundCategory('anime')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundCategory === 'anime'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 text-white/70 hover:bg-slate-600/50'
                      }`}
                    >
                      <i className="fas fa-star text-lg"></i>
                      Anime
                    </button>
                    <button
                      onClick={() => setBackgroundCategory('pets')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundCategory === 'pets'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 text-white/70 hover:bg-slate-600/50'
                      }`}
                    >
                      <i className="fas fa-paw text-lg"></i>
                      Pets
                    </button>
                    <button
                      onClick={() => setBackgroundCategory('kpop')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        backgroundCategory === 'kpop'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 text-white/70 hover:bg-slate-600/50'
                      }`}
                    >
                      <i className="fas fa-users text-lg"></i>
                      Kpop
                    </button>
                  </div>

                  {/* Content - Static Tab */}
                  {backgroundTab === 'static' && (
                    <div className="space-y-6 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {/* Summer Special - Only for Exclusive Category */}
                      {backgroundCategory === 'exclusive' && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-white font-bold text-lg">Summer Special</h3>
                            <span className="text-xl">☀️</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {summerSpecialThemes.map((theme, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  setRoomBackground(theme.url);
                                  setShowBackgroundSelector(false);
                                }}
                                className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-orange-400 transition transform hover:scale-105"
                                style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=225')}')` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                                    <div className="text-white/70 text-[10px]">by {theme.author}</div>
                                  </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  SUMMER
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Classic Themes - For all other categories */}
                      {backgroundCategory !== 'custom' && backgroundCategory !== 'exclusive' && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white/90 font-semibold">Classic Themes</h3>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {allStaticBackgrounds.map((theme, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  setRoomBackground(theme.url);
                                  setShowBackgroundSelector(false);
                                }}
                                className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-white/50 transition transform hover:scale-105"
                                style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=225')}')` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                                    <div className="text-white/70 text-[10px]">by {theme.author}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Custom - At the bottom */}
                      <div className="border-t border-white/20 pt-6">
                        <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                          <i className="fas fa-upload"></i>
                          Upload Custom Background
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setRoomBackground(ev.target.result as string);
                                  setShowBackgroundSelector(false);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-sm text-white file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 file:cursor-pointer transition"
                        />
                      </div>
                    </div>
                  )}

                  {/* Content - Live Tab */}
                  {backgroundTab === 'live' && (
                    <div className="space-y-6 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {/* Featured Live Themes */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg">Featuring</h3>
                            <span className="text-xl">✨</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {liveThemes.filter(t => t.featured).map((theme, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setRoomBackground(theme.url);
                                setShowBackgroundSelector(false);
                              }}
                              className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-purple-400 transition transform hover:scale-105"
                              style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=225')}')` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                <div className="absolute bottom-2 left-2 right-2">
                                  <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                                  <div className="text-white/70 text-[10px]">by {theme.author}</div>
                                </div>
                                <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>✨</span> Featured
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <i className="fas fa-play text-white text-lg ml-1"></i>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* All Live Themes */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white/90 font-semibold">All Live Themes</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {liveThemes.map((theme, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setRoomBackground(theme.url);
                                setShowBackgroundSelector(false);
                              }}
                              className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-white/50 transition transform hover:scale-105"
                              style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=225')}')` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                <div className="absolute bottom-2 left-2 right-2">
                                  <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                                  <div className="text-white/70 text-[10px]">by {theme.author}</div>
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <i className="fas fa-play text-white text-lg ml-1"></i>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={resetCreateForm}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition"
                >
                  Hủy
                </button>
                <button
                  onClick={() => void handleCreateRoom()}
                  disabled={isCreatingRoom}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-full transition"
                >
                  {isCreatingRoom ? 'Đang tạo...' : 'Đến phòng của tôi'}
                </button>
              </div>

              {createError && (
                <div className="rounded-xl border border-red-300 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {createError}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        />
      </div>

      <WaitingRoom
        visible={showWaitingRoom}
        onClose={handleCloseWaitingRoom}
        onJoinCall={handleJoinCall}
        onEndRoom={handleEndRoomFromPreview}
        isEndingRoom={isEndingRoom}
        roomId={selectedRoom?.roomId ?? null}
        roomTitle={selectedRoom?.title || ''}
        hasPassword={selectedRoom?.hasPassword ?? false}
        currentParticipantsCount={selectedRoom?.currentParticipantsCount ?? 0}
        maxParticipants={selectedRoom?.maxParticipants ?? 0}
      />
    </div>
  );
}
