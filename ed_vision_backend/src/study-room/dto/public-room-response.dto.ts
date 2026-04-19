export class PublicRoomResponseDto {
  room_id!: number;
  title!: string;
  room_mode!: string;
  cover_url!: string | null;
  cover_type!: string | null;
  max_participants!: number;
  current_participants_count!: number;
  has_password!: boolean;
}
