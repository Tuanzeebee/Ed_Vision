import { Controller, Get, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { SearchTracksDto } from './dto/search-tracks.dto';

@Controller('student/spotify')
// @UseGuards(JwtAuthGuard) // TODO: implement auth guard
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('search-tracks')
  async searchTracks(@Query() searchDto: SearchTracksDto) {
    const { q, limit = 20, offset = 0, market = 'VN' } = searchDto;
    return this.spotifyService.searchTracks(q, limit, offset, market);
  }
}
