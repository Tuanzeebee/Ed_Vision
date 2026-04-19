export const STUDY_ROOM_SOCKET_NAMESPACE = '/study-rooms';
export const STUDY_ROOM_USER_ROOM_PREFIX = 'study-room:user:';
export const STUDY_ROOM_CHANNEL_PREFIX = 'study-room:room:';

export const DEFAULT_STUDY_ROOM_PAGE_SIZE = 12;
export const MAX_STUDY_ROOM_PAGE_SIZE = 50;
export const DEFAULT_LEADERBOARD_LIMIT = 10;
export const MAX_LEADERBOARD_LIMIT = 50;

export const STUDY_ROOM_PRESENCE_TTL_SECONDS = Math.max(
  30,
  Number.parseInt(
    process.env.STUDY_ROOM_PRESENCE_TTL_SECONDS?.trim() ?? '90',
    10,
  ) || 90,
);

export const STUDY_ROOM_MODES = ['audio', 'video', 'focus'] as const;
export const STUDY_ROOM_COVER_TYPES = ['image', 'youtube'] as const;
export const STUDY_ROOM_ACTION_TYPES = ['kick', 'mute'] as const;
