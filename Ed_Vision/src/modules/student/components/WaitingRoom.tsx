import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getStudyRoomErrorMessage,
  studyRoomService,
  type StudyRoomDetail,
} from '@/services/student/studyRoomService';

export type WaitingRoomJoinPayload = {
  roomId: number;
  roomTitle: string;
  micOn: boolean;
  cameraOn: boolean;
  micDeviceId?: string;
  cameraDeviceId?: string;
  password?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onJoinCall: (payload: WaitingRoomJoinPayload) => void;
  onEndRoom?: (roomId: number) => Promise<void> | void;
  isEndingRoom?: boolean;
  roomId: number | null;
  roomTitle: string;
  hasPassword?: boolean;
  currentParticipantsCount?: number;
  maxParticipants?: number;
};

export default function WaitingRoom({
  visible,
  onClose,
  onJoinCall,
  onEndRoom,
  isEndingRoom = false,
  roomId,
  roomTitle,
  hasPassword = false,
  currentParticipantsCount = 0,
  maxParticipants = 0,
}: Props) {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isPreparingMedia, setIsPreparingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState('');
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState('');
  const [activeCameraLabel, setActiveCameraLabel] = useState<string | null>(null);
  const [activeMicLabel, setActiveMicLabel] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'room' | 'participants'>('room');
  const [password, setPassword] = useState('');
  const [roomDetail, setRoomDetail] = useState<StudyRoomDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRequestIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const meterFrameRef = useRef<number | null>(null);

  const effectiveHasPassword = roomDetail?.requiresPassword ?? hasPassword;
  const effectiveOnlineCount = roomDetail?.onlineCount ?? currentParticipantsCount;
  const effectiveMaxParticipants = roomDetail?.maxParticipants ?? maxParticipants;

  const participants = useMemo(
    () => roomDetail?.participants ?? [],
    [roomDetail],
  );
  const canEndRoomFromPreview = Boolean(
    roomId && roomDetail?.viewerCanModerate && onEndRoom,
  );

  const selectedCameraLabel = useMemo(() => {
    const selected = cameraDevices.find((device) => device.deviceId === selectedCameraDeviceId);
    if (selected?.label?.trim()) {
      return selected.label;
    }

    if (cameraDevices.length > 0) {
      return `Máy ảnh ${cameraDevices.findIndex((device) => device.deviceId === selectedCameraDeviceId) + 1}`;
    }

    return null;
  }, [cameraDevices, selectedCameraDeviceId]);

  const selectedMicLabel = useMemo(() => {
    const selected = micDevices.find((device) => device.deviceId === selectedMicDeviceId);
    if (selected?.label?.trim()) {
      return selected.label;
    }

    if (micDevices.length > 0) {
      return `Micrô ${micDevices.findIndex((device) => device.deviceId === selectedMicDeviceId) + 1}`;
    }

    return null;
  }, [micDevices, selectedMicDeviceId]);

  const getDeviceLabel = useCallback((device: MediaDeviceInfo, index: number, kind: 'camera' | 'microphone') => {
    if (device.label.trim()) {
      return device.label;
    }

    return `${kind === 'camera' ? 'Máy ảnh' : 'Micrô'} ${index + 1}`;
  }, []);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setCameraDevices([]);
      setMicDevices([]);
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');
    const microphones = devices.filter((device) => device.kind === 'audioinput');

    setCameraDevices(cameras);
    setMicDevices(microphones);

    setSelectedCameraDeviceId((currentId) => {
      if (currentId && cameras.some((device) => device.deviceId === currentId)) {
        return currentId;
      }

      return cameras[0]?.deviceId ?? '';
    });

    setSelectedMicDeviceId((currentId) => {
      if (currentId && microphones.some((device) => device.deviceId === currentId)) {
        return currentId;
      }

      return microphones[0]?.deviceId ?? '';
    });
  }, []);

  const stopMicMeter = () => {
    if (meterFrameRef.current !== null) {
      window.cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }

    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;

    analyserRef.current?.disconnect();
    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setMicLevel(0);
  };

  const releasePreviewStream = () => {
    stopMicMeter();
    setPreviewStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setActiveCameraLabel(null);
    setActiveMicLabel(null);
  };

  const mapMediaError = (error: unknown): string => {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'Vui lòng cấp quyền máy ảnh/micrô trong trình duyệt để kiểm tra trước khi vào phòng';
      }
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'Không tìm thấy thiết bị máy ảnh hoặc micrô trên máy của bạn';
      }
      if (error.name === 'NotReadableError') {
        return 'Không thể truy cập máy ảnh/micrô. Có thể thiết bị đang được ứng dụng khác sử dụng';
      }
    }

    return getStudyRoomErrorMessage(error, 'Không thể khởi tạo máy ảnh/micrô để xem trước');
  };

  const syncPreviewDevices = async (nextCameraOn: boolean, nextMicOn: boolean) => {
    if (!nextCameraOn && !nextMicOn) {
      releasePreviewStream();
      setMediaError(null);
      return true;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMediaError('Trình duyệt không hỗ trợ kiểm tra máy ảnh/micrô');
      return false;
    }

    const requestId = mediaRequestIdRef.current + 1;
    mediaRequestIdRef.current = requestId;

    try {
      setIsPreparingMedia(true);
      setMediaError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: nextCameraOn
          ? {
              deviceId: selectedCameraDeviceId ? { ideal: selectedCameraDeviceId } : undefined,
            }
          : false,
        audio: nextMicOn
          ? {
              deviceId: selectedMicDeviceId ? { ideal: selectedMicDeviceId } : undefined,
            }
          : false,
      });

      if (mediaRequestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      setPreviewStream((currentStream) => {
        currentStream?.getTracks().forEach((track) => track.stop());
        return stream;
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      const videoSettings = videoTrack?.getSettings();
      const audioSettings = audioTrack?.getSettings();

      setActiveCameraLabel(videoTrack?.label || null);
      setActiveMicLabel(audioTrack?.label || null);

      if (videoSettings?.deviceId) {
        setSelectedCameraDeviceId(videoSettings.deviceId);
      }

      if (audioSettings?.deviceId) {
        setSelectedMicDeviceId(audioSettings.deviceId);
      }

      await refreshDevices();

      return true;
    } catch (error) {
      if (mediaRequestIdRef.current === requestId) {
        setMediaError(mapMediaError(error));
      }
      return false;
    } finally {
      if (mediaRequestIdRef.current === requestId) {
        setIsPreparingMedia(false);
      }
    }
  };

  const handleCameraDeviceChange = async (deviceId: string) => {
    setSelectedCameraDeviceId(deviceId);

    if (!isCameraOn) {
      return;
    }

    await syncPreviewDevices(true, isMicOn);
  };

  const handleMicDeviceChange = async (deviceId: string) => {
    setSelectedMicDeviceId(deviceId);

    if (!isMicOn) {
      return;
    }

    await syncPreviewDevices(isCameraOn, true);
  };

  const handleToggleCamera = async () => {
    const nextCameraOn = !isCameraOn;
    const canApply = await syncPreviewDevices(nextCameraOn, isMicOn);

    if (canApply) {
      setIsCameraOn(nextCameraOn);
      return;
    }

    if (!nextCameraOn) {
      setIsCameraOn(false);
    }
  };

  const handleToggleMic = async () => {
    const nextMicOn = !isMicOn;
    const canApply = await syncPreviewDevices(isCameraOn, nextMicOn);

    if (canApply) {
      setIsMicOn(nextMicOn);
      return;
    }

    if (!nextMicOn) {
      setIsMicOn(false);
    }
  };

  useEffect(() => {
    if (!visible || !roomId) {
      return;
    }

    let active = true;

    const loadRoomDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        const data = await studyRoomService.getRoomById(roomId);
        if (active) {
          setRoomDetail(data);
        }
      } catch (error) {
        if (active) {
          setDetailError(getStudyRoomErrorMessage(error, 'Không thể tải thông tin phòng'));
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    };

    void loadRoomDetail();

    return () => {
      active = false;
    };
  }, [roomId, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    void refreshDevices();
  }, [refreshDevices, visible]);

  useEffect(() => {
    if (!visible) {
      mediaRequestIdRef.current += 1;
      setIsCameraOn(false);
      setIsMicOn(false);
      setMediaError(null);
      setIsPreparingMedia(false);
      setSelectedCameraDeviceId('');
      setSelectedMicDeviceId('');
      releasePreviewStream();
      return;
    }

    return () => {
      mediaRequestIdRef.current += 1;
      releasePreviewStream();
    };
  }, [visible]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = previewStream;
    if (previewStream) {
      void videoRef.current.play().catch(() => undefined);
    }
  }, [previewStream]);

  useEffect(() => {
    stopMicMeter();

    if (!visible || !isMicOn || !previewStream) {
      return;
    }

    const hasAudioTrack = previewStream.getAudioTracks().length > 0;
    if (!hasAudioTrack || typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;

    const sourceNode = audioContext.createMediaStreamSource(previewStream);
    sourceNode.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceNodeRef.current = sourceNode;

    const waveform = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      if (!analyserRef.current) {
        return;
      }

      analyserRef.current.getByteTimeDomainData(waveform);

      let sumSquare = 0;
      for (const sample of waveform) {
        const normalized = (sample - 128) / 128;
        sumSquare += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquare / waveform.length);
      const level = Math.min(100, Math.round(rms * 220));
      setMicLevel(level);

      meterFrameRef.current = window.requestAnimationFrame(updateMeter);
    };

    updateMeter();

    return () => {
      stopMicMeter();
    };
  }, [isMicOn, previewStream, visible]);

  const handleJoin = () => {
    if (!roomId) {
      setDetailError('Thiếu mã phòng');
      return;
    }

    if (effectiveHasPassword && !password.trim()) {
      setDetailError('Vui lòng nhập mật khẩu phòng');
      return;
    }

    onJoinCall({
      roomId,
      roomTitle,
      micOn: isMicOn,
      cameraOn: isCameraOn,
      micDeviceId: selectedMicDeviceId || undefined,
      cameraDeviceId: selectedCameraDeviceId || undefined,
      password: password.trim() || undefined,
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="h-[90vh] w-full max-w-7xl gap-4 p-6 md:flex">
        <div className="mb-4 flex min-h-0 w-full flex-col rounded-2xl bg-[#1a1a1a] p-6 md:mb-0 md:w-[400px]">
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-white">Tham gia cuộc gọi</h2>
            <p className="text-sm text-white/60">{roomTitle}</p>
            <p className="mt-2 text-xs text-white/60">
              {effectiveOnlineCount}/{effectiveMaxParticipants || '?'} người đang online
            </p>
          </div>

          <div className="scrollbar-hide min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4 transition hover:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-video-slash'} text-white`}></i>
                </div>
                <span className="font-medium text-white">Máy ảnh</span>
              </div>
              <button
                onClick={() => {
                  void handleToggleCamera();
                }}
                disabled={isPreparingMedia}
                className={`relative h-6 w-12 rounded-full transition ${
                  isCameraOn ? 'bg-pink-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    isCameraOn ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4 transition hover:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-white`}></i>
                </div>
                <span className="font-medium text-white">Micrô</span>
              </div>
              <button
                onClick={() => {
                  void handleToggleMic();
                }}
                disabled={isPreparingMedia}
                className={`relative h-6 w-12 rounded-full transition ${
                  isMicOn ? 'bg-pink-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    isMicOn ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {effectiveHasPassword && (
              <div className="rounded-xl bg-white/5 p-4">
                <label className="mb-2 block text-sm font-medium text-white/80">Mật khẩu phòng</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu phòng"
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-pink-500"
                />
              </div>
            )}

            {detailError && (
              <div className="rounded-xl border border-red-300 bg-red-500/10 p-3 text-sm text-red-300">
                {detailError}
              </div>
            )}

            {detailLoading && (
              <div className="rounded-xl bg-white/5 p-3 text-sm text-white/70">Đang tải thông tin phòng...</div>
            )}

            {mediaError && (
              <div className="rounded-xl border border-red-300 bg-red-500/10 p-3 text-sm text-red-300">
                {mediaError}
              </div>
            )}

            {isMicOn && (
              <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/70">
                  Kiểm tra micrô
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/60">
                  {micLevel > 8 ? 'Đã nhận tiếng nói từ micrô' : 'Hãy nói để kiểm tra micrô'}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-white/5 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/70">
                Chọn thiết bị
              </p>

              <div className="space-y-2">
                <label className="block text-xs text-white/70">Thiết bị máy ảnh</label>
                <select
                  value={selectedCameraDeviceId}
                  onChange={(event) => {
                    void handleCameraDeviceChange(event.target.value);
                  }}
                  disabled={isPreparingMedia || cameraDevices.length === 0}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cameraDevices.length === 0 && <option value="">Không tìm thấy máy ảnh</option>}
                  {cameraDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId} className="text-black">
                      {getDeviceLabel(device, index, 'camera')}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-white/60">
                  Máy ảnh đang dùng: {activeCameraLabel ?? selectedCameraLabel ?? 'Chưa chọn'}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <label className="block text-xs text-white/70">Thiết bị micrô</label>
                <select
                  value={selectedMicDeviceId}
                  onChange={(event) => {
                    void handleMicDeviceChange(event.target.value);
                  }}
                  disabled={isPreparingMedia || micDevices.length === 0}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {micDevices.length === 0 && <option value="">Không tìm thấy micrô</option>}
                  {micDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId} className="text-black">
                      {getDeviceLabel(device, index, 'microphone')}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-white/60">
                  Micrô đang dùng: {activeMicLabel ?? selectedMicLabel ?? 'Chưa chọn'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={isPreparingMedia || isEndingRoom}
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-bold text-white shadow-lg transition hover:from-pink-600 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tham gia cuộc gọi
          </button>

          {canEndRoomFromPreview && roomId && (
            <button
              onClick={() => {
                void onEndRoom?.(roomId);
              }}
              disabled={isEndingRoom}
              className="mt-3 w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEndingRoom ? 'Đang kết thúc phòng...' : 'Kết thúc phòng'}
            </button>
          )}

          <button
            onClick={onClose}
            disabled={isEndingRoom}
            className="mt-3 flex w-full items-center justify-center gap-2 py-3 text-sm text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="fas fa-times"></i>
            Hủy
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#2a2d3a]">
          {isCameraOn ? (
            <div className="relative h-full w-full bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 rounded-lg bg-black/55 px-3 py-2 text-xs text-white">
                <p className="font-medium">Xem trước máy ảnh</p>
                <p className="text-white/70">{isMicOn ? 'Micrô bật' : 'Micrô tắt'}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/10 bg-[#3a3d4a]">
                <i className="fas fa-user text-5xl text-white/40"></i>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Camera đã tắt</h3>
              <p className="text-sm text-white/60">
                {isMicOn
                  ? 'Micrô đang bật, bạn vẫn có thể kiểm tra giọng nói trước khi vào phòng'
                  : 'Bật camera để người khác nhìn thấy bạn'}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition hover:bg-black/60"
          >
            <i className={`fas ${showSidebar ? 'fa-chevron-right' : 'fa-users'} text-white`}></i>
          </button>
        </div>

        {showSidebar && (
          <div className="mt-4 flex w-full flex-col overflow-hidden rounded-2xl bg-[#1a1a1a] md:mt-0 md:w-[320px]">
            <div className="flex-shrink-0 border-b border-white/10">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarTab('room')}
                  className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                    sidebarTab === 'room'
                      ? 'border-b-2 border-pink-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Phòng
                </button>
                <button
                  onClick={() => setSidebarTab('participants')}
                  className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                    sidebarTab === 'participants'
                      ? 'border-b-2 border-pink-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Thành viên
                </button>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="flex h-12 w-12 items-center justify-center transition hover:bg-white/10"
                >
                  <i className="fas fa-times text-white/60"></i>
                </button>
              </div>
            </div>

            {sidebarTab === 'room' ? (
              <div className="scrollbar-hide flex-1 overflow-y-auto p-4 text-sm text-white/80">
                <p>
                  Chế độ phòng: <span className="font-semibold text-white">{roomDetail?.roomMode ?? 'Chưa có'}</span>
                </p>
                <p className="mt-2">
                  Đang online: <span className="font-semibold text-white">{effectiveOnlineCount}</span>
                </p>
                <p className="mt-2">
                  Sức chứa: <span className="font-semibold text-white">{effectiveMaxParticipants || 'Chưa có'}</span>
                </p>
                <p className="mt-2">
                  Mật khẩu: <span className="font-semibold text-white">{effectiveHasPassword ? 'Bắt buộc' : 'Không bắt buộc'}</span>
                </p>
                <p className="mt-2">
                  Tạo lúc: <span className="font-semibold text-white">{roomDetail ? new Date(roomDetail.createdAt).toLocaleString() : 'Chưa có'}</span>
                </p>
              </div>
            ) : (
              <div className="scrollbar-hide flex-1 overflow-y-auto p-4">
                <div className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-white">
                  {participants.length} thành viên
                </div>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.accountId}
                      className="flex items-center justify-between rounded-xl p-3 transition hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                          {participant.avatarUrl ? (
                            <img
                              src={participant.avatarUrl}
                              alt={participant.fullName ?? participant.email ?? 'Thành viên'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <i className="fas fa-user text-sm text-white"></i>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {participant.fullName ?? participant.email ?? `Người dùng #${participant.accountId}`}
                            </span>
                            {participant.isHost && (
                              <i className="fas fa-crown text-xs text-yellow-400"></i>
                            )}
                          </div>
                          <p className="text-xs text-white/60">
                            mic: {participant.micOn ? 'bật' : 'tắt'} · camera: {participant.cameraOn ? 'bật' : 'tắt'}
                          </p>
                        </div>
                      </div>
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
