export type StudyRoomMode = 'audio' | 'video' | 'focus';
export type StudyRoomCoverType = 'image' | 'youtube';
export type StudyRoomDisconnectReason =
  | 'left'
  | 'disconnected'
  | 'kicked'
  | 'banned';

export interface StudyRoomSocketUser {
  accountId: number;
  email: string;
  role: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface StudyRoomParticipantLiveState {
  roomId: number;
  accountId: number;
  isHost: boolean;
  micOn: boolean;
  cameraOn: boolean;
  handRaised: boolean;
  joinedAt: string;
  lastSeenAt: string;
  sessionStartedAt: string;
  participantRecordId: number | null;
  socketIds: string[];
}

export interface StudyRoomParticipantPresence {
  accountId: number;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  isHost: boolean;
  micOn: boolean;
  cameraOn: boolean;
  handRaised: boolean;
  joinedAt: string;
  lastSeenAt: string;
}

export interface StudyRoomSnapshot {
  onlineCount: number;
  participants: StudyRoomParticipantPresence[];
}
