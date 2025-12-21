import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { YouTubeMusicService } from './youtube-music.service';

@Controller('api/music')
export class YouTubeMusicController {
  constructor(private readonly youtubeMusicService: YouTubeMusicService) {}

  /**
   * Search for music tracks
   * GET /api/music/search?q=query&pageToken=xxx
   */
  @Get('search')
  async searchTracks(
    @Query('q') query: string,
    @Query('pageToken') pageToken?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    if (!query) {
      throw new HttpException('Query parameter "q" is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.youtubeMusicService.searchTracks(
        query,
        pageToken,
        maxResults ? parseInt(maxResults, 10) : 20,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to search tracks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get top music charts
   * GET /api/music/top-charts?regionCode=VN&pageToken=xxx
   */
  @Get('top-charts')
  async getTopCharts(
    @Query('regionCode') regionCode?: string,
    @Query('pageToken') pageToken?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    try {
      return await this.youtubeMusicService.getTopCharts(
        regionCode || 'US',
        pageToken,
        maxResults ? parseInt(maxResults, 10) : 20,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to get top charts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get home hero content (featured track + top artists)
   * GET /api/music/home-hero?regionCode=VN
   */
  @Get('home-hero')
  async getHomeHero(@Query('regionCode') regionCode?: string) {
    try {
      return await this.youtubeMusicService.getHomeHero(regionCode || 'US');
    } catch (error) {
      throw new HttpException(
        `Failed to get home hero: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get playlist with tracks
   * GET /api/music/playlist/:id?pageToken=xxx
   */
  @Get('playlist/:id')
  async getPlaylist(
    @Param('id') playlistId: string,
    @Query('pageToken') pageToken?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    if (!playlistId) {
      throw new HttpException(
        'Playlist ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.youtubeMusicService.getPlaylist(
        playlistId,
        pageToken,
        maxResults ? parseInt(maxResults, 10) : 50,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to get playlist: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get podcasts (shows and episodes)
   * GET /api/music/podcasts
   */
  @Get('podcasts')
  async getPodcasts(@Query('maxResults') maxResults?: string) {
    try {
      return await this.youtubeMusicService.getPodcasts(
        maxResults ? parseInt(maxResults, 10) : 10,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to get podcasts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
