export class JoinPublicRoomResponseDto {
  success!: boolean;
  room_id!: number;
  participant_id!: number;
  livekit_token!: string;
  livekit_url!: string;
}
