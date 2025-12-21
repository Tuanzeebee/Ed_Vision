import { Module } from '@nestjs/common';
import { YouTubeMusicController } from './youtube-music.controller';
import { YouTubeMusicService } from './youtube-music.service';

@Module({
  controllers: [YouTubeMusicController],
  providers: [YouTubeMusicService],
  exports: [YouTubeMusicService],
})
export class YouTubeMusicModule {}
