import { Controller, Get, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('api/spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('featured')
  async getFeatured() {
    return this.spotifyService.getFeatured();
  }

  @Get('top-artists')
  async getTopArtists() {
    return this.spotifyService.getTopArtists();
  }

  @Get('top-charts')
  async getTopCharts() {
    return this.spotifyService.getTopCharts();
  }

  @Get('discover')
  async getDiscover() {
    return this.spotifyService.getDiscover();
  }

  @Get('podcasts')
  async getPodcasts() {
    return this.spotifyService.getPodcasts();
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('types') types?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const typeArray = types ? types.split(',') : ['track', 'artist', 'album', 'show', 'episode'];
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.spotifyService.search(query, typeArray, limitNum, offsetNum);
  }
}
