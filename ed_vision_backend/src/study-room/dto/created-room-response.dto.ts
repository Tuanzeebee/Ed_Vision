export class CreatedRoomResponseDto {
  room_id!: number;
  host_id!: number | null;
  title!: string;
  room_mode!: string;
  cover_url!: string | null;
  cover_type!: string | null;
  max_participants!: number;
  current_participants_count!: number;
  has_password!: boolean;
  created_at!: Date;
}
