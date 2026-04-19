export class RoomUserListItemDto {
  userId!: number;
  fullName!: string | null;
  avatarUrl!: string | null;
  isHost!: boolean;
  micEnabled!: boolean;
  cameraEnabled!: boolean;
}
