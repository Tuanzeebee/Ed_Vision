import { IsString, IsIn, IsNotEmpty } from 'class-validator';

const CERT_TYPES = ['ielts', 'toeic', 'mos-word', 'mos-excel', 'mos-powerpoint'] as const;
const ALL_BANDS = [
  '4.0', '5.0', '6.0', '6.5', '7.0', '7.5+',          // IELTS
  '350-495', '500-599', '600-699', '700-799', '800+',   // TOEIC
  'associate', 'expert',                                 // MOS
] as const;

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(CERT_TYPES)
  cert_type: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(ALL_BANDS)
  target_band: string;
}

export class CompleteTopicDto {
  @IsString()
  @IsNotEmpty()
  topic_key: string; // e.g. 'grammar.basic_tenses'
}

export class EnrollmentResponseDto {
  id: number;
  cert_type: string;
  target_band: string;
  status: 'active' | 'completed';
  enrolled_at: Date;
  completed_at?: Date | null;
  completed_topics: string[]; // array of topic_key strings
  total_topics?: number;
}
