import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room as LiveKitRoom,
  RoomEvent,
  Track,
} from 'livekit-client';
import type { VideoTrack } from 'livekit-client';
import toast from 'react-hot-toast';
import StudyStreakCard from './StudyStreakCard';
import { TokenManager } from '@/lib/tokenManager';
import { LIVEKIT_URL } from '@/services/api/config';
import { studyRoomRealtime } from '@/services/student/studyRoomRealtime';
import {
  getStudyRoomErrorMessage,
  studyRoomService,
  type MyStudyStats,
  type StudyRoomParticipantPresence,
  type StudyRoomTimerState,
} from '@/services/student/studyRoomService';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomTitle: string;
  roomId?: number | null;
  roomPassword?: string;
  initialMicOn?: boolean;
  initialCameraOn?: boolean;
  initialMicDeviceId?: string;
  initialCameraDeviceId?: string;
  participantId?: number | null;
  livekitToken?: string | null;
  livekitUrl?: string | null;
};

type ParticipantCard = {
  id: number;
  name: string;
  avatar?: string | null;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  handRaised: boolean;
};

type RemoteVideoTrackState = {
  trackSid: string;
  participantIdentity: string;
  accountId: number | null;
  participantName: string;
  track: VideoTrack;
};

type ModerationConfirmAction = 'kick' | 'ban' | 'end-room';

type ModerationConfirmDialog = {
  action: ModerationConfirmAction;
  title: string;
  description: string;
  confirmLabel: string;
  targetAccountId?: number;
  targetName?: string;
};

function resolveCurrentAccountId(): number | null {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    const parsed = JSON.parse(rawUser) as Record<string, unknown>;
    const id = parsed.account_id ?? parsed.accountId ?? parsed.id;

    if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
      return Math.trunc(id);
    }

    if (typeof id === 'string') {
      const parsedId = Number.parseInt(id, 10);
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        return parsedId;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getTimerRemainingSeconds(
  timer: StudyRoomTimerState | null,
  now: number,
): number {
  if (!timer) {
    return 0;
  }

  return Math.max(0, Math.floor((new Date(timer.endsAt).getTime() - now) / 1000));
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function parseLiveKitParticipantAccountId(
  identity: string,
  metadata?: string | null,
): number | null {
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata) as Record<string, unknown>;
      const accountId = parsed.accountId;
      if (typeof accountId === 'number' && Number.isFinite(accountId) && accountId > 0) {
        return Math.trunc(accountId);
      }

      if (typeof accountId === 'string') {
        const parsedAccountId = Number.parseInt(accountId, 10);
        if (!Number.isNaN(parsedAccountId) && parsedAccountId > 0) {
          return parsedAccountId;
        }
      }
    } catch {
      // Ignore malformed metadata and fall back to identity parsing.
    }
  }

  const identityMatch = /acc-(\d+)-/i.exec(identity);
  if (identityMatch?.[1]) {
    const parsedAccountId = Number.parseInt(identityMatch[1], 10);
    if (!Number.isNaN(parsedAccountId) && parsedAccountId > 0) {
      return parsedAccountId;
    }
  }

  const direct = Number.parseInt(identity, 10);
  if (!Number.isNaN(direct) && direct > 0) {
    return direct;
  }

  return null;
}

function extractMediaTrackDeviceId(track: unknown): string | undefined {
  if (!track || typeof track !== 'object') {
    return undefined;
  }

  const mediaStreamTrack = (track as { mediaStreamTrack?: MediaStreamTrack }).mediaStreamTrack;
  if (!mediaStreamTrack?.getSettings) {
    return undefined;
  }

  const settings = mediaStreamTrack.getSettings();
  return settings.deviceId;
}

function resolveTrackSid(
  publicationTrackSid: string | undefined,
  trackSid: string | undefined,
  fallbackPrefix: string,
): string {
  return (
    publicationTrackSid ||
    trackSid ||
    `${fallbackPrefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  );
}

function LiveKitTrackVideo({
  track,
  muted = false,
  className,
}: {
  track: VideoTrack;
  muted?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [track]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />;
}

export default function VideoCallRoom({
  visible,
  onClose,
  roomTitle,
  roomId,
  roomPassword,
  initialMicOn = false,
  initialCameraOn = false,
  initialMicDeviceId,
  initialCameraDeviceId,
  participantId,
  livekitToken,
  livekitUrl,
}: Props) {
  const [isMicOn, setIsMicOn] = useState(initialMicOn);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'room' | 'participants'>('room');
  const [participants, setParticipants] = useState<StudyRoomParticipantPresence[]>([]);
  const [viewerCanModerate, setViewerCanModerate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [timerState, setTimerState] = useState<StudyRoomTimerState | null>(null);
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | null>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<RemoteVideoTrackState[]>([]);
  const [liveKitConnected, setLiveKitConnected] = useState(false);
  const [speakingLevels, setSpeakingLevels] = useState<Record<number, number>>({});
  const [startingRoomTimer, setStartingRoomTimer] = useState(false);
  const [moderationTargetAccountId, setModerationTargetAccountId] = useState<number | null>(null);
  const [endingRoom, setEndingRoom] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ModerationConfirmDialog | null>(null);
  const [studyStats, setStudyStats] = useState<MyStudyStats | null>(null);
  const [studyStatsLoading, setStudyStatsLoading] = useState(false);
  const [studyStatsError, setStudyStatsError] = useState<string | null>(null);

  const liveKitRoomRef = useRef<LiveKitRoom | null>(null);
  const preferredMicDeviceIdRef = useRef<string | undefined>(initialMicDeviceId);
  const preferredCameraDeviceIdRef = useRef<string | undefined>(initialCameraDeviceId);
  const endRoomRequestedRef = useRef(false);
  const remoteAudioElementsRef = useRef<
    Map<string, { track: RemoteTrack; element: HTMLMediaElement }>
  >(new Map());

  const currentAccountId = useMemo(() => resolveCurrentAccountId(), []);
  const resolvedLiveKitUrl = useMemo(
    () => (livekitUrl?.trim() || LIVEKIT_URL).trim(),
    [livekitUrl],
  );

  const detachAllRemoteAudio = useCallback(() => {
    for (const { track, element } of remoteAudioElementsRef.current.values()) {
      track.detach(element);
      element.remove();
    }
    remoteAudioElementsRef.current.clear();
  }, []);

  const cleanupLiveKit = useCallback(() => {
    const room = liveKitRoomRef.current;
    if (room) {
      room.removeAllListeners();
      room.disconnect();
      liveKitRoomRef.current = null;
    }

    detachAllRemoteAudio();
    setLocalVideoTrack(null);
    setRemoteVideoTracks([]);
    setSpeakingLevels({});
    setLiveKitConnected(false);
  }, [detachAllRemoteAudio]);

  const syncLocalVideoTrack = useCallback(() => {
    const room = liveKitRoomRef.current;
    if (!room) {
      setLocalVideoTrack(null);
      return;
    }

    const publication = Array.from(room.localParticipant.videoTrackPublications.values()).find(
      (currentPublication) => currentPublication.source === Track.Source.Camera,
    );

    const track = publication?.track;
    if (track && track.kind === Track.Kind.Video) {
      setLocalVideoTrack(track as VideoTrack);
      return;
    }

    setLocalVideoTrack(null);
  }, []);

  const syncPreferredDeviceIds = useCallback(() => {
    const room = liveKitRoomRef.current;
    if (!room) {
      return;
    }

    const micPublication = Array.from(room.localParticipant.audioTrackPublications.values()).find(
      (currentPublication) => currentPublication.source === Track.Source.Microphone,
    );
    const cameraPublication = Array.from(room.localParticipant.videoTrackPublications.values()).find(
      (currentPublication) => currentPublication.source === Track.Source.Camera,
    );

    const micDeviceId = extractMediaTrackDeviceId(micPublication?.track);
    const cameraDeviceId = extractMediaTrackDeviceId(cameraPublication?.track);

    if (micDeviceId) {
      preferredMicDeviceIdRef.current = micDeviceId;
    }

    if (cameraDeviceId) {
      preferredCameraDeviceIdRef.current = cameraDeviceId;
    }
  }, []);

  const setLiveKitMicrophoneEnabled = useCallback(
    async (enabled: boolean) => {
      const room = liveKitRoomRef.current;
      if (!room) {
        throw new Error('LiveKit chưa kết nối');
      }

      if (enabled && preferredMicDeviceIdRef.current) {
        await room
          .switchActiveDevice('audioinput', preferredMicDeviceIdRef.current)
          .catch(() => false);
      }

      await room.localParticipant.setMicrophoneEnabled(enabled);
      syncPreferredDeviceIds();
    },
    [syncPreferredDeviceIds],
  );

  const setLiveKitCameraEnabled = useCallback(
    async (enabled: boolean) => {
      const room = liveKitRoomRef.current;
      if (!room) {
        throw new Error('LiveKit chưa kết nối');
      }

      if (enabled && preferredCameraDeviceIdRef.current) {
        await room
          .switchActiveDevice('videoinput', preferredCameraDeviceIdRef.current)
          .catch(() => false);
      }

      await room.localParticipant.setCameraEnabled(enabled);
      syncLocalVideoTrack();
      syncPreferredDeviceIds();
    },
    [syncLocalVideoTrack, syncPreferredDeviceIds],
  );

  const connectLiveKit = useCallback(async () => {
    const token = livekitToken?.trim();
    if (!token) {
      throw new Error('Thiếu token LiveKit từ phản hồi tham gia phòng');
    }

    if (!resolvedLiveKitUrl) {
      throw new Error('Thiếu cấu hình URL LiveKit');
    }

    cleanupLiveKit();

    const room = new LiveKitRoom({
      adaptiveStream: true,
      dynacast: true,
      stopLocalTrackOnUnpublish: true,
    });

    liveKitRoomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video) {
        const accountId = parseLiveKitParticipantAccountId(
          participant.identity,
          participant.metadata,
        );
        const trackSid = resolveTrackSid(
          publication.trackSid,
          track.sid,
          participant.identity || 'video-track',
        );

        setRemoteVideoTracks((previous) => {
          const next = previous.filter((item) => item.trackSid !== trackSid);
          next.push({
            trackSid,
            participantIdentity: participant.identity,
            accountId,
            participantName:
              participant.name || participant.identity || `participant-${trackSid}`,
            track: track as VideoTrack,
          });
          return next;
        });
      }

      if (track.kind === Track.Kind.Audio) {
        const trackSid = resolveTrackSid(
          publication.trackSid,
          track.sid,
          participant.identity || 'audio-track',
        );
        const element = track.attach();

        if (element instanceof HTMLMediaElement) {
          element.autoplay = true;
          element.style.display = 'none';
          document.body.appendChild(element);
          remoteAudioElementsRef.current.set(trackSid, { track, element });
        }
      }
    });

    room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        const trackSid = resolveTrackSid(
          publication.trackSid,
          track.sid,
          participant?.identity || 'unsubscribed-track',
        );

        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTracks((previous) =>
            previous.filter((item) => item.trackSid !== trackSid),
          );
        }

        if (track.kind === Track.Kind.Audio) {
          const attached = remoteAudioElementsRef.current.get(trackSid);
          if (attached) {
            attached.track.detach(attached.element);
            attached.element.remove();
            remoteAudioElementsRef.current.delete(trackSid);
          }
        }

        if (!participant) {
          return;
        }
      },
    );

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      setRemoteVideoTracks((previous) =>
        previous.filter(
          (item) => item.participantIdentity !== participant.identity,
        ),
      );
    });

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const nextSpeakingLevels: Record<number, number> = {};

      for (const participant of speakers) {
        const parsedAccountId = parseLiveKitParticipantAccountId(
          participant.identity,
          participant.metadata,
        );

        const accountId =
          parsedAccountId ??
          (currentAccountId &&
          participant.identity === room.localParticipant.identity
            ? currentAccountId
            : null);

        if (!accountId) {
          continue;
        }

        nextSpeakingLevels[accountId] = participant.audioLevel ?? 1;
      }

      setSpeakingLevels(nextSpeakingLevels);
    });

    room.on(RoomEvent.LocalTrackPublished, () => {
      syncLocalVideoTrack();
      syncPreferredDeviceIds();
    });

    room.on(RoomEvent.LocalTrackUnpublished, () => {
      syncLocalVideoTrack();
      syncPreferredDeviceIds();
    });

    room.on(RoomEvent.Disconnected, () => {
      setLiveKitConnected(false);
      setLocalVideoTrack(null);
      setRemoteVideoTracks([]);
      setSpeakingLevels({});
      detachAllRemoteAudio();
    });

    await room.connect(resolvedLiveKitUrl, token);

    if (preferredMicDeviceIdRef.current) {
      await room
        .switchActiveDevice('audioinput', preferredMicDeviceIdRef.current)
        .catch(() => false);
    }

    if (preferredCameraDeviceIdRef.current) {
      await room
        .switchActiveDevice('videoinput', preferredCameraDeviceIdRef.current)
        .catch(() => false);
    }

    await room.localParticipant.setMicrophoneEnabled(initialMicOn);
    await room.localParticipant.setCameraEnabled(initialCameraOn);

    syncLocalVideoTrack();
    syncPreferredDeviceIds();
    setLiveKitConnected(true);
    setMediaError(null);
  }, [
    cleanupLiveKit,
    detachAllRemoteAudio,
    initialCameraOn,
    initialMicOn,
    livekitToken,
    resolvedLiveKitUrl,
    currentAccountId,
    syncLocalVideoTrack,
    syncPreferredDeviceIds,
  ]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    endRoomRequestedRef.current = false;
    setEndingRoom(false);
    setModerationTargetAccountId(null);
    setConfirmDialog(null);
    setIsMicOn(initialMicOn);
    setIsCameraOn(initialCameraOn);
    preferredMicDeviceIdRef.current = initialMicDeviceId;
    preferredCameraDeviceIdRef.current = initialCameraDeviceId;
  }, [
    initialCameraDeviceId,
    initialCameraOn,
    initialMicDeviceId,
    initialMicOn,
    visible,
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const patchParticipant = useCallback((incoming: StudyRoomParticipantPresence) => {
    setParticipants((previous) => {
      const index = previous.findIndex(
        (participant) => participant.accountId === incoming.accountId,
      );

      const normalizedIncoming: StudyRoomParticipantPresence = {
        ...incoming,
        micOn: typeof incoming.micOn === 'boolean' ? incoming.micOn : false,
        cameraOn: typeof incoming.cameraOn === 'boolean' ? incoming.cameraOn : false,
        handRaised: typeof incoming.handRaised === 'boolean' ? incoming.handRaised : false,
      };

      if (index < 0) {
        return [...previous, normalizedIncoming];
      }

      const next = [...previous];
      const current = next[index];

      next[index] = {
        ...current,
        ...incoming,
        micOn:
          typeof incoming.micOn === 'boolean' ? incoming.micOn : current.micOn,
        cameraOn:
          typeof incoming.cameraOn === 'boolean'
            ? incoming.cameraOn
            : current.cameraOn,
        handRaised:
          typeof incoming.handRaised === 'boolean'
            ? incoming.handRaised
            : current.handRaised,
      };
      return next;
    });
  }, []);

  useEffect(() => {
    if (!visible || !roomId) {
      return;
    }

    let active = true;
    const fallbackError = 'Không thể kết nối phòng học trực tuyến';

    const onParticipantJoined = (payload: {
      roomId: number;
      participant: StudyRoomParticipantPresence;
    }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      patchParticipant(payload.participant);
    };

    const onParticipantUpdated = (payload: {
      roomId: number;
      participant: StudyRoomParticipantPresence;
    }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      patchParticipant(payload.participant);
    };

    const onParticipantLeft = (payload: {
      roomId: number;
      participant: StudyRoomParticipantPresence;
      reason: string;
    }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setParticipants((previous) =>
        previous.filter(
          (participant) => participant.accountId !== payload.participant.accountId,
        ),
      );
    };

    const onTimerSync = (payload: {
      roomId: number;
      timer: StudyRoomTimerState | null;
    }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setTimerState(payload.timer ?? null);
    };

    const onRoomError = (payload: { message?: string }) => {
      if (!active) {
        return;
      }

      const message = payload?.message?.trim() || fallbackError;
      setConnectionError(message);
      toast.error(message);
    };

    const onKicked = (payload: { roomId: number; targetAccountId: number }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      if (currentAccountId && payload.targetAccountId === currentAccountId) {
        toast.error('Bạn đã bị mời khỏi phòng');
        onClose();
      }
    };

    const onBanned = (payload: { roomId: number; targetAccountId: number }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      if (currentAccountId && payload.targetAccountId === currentAccountId) {
        toast.error('Bạn đã bị cấm trong phòng này');
        onClose();
      }
    };

    const onRoomClosed = (payload: {
      roomId: number;
      endedBy?: number;
      closedAt?: string;
    }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      if (!active) {
        return;
      }

      if (endRoomRequestedRef.current) {
        return;
      }

      toast.error('Phòng đã bị kết thúc bởi chủ phòng.');

      cleanupLiveKit();
      studyRoomRealtime.disconnect();
      onClose();
    };

    const setup = async () => {
      try {
        setLoadingJoin(true);
        setConnectionError(null);

        const token = TokenManager.getToken();
        if (!token) {
          throw new Error('Vui lòng đăng nhập để tham gia phòng');
        }

        await studyRoomRealtime.connect(token);

        const joinAck = await studyRoomRealtime.joinRoom({
          roomId,
          password: roomPassword,
          micOn: initialMicOn,
          cameraOn: initialCameraOn,
        });

        if (!active) {
          return;
        }

        setParticipants(joinAck.room.participants);
        setViewerCanModerate(joinAck.room.viewerCanModerate);

        if (currentAccountId) {
          try {
            await studyRoomRealtime.joinLegacyRoom({
              roomId,
              userId: currentAccountId,
            });
          } catch {
            // Best effort for compatibility with legacy user list events.
          }
        }

        try {
          const timerAck = await studyRoomRealtime.syncTimer({ roomId });
          setTimerState(timerAck.timer ?? null);
        } catch {
          setTimerState(null);
        }

        try {
          await connectLiveKit();
        } catch (error) {
          const message = getStudyRoomErrorMessage(
            error,
            'Không thể kết nối phòng media LiveKit',
          );
          setMediaError(message);
          setIsMicOn(false);
          setIsCameraOn(false);
          toast.error(message);
        }
      } catch (error) {
        const message = getStudyRoomErrorMessage(error, fallbackError);
        if (active) {
          setConnectionError(message);
          toast.error(message);
        }
      } finally {
        if (active) {
          setLoadingJoin(false);
        }
      }
    };

    void setup();

    studyRoomRealtime.on('room.participant.joined', onParticipantJoined);
    studyRoomRealtime.on('room.participant.updated', onParticipantUpdated);
    studyRoomRealtime.on('room.participant.left', onParticipantLeft);
    studyRoomRealtime.on('timer_sync', onTimerSync);
    studyRoomRealtime.on('room.error', onRoomError);
    studyRoomRealtime.on('room.participant.kicked', onKicked);
    studyRoomRealtime.on('room.participant.banned', onBanned);
    studyRoomRealtime.on('room.closed', onRoomClosed);

    const heartbeatInterval = window.setInterval(() => {
      void studyRoomRealtime.heartbeat([roomId]).catch(() => {
        // Ignore heartbeat errors; reconnect logic is handled by socket.io.
      });
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(heartbeatInterval);

      studyRoomRealtime.off(
        'room.participant.joined',
        onParticipantJoined as (...args: unknown[]) => void,
      );
      studyRoomRealtime.off(
        'room.participant.updated',
        onParticipantUpdated as (...args: unknown[]) => void,
      );
      studyRoomRealtime.off(
        'room.participant.left',
        onParticipantLeft as (...args: unknown[]) => void,
      );
      studyRoomRealtime.off('timer_sync', onTimerSync as (...args: unknown[]) => void);
      studyRoomRealtime.off('room.error', onRoomError as (...args: unknown[]) => void);
      studyRoomRealtime.off(
        'room.participant.kicked',
        onKicked as (...args: unknown[]) => void,
      );
      studyRoomRealtime.off(
        'room.participant.banned',
        onBanned as (...args: unknown[]) => void,
      );
      studyRoomRealtime.off(
        'room.closed',
        onRoomClosed as (...args: unknown[]) => void,
      );

      void studyRoomRealtime.leaveRoom(roomId).catch(() => {
        // Ignore leave failure during cleanup.
      });

      if (currentAccountId) {
        void studyRoomRealtime
          .leaveLegacyRoom({ roomId, userId: currentAccountId })
          .catch(() => {
            // Ignore legacy leave failure during cleanup.
          });
      }

      cleanupLiveKit();
      studyRoomRealtime.disconnect();
    };
  }, [
    cleanupLiveKit,
    connectLiveKit,
    currentAccountId,
    initialCameraOn,
    initialMicOn,
    onClose,
    patchParticipant,
    roomId,
    roomPassword,
    visible,
  ]);

  useEffect(() => {
    if (!visible) {
      cleanupLiveKit();
    }
  }, [cleanupLiveKit, visible]);

  const remoteVideoTrackByAccountId = useMemo(() => {
    const map = new Map<number, VideoTrack>();
    for (const entry of remoteVideoTracks) {
      if (entry.accountId) {
        map.set(entry.accountId, entry.track);
      }
    }
    return map;
  }, [remoteVideoTracks]);

  const participantCards = useMemo<ParticipantCard[]>(() => {
    return participants
      .filter((participant) => participant.accountId !== currentAccountId)
      .map((participant) => ({
        id: participant.accountId,
        name:
          participant.fullName ?? participant.email ?? `Người dùng #${participant.accountId}`,
        avatar: participant.avatarUrl,
        isHost: participant.isHost,
        isMuted: !participant.micOn,
        isVideoOff: !participant.cameraOn,
        handRaised: participant.handRaised,
      }));
  }, [participants, currentAccountId]);

  const selfParticipant = useMemo(
    () =>
      participants.find(
        (participant) => participant.accountId === currentAccountId,
      ) ?? null,
    [participants, currentAccountId],
  );

  const displayedParticipants = participantCards.length + 1;
  const timerRemainingSeconds = useMemo(
    () => getTimerRemainingSeconds(timerState, timerNow),
    [timerNow, timerState],
  );
  const roomTimerActive = Boolean(timerState && timerRemainingSeconds > 0);
  const roomTimerDisplay = useMemo(
    () => formatDuration(roomTimerActive ? timerRemainingSeconds : 25 * 60),
    [roomTimerActive, timerRemainingSeconds],
  );
  const roomTimerProgress = useMemo(() => {
    if (!timerState) {
      return 0;
    }

    const durationSeconds = Math.max(1, timerState.durationSeconds);
    const elapsed = Math.max(0, durationSeconds - timerRemainingSeconds);
    return Math.round((elapsed / durationSeconds) * 100);
  }, [timerRemainingSeconds, timerState]);
  const timerStarterName = useMemo(() => {
    if (!timerState) {
      return null;
    }

    const owner = participants.find(
      (participant) => participant.accountId === timerState.startedBy,
    );

    return owner?.fullName ?? owner?.email ?? null;
  }, [participants, timerState]);
  const speakingParticipantsCount = useMemo(
    () => Object.keys(speakingLevels).length,
    [speakingLevels],
  );

  const isAccountSpeaking = useCallback(
    (accountId?: number | null): boolean => {
      if (!accountId) {
        return false;
      }

      return speakingLevels[accountId] !== undefined;
    },
    [speakingLevels],
  );

  const isSelfSpeaking = useMemo(
    () => isAccountSpeaking(currentAccountId ?? selfParticipant?.accountId),
    [currentAccountId, isAccountSpeaking, selfParticipant?.accountId],
  );

  const handleToggleMic = async () => {
    if (!roomId) {
      return;
    }

    const next = !isMicOn;
    setIsMicOn(next);

    try {
      await setLiveKitMicrophoneEnabled(next);
      await studyRoomRealtime.updateParticipantState({ roomId, micOn: next });
      await studyRoomRealtime.toggleMic({ roomId, enabled: next });
    } catch (error) {
      setIsMicOn(!next);
      try {
        await setLiveKitMicrophoneEnabled(!next);
      } catch {
        // Ignore rollback failures.
      }
      toast.error(getStudyRoomErrorMessage(error, 'Không thể cập nhật micro'));
    }
  };

  const handleToggleCamera = async () => {
    if (!roomId) {
      return;
    }

    const next = !isCameraOn;
    setIsCameraOn(next);

    try {
      await setLiveKitCameraEnabled(next);
      await studyRoomRealtime.updateParticipantState({ roomId, cameraOn: next });
      await studyRoomRealtime.toggleCamera({ roomId, enabled: next });
    } catch (error) {
      setIsCameraOn(!next);
      try {
        await setLiveKitCameraEnabled(!next);
      } catch {
        // Ignore rollback failures.
      }
      toast.error(getStudyRoomErrorMessage(error, 'Không thể cập nhật camera'));
    }
  };

  const handleEndCall = async () => {
    try {
      if (roomId) {
        await studyRoomRealtime.leaveRoom(roomId);
      }
    } catch {
      // Ignore end-call errors; still close modal.
    } finally {
      cleanupLiveKit();
      studyRoomRealtime.disconnect();
      onClose();
    }
  };

  const handleStartRoomTimer = useCallback(
    async (durationSeconds: number) => {
      if (!roomId) {
        return;
      }

      if (!viewerCanModerate) {
        toast.error('Chỉ chủ phòng mới có thể bật Pomodoro cho phòng.');
        return;
      }

      try {
        setStartingRoomTimer(true);
        const ack = await studyRoomRealtime.startTimer({
          roomId,
          durationSeconds,
        });
        setTimerState(ack.timer);
      } catch (error) {
        toast.error(getStudyRoomErrorMessage(error, 'Không thể bật hẹn giờ Pomodoro'));
      } finally {
        setStartingRoomTimer(false);
      }
    },
    [roomId, viewerCanModerate],
  );

  const handleExtendRoomTimer = useCallback(async () => {
    const nextDuration = Math.max(
      60,
      getTimerRemainingSeconds(timerState, Date.now()) + 5 * 60,
    );
    await handleStartRoomTimer(nextDuration);
  }, [handleStartRoomTimer, timerState]);

  const handleSyncRoomTimer = useCallback(async () => {
    if (!roomId) {
      return;
    }

    try {
      const ack = await studyRoomRealtime.syncTimer({ roomId });
      setTimerState(ack.timer ?? null);
    } catch (error) {
      toast.error(getStudyRoomErrorMessage(error, 'Không thể đồng bộ hẹn giờ'));
    }
  }, [roomId]);

  const loadStudyStats = useCallback(async () => {
    try {
      setStudyStatsLoading(true);
      setStudyStatsError(null);
      const data = await studyRoomService.getMyStudyStats();
      setStudyStats(data);
    } catch (error) {
      setStudyStatsError(
        getStudyRoomErrorMessage(error, 'Không thể tải thống kê streak'),
      );
    } finally {
      setStudyStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    void loadStudyStats();
  }, [loadStudyStats, visible]);

  const resolveParticipantName = useCallback(
    (targetAccountId: number) => {
      const target = participants.find(
        (participant) => participant.accountId === targetAccountId,
      );
      return target?.fullName ?? target?.email ?? `Người dùng #${targetAccountId}`;
    },
    [participants],
  );

  const handleKickParticipant = useCallback(
    (targetAccountId: number) => {
      if (!roomId) {
        return;
      }

      if (!viewerCanModerate) {
        toast.error('Chỉ chủ phòng mới có thể mời thành viên ra khỏi phòng.');
        return;
      }

      const targetName = resolveParticipantName(targetAccountId);

      setConfirmDialog({
        action: 'kick',
        title: 'Mời thành viên khỏi phòng?',
        description: `${targetName} sẽ bị mời khỏi phòng ngay lập tức.`,
        confirmLabel: 'Mời khỏi phòng',
        targetAccountId,
        targetName,
      });
    },
    [resolveParticipantName, roomId, viewerCanModerate],
  );

  const handleBanParticipant = useCallback(
    (targetAccountId: number) => {
      if (!roomId) {
        return;
      }

      if (!viewerCanModerate) {
        toast.error('Chỉ chủ phòng mới có thể cấm thành viên.');
        return;
      }

      const targetName = resolveParticipantName(targetAccountId);

      setConfirmDialog({
        action: 'ban',
        title: 'Cấm thành viên khỏi phòng?',
        description: `${targetName} sẽ bị cấm và không thể vào lại phòng này.`,
        confirmLabel: 'Cấm thành viên',
        targetAccountId,
        targetName,
      });
    },
    [resolveParticipantName, roomId, viewerCanModerate],
  );

  const handleEndRoom = useCallback(() => {
    if (!roomId) {
      return;
    }

    if (!viewerCanModerate) {
      toast.error('Chỉ chủ phòng mới có thể kết thúc phòng.');
      return;
    }

    setConfirmDialog({
      action: 'end-room',
      title: 'Kết thúc phòng học?',
      description:
        'Tất cả thành viên sẽ bị ngắt kết nối và phòng sẽ bị xóa khỏi hệ thống.',
      confirmLabel: 'Kết thúc và xóa phòng',
    });
  }, [roomId, viewerCanModerate]);

  const isConfirmDialogBusy = useMemo(() => {
    if (!confirmDialog) {
      return false;
    }

    if (confirmDialog.action === 'end-room') {
      return endingRoom;
    }

    return (
      confirmDialog.targetAccountId !== undefined &&
      moderationTargetAccountId === confirmDialog.targetAccountId
    );
  }, [confirmDialog, endingRoom, moderationTargetAccountId]);

  const handleCloseConfirmDialog = useCallback(() => {
    if (isConfirmDialogBusy) {
      return;
    }

    setConfirmDialog(null);
  }, [isConfirmDialogBusy]);

  const handleConfirmDialog = useCallback(async () => {
    if (!confirmDialog || isConfirmDialogBusy) {
      return;
    }

    if (!roomId) {
      setConfirmDialog(null);
      return;
    }

    if (!viewerCanModerate) {
      setConfirmDialog(null);
      toast.error('Chỉ chủ phòng mới có thể thực hiện thao tác này.');
      return;
    }

    if (confirmDialog.action === 'end-room') {
      try {
        setEndingRoom(true);
        endRoomRequestedRef.current = true;
        await studyRoomRealtime.endRoom({ roomId });
        toast.success('Đã kết thúc phòng học.');
        setConfirmDialog(null);
        cleanupLiveKit();
        studyRoomRealtime.disconnect();
        onClose();
      } catch (error) {
        endRoomRequestedRef.current = false;
        toast.error(getStudyRoomErrorMessage(error, 'Không thể kết thúc phòng'));
      } finally {
        setEndingRoom(false);
      }

      return;
    }

    const targetAccountId = confirmDialog.targetAccountId;
    if (!targetAccountId) {
      setConfirmDialog(null);
      return;
    }

    const targetName =
      confirmDialog.targetName ?? resolveParticipantName(targetAccountId);
    const isKickAction = confirmDialog.action === 'kick';

    try {
      setModerationTargetAccountId(targetAccountId);

      if (isKickAction) {
        await studyRoomRealtime.kickParticipant({
          roomId,
          targetAccountId,
        });
        toast.success(`Đã mời ${targetName} ra khỏi phòng.`);
      } else {
        await studyRoomRealtime.banParticipant({
          roomId,
          targetAccountId,
        });
        toast.success(`Đã cấm ${targetName} khỏi phòng.`);
      }

      setConfirmDialog(null);
    } catch (error) {
      toast.error(
        getStudyRoomErrorMessage(
          error,
          isKickAction
            ? 'Không thể mời thành viên khỏi phòng'
            : 'Không thể cấm thành viên',
        ),
      );
    } finally {
      setModerationTargetAccountId((current) =>
        current === targetAccountId ? null : current,
      );
    }
  }, [
    cleanupLiveKit,
    confirmDialog,
    isConfirmDialogBusy,
    onClose,
    resolveParticipantName,
    roomId,
    viewerCanModerate,
  ]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="flex h-[95vh] w-full max-w-7xl gap-4 p-6">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-shrink-0 items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-[20px]">
            <div className="flex items-center gap-3">
              <i className="fas fa-video text-pink-500"></i>
              <div>
                <span className="font-semibold text-white">{roomTitle || 'Phòng học'}</span>
                <p className="text-xs text-white/60">
                  Học cùng nhau, giữ vững tập trung.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">{displayedParticipants} người tham gia</span>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition hover:bg-white/10"
              >
                <i className={`fas ${showSidebar ? 'fa-chevron-right' : 'fa-users'} text-white/60`}></i>
              </button>
            </div>
          </div>

          {connectionError && (
            <div className="rounded-xl border border-red-300 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {connectionError}
            </div>
          )}

          {mediaError && (
            <div className="rounded-xl border border-amber-300 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
              {mediaError}
            </div>
          )}

          <div className="scrollbar-hide grid flex-1 grid-cols-2 gap-4 overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-[20px]">
            {loadingJoin && (
              <div className="col-span-2 flex items-center justify-center rounded-xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">
                Đang kết nối phòng...
              </div>
            )}

            <div
              className={`group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-black/50 backdrop-blur-sm transition-all duration-200 ${
                isSelfSpeaking
                  ? 'border-emerald-300 ring-2 ring-emerald-300/80 shadow-[0_0_28px_rgba(16,185,129,0.6)]'
                  : 'border-pink-400/60'
              }`}
            >
              {isCameraOn && localVideoTrack ? (
                <LiveKitTrackVideo
                  track={localVideoTrack}
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white/70">
                  <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                    <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-user'} text-2xl`}></i>
                  </div>
                  <p className="text-xs">
                    {isCameraOn ? 'Đang bật camera...' : 'Camera đang tắt'}
                  </p>
                </div>
              )}

              {isSelfSpeaking && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-emerald-200/60 bg-black/55 px-2 py-1 text-[10px] font-medium text-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300"></span>
                  </span>
                    Đang nói
                </div>
              )}

              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                <i
                  className={`fas ${isMicOn ? 'fa-microphone text-green-400' : 'fa-microphone-slash text-red-400'} text-xs`}
                ></i>
                <span className="text-sm font-medium text-white">
                  {selfParticipant?.fullName ?? selfParticipant?.email ?? 'Bạn'}
                </span>
                {(selfParticipant?.isHost || viewerCanModerate) && (
                  <i className="fas fa-crown text-xs text-yellow-400"></i>
                )}
                {selfParticipant?.handRaised && <i className="fas fa-hand text-xs text-pink-400"></i>}
              </div>
            </div>

            {!loadingJoin && participantCards.length === 0 && (
              <div className="col-span-2 flex items-center justify-center rounded-xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">
                Chưa có người tham gia nào.
              </div>
            )}

            {participantCards.map((participant) => {
              const remoteTrack = remoteVideoTrackByAccountId.get(participant.id);
              const isParticipantSpeaking = isAccountSpeaking(participant.id);

              return (
                <div
                  key={participant.id}
                  className={`group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-black/40 backdrop-blur-sm transition-all duration-200 ${
                    isParticipantSpeaking
                      ? 'border-emerald-300 ring-2 ring-emerald-300/80 shadow-[0_0_28px_rgba(16,185,129,0.55)]'
                      : 'border-white/10'
                  }`}
                >
                  {!participant.isVideoOff && remoteTrack ? (
                    <LiveKitTrackVideo
                      track={remoteTrack}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                        <i className="fas fa-user text-2xl text-white/40"></i>
                      </div>
                    </div>
                  )}

                  {isParticipantSpeaking && (
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-emerald-200/60 bg-black/55 px-2 py-1 text-[10px] font-medium text-emerald-200">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300"></span>
                      </span>
                      Đang nói
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                    <i
                      className={`fas ${participant.isMuted ? 'fa-microphone-slash text-red-400' : 'fa-microphone text-green-400'} text-xs`}
                    ></i>
                    <span className="text-sm font-medium text-white">{participant.name}</span>
                    {participant.isHost && <i className="fas fa-crown text-xs text-yellow-400"></i>}
                    {participant.handRaised && <i className="fas fa-hand text-xs text-pink-400"></i>}
                  </div>

                  {viewerCanModerate && !participant.isHost ? (
                    <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => {
                          void handleKickParticipant(participant.id);
                        }}
                        disabled={moderationTargetAccountId === participant.id}
                        title="Mời khỏi phòng"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/80 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <i className="fas fa-user-slash text-xs"></i>
                      </button>
                      <button
                        onClick={() => {
                          void handleBanParticipant(participant.id);
                        }}
                        disabled={moderationTargetAccountId === participant.id}
                        title="Cấm khỏi phòng"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/80 text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <i className="fas fa-ban text-xs"></i>
                      </button>
                    </div>
                  ) : (
                    <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100">
                      <i className="fas fa-ellipsis-h text-sm"></i>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-shrink-0 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-[20px]">
            <button
              onClick={() => {
                void handleToggleCamera();
              }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                isCameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-video-slash'} text-white`}></i>
            </button>

            <button
              onClick={() => {
                void handleToggleMic();
              }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-white`}></i>
            </button>

            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30">
              <i className="fas fa-desktop text-white"></i>
            </button>

            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30">
              <i className="fas fa-ellipsis-h text-white"></i>
            </button>

            <button
              onClick={() => {
                void handleEndCall();
              }}
              className="ml-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 transition hover:bg-red-700"
            >
              <i className="fas fa-phone-slash text-white"></i>
            </button>
          </div>
        </div>

        {showSidebar && (
          <div className="flex w-[320px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-[20px]">
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
              <div className="scrollbar-hide flex-1 overflow-y-auto p-4 space-y-4">
                <StudyStreakCard
                  stats={studyStats}
                  loading={studyStatsLoading}
                  error={studyStatsError}
                  onRetry={() => {
                    void loadStudyStats();
                  }}
                />

                <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
                  <p className="text-center text-[11px] font-semibold tracking-[0.12em] text-white/60 uppercase">
                    Pomodoro tập trung
                  </p>
                  <div className="mt-2 text-center text-5xl font-bold text-white">{roomTimerDisplay}</div>
                  <p className="mt-1 text-center text-xs text-white/60">
                    {roomTimerActive
                      ? `Đang tập trung${timerStarterName ? ` · bắt đầu bởi ${timerStarterName}` : ''}`
                      : 'Chưa bật hẹn giờ · chọn mốc bên dưới'}
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${roomTimerProgress}%` }}
                    ></div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        void handleStartRoomTimer(25 * 60);
                      }}
                      disabled={!viewerCanModerate || startingRoomTimer}
                      className="rounded-lg bg-white/10 px-2 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      25m
                    </button>
                    <button
                      onClick={() => {
                        void handleStartRoomTimer(15 * 60);
                      }}
                      disabled={!viewerCanModerate || startingRoomTimer}
                      className="rounded-lg bg-white/10 px-2 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      15m
                    </button>
                    <button
                      onClick={() => {
                        void handleStartRoomTimer(5 * 60);
                      }}
                      disabled={!viewerCanModerate || startingRoomTimer}
                      className="rounded-lg bg-white/10 px-2 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      5m
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        void handleExtendRoomTimer();
                      }}
                      disabled={!viewerCanModerate || startingRoomTimer}
                      className="rounded-lg bg-white/10 px-2 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => {
                        void handleSyncRoomTimer();
                      }}
                      className="rounded-lg bg-white/10 px-2 py-2 text-xs font-medium text-white transition hover:bg-white/20"
                    >
                      Đồng bộ
                    </button>
                  </div>

                  {!viewerCanModerate && (
                    <p className="mt-3 text-center text-[11px] text-white/55">
                      Chủ phòng sẽ điều khiển Pomodoro cho cả phòng.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-white/50">Người tham gia</p>
                    <p className="mt-1 text-xl font-semibold text-white">{displayedParticipants}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-white/50">Đang nói</p>
                    <p className="mt-1 text-xl font-semibold text-white">{speakingParticipantsCount}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-white/50">Không khí phòng</p>
                  <p className="mt-2 text-sm text-white/80">
                    Bật camera khi có thể, tắt mic khi không nói và chạy các vòng Pomodoro ngắn để giữ nhịp học.
                  </p>
                </div>

                {viewerCanModerate && (
                  <button
                    onClick={() => {
                      void handleEndRoom();
                    }}
                    disabled={endingRoom}
                    className="w-full rounded-xl bg-red-600/90 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {endingRoom ? 'Đang kết thúc phòng...' : 'Kết thúc phòng và xóa khỏi hệ thống'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <div className="flex items-center gap-2 rounded-full bg-pink-500/20 px-3 py-1.5">
                      <i className="fas fa-users text-sm text-pink-400"></i>
                      <span className="font-bold text-white">{displayedParticipants}</span>
                    </div>
                    <span className="text-sm text-white/60">người tham gia</span>
                  </div>
                </div>

                <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto p-4">
                  <div className="group flex items-center justify-between rounded-xl p-3 transition hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-500 to-purple-500">
                        <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-user'} text-sm text-white`}></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {selfParticipant?.fullName ?? selfParticipant?.email ?? 'Bạn'}
                        </span>
                        <span className="text-xs text-white/60">
                          {isMicOn ? 'Mic bật' : 'Mic tắt'} · {isCameraOn ? 'Cam bật' : 'Cam tắt'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(selfParticipant?.isHost || viewerCanModerate) && (
                        <i className="fas fa-crown text-xs text-yellow-400"></i>
                      )}
                    </div>
                  </div>

                  {participantCards.map((participant) => (
                    <div
                      key={participant.id}
                      className="group flex items-center justify-between rounded-xl p-3 transition hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                          {participant.avatar ? (
                            <img
                              src={participant.avatar}
                              alt={participant.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <i className="fas fa-user text-sm text-white"></i>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{participant.name}</span>
                          <span className="text-xs text-white/60">
                            {participant.isMuted ? 'Mic tắt' : 'Mic bật'} · {participant.isVideoOff ? 'Cam tắt' : 'Cam bật'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.isHost && <i className="fas fa-crown text-xs text-yellow-400"></i>}
                        {viewerCanModerate && !participant.isHost ? (
                          <>
                            <button
                              onClick={() => {
                                void handleKickParticipant(participant.id);
                              }}
                              disabled={moderationTargetAccountId === participant.id}
                              title="Mời khỏi phòng"
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/80 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <i className="fas fa-user-slash text-[10px]"></i>
                            </button>
                            <button
                              onClick={() => {
                                void handleBanParticipant(participant.id);
                              }}
                              disabled={moderationTargetAccountId === participant.id}
                              title="Cấm khỏi phòng"
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/80 text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <i className="fas fa-ban text-[10px]"></i>
                            </button>
                          </>
                        ) : (
                          <button className="opacity-0 transition group-hover:opacity-100">
                            <i className="fas fa-ellipsis-h text-white/60 hover:text-white"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#141826] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${
                  confirmDialog.action === 'ban'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                <i
                  className={`fas ${
                    confirmDialog.action === 'kick'
                      ? 'fa-user-slash'
                      : confirmDialog.action === 'ban'
                        ? 'fa-ban'
                        : 'fa-triangle-exclamation'
                  }`}
                ></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{confirmDialog.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseConfirmDialog}
                disabled={isConfirmDialogBusy}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  void handleConfirmDialog();
                }}
                disabled={isConfirmDialogBusy}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmDialog.action === 'ban'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isConfirmDialogBusy
                  ? confirmDialog.action === 'end-room'
                    ? 'Đang kết thúc...'
                    : confirmDialog.action === 'kick'
                      ? 'Đang mời...'
                      : 'Đang cấm...'
                  : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
