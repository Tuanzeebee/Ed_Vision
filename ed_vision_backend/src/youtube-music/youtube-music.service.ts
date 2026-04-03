import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  YouTubeTrackDto,
  YouTubePlaylistDto,
  PodcastShowDto,
  PodcastEpisodeDto,
  YouTubeArtistDto,
  SearchTracksResponseDto,
  TopChartsResponseDto,
  PlaylistResponseDto,
  PodcastsResponseDto,
  HomeHeroResponseDto,
} from './dto';

interface YouTubeApiResponse<T> {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: T[];
}

interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime?: string;
  };
}

interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    categoryId: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

interface YouTubePlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    playlistId: string;
    position: number;
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
  contentDetails?: {
    videoId: string;
    videoPublishedAt: string;
  };
}

interface YouTubePlaylistInfo {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
  };
  contentDetails?: {
    itemCount: number;
  };
}

@Injectable()
export class YouTubeMusicService {
  private readonly logger = new Logger(YouTubeMusicService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('YOUTUBE_API_KEY is not set in environment variables');
    }
  }

  /**
   * Generic helper to make YouTube API requests
   */
  private async youtubeGet<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    url.searchParams.append('key', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    }

    this.logger.debug(
      `Fetching: ${url.toString().replace(this.apiKey, '***')}`,
    );

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`YouTube API error: ${response.status} - ${errorText}`);
      throw new Error(`YouTube API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Parse ISO 8601 duration to milliseconds
   */
  private parseIsoDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  /**
   * Format duration from milliseconds to string
   */
  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get the best available thumbnail URL
   */
  private getBestThumbnail(
    thumbnails: YouTubeSearchItem['snippet']['thumbnails'],
  ): string {
    return (
      thumbnails.maxres?.url ||
      thumbnails.standard?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      ''
    );
  }

  /**
   * Parse artist from video title (common pattern: "Artist - Song Title")
   */
  private parseArtistFromTitle(title: string, channelTitle: string): string {
    // Common patterns: "Artist - Song", "Artist: Song", "Artist | Song"
    const patterns = [
      /^(.+?)\s*[-–—]\s*.+$/, // Artist - Song
      /^(.+?)\s*:\s*.+$/, // Artist: Song
      /^(.+?)\s*\|\s*.+$/, // Artist | Song
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback to channel title
    return channelTitle;
  }

  /**
   * Parse song title from video title
   */
  private parseSongFromTitle(title: string): string {
    // Common patterns
    const patterns = [
      /^.+?\s*[-–—]\s*(.+)$/, // Artist - Song
      /^.+?\s*:\s*(.+)$/, // Artist: Song
      /^.+?\s*\|\s*(.+)$/, // Artist | Song
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        // Clean up common suffixes
        return match[1]
          .replace(/\s*\(Official.*?\)/gi, '')
          .replace(/\s*\[Official.*?\]/gi, '')
          .replace(/\s*\(Music Video\)/gi, '')
          .replace(/\s*\(Lyric.*?\)/gi, '')
          .replace(/\s*\(Audio\)/gi, '')
          .trim();
      }
    }

    // Fallback to original title cleaned up
    return title
      .replace(/\s*\(Official.*?\)/gi, '')
      .replace(/\s*\[Official.*?\]/gi, '')
      .replace(/\s*\(Music Video\)/gi, '')
      .replace(/\s*\(Lyric.*?\)/gi, '')
      .replace(/\s*\(Audio\)/gi, '')
      .trim();
  }

  /**
   * Map YouTube video to Track DTO
   */
  private mapVideoToTrack(video: YouTubeVideoItem): YouTubeTrackDto {
    const durationMs = video.contentDetails?.duration
      ? this.parseIsoDuration(video.contentDetails.duration)
      : undefined;

    return {
      id: video.id,
      provider: 'youtube',
      title: this.parseSongFromTitle(video.snippet.title),
      artist: this.parseArtistFromTitle(
        video.snippet.title,
        video.snippet.channelTitle,
      ),
      durationMs,
      duration: durationMs ? this.formatDuration(durationMs) : undefined,
      imageUrl: this.getBestThumbnail(video.snippet.thumbnails),
      externalUrl: `https://www.youtube.com/watch?v=${video.id}`,
      channelId: video.snippet.channelId,
      publishedAt: video.snippet.publishedAt,
      viewCount: video.statistics?.viewCount
        ? parseInt(video.statistics.viewCount, 10)
        : undefined,
    };
  }

  /**
   * Map YouTube search item to Track DTO
   */
  private mapSearchItemToTrack(item: YouTubeSearchItem): YouTubeTrackDto {
    const videoId = item.id.videoId || '';

    return {
      id: videoId,
      provider: 'youtube',
      title: this.parseSongFromTitle(item.snippet.title),
      artist: this.parseArtistFromTitle(
        item.snippet.title,
        item.snippet.channelTitle,
      ),
      imageUrl: this.getBestThumbnail(item.snippet.thumbnails),
      externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
    };
  }

  /**
   * Search for music tracks
   */
  async searchTracks(
    query: string,
    pageToken?: string,
    maxResults = 20,
  ): Promise<SearchTracksResponseDto> {
    const response = await this.youtubeGet<
      YouTubeApiResponse<YouTubeSearchItem>
    >('search', {
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: maxResults.toString(),
      q: query,
      pageToken: pageToken || '',
    });

    // Get video details for duration
    const videoIds = response.items
      .filter((item) => item.id.videoId)
      .map((item) => item.id.videoId)
      .join(',');

    let videosWithDetails: YouTubeVideoItem[] = [];
    if (videoIds) {
      const detailsResponse = await this.youtubeGet<
        YouTubeApiResponse<YouTubeVideoItem>
      >('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
      });
      videosWithDetails = detailsResponse.items;
    }

    const tracks =
      videosWithDetails.length > 0
        ? videosWithDetails.map((video) => this.mapVideoToTrack(video))
        : response.items.map((item) => this.mapSearchItemToTrack(item));

    return {
      tracks,
      nextPageToken: response.nextPageToken || null,
      totalResults: response.pageInfo.totalResults,
    };
  }

  /**
   * Get top music charts
   */
  async getTopCharts(
    regionCode = 'US',
    pageToken?: string,
    maxResults = 20,
  ): Promise<TopChartsResponseDto> {
    const response = await this.youtubeGet<
      YouTubeApiResponse<YouTubeVideoItem>
    >('videos', {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      videoCategoryId: '10', // Music category
      regionCode,
      maxResults: maxResults.toString(),
      pageToken: pageToken || '',
    });

    const tracks = response.items.map((video) => this.mapVideoToTrack(video));

    return {
      tracks,
      nextPageToken: response.nextPageToken || null,
    };
  }

  /**
   * Get playlist with tracks
   */
  async getPlaylist(
    playlistId: string,
    pageToken?: string,
    maxResults = 50,
  ): Promise<PlaylistResponseDto> {
    // Get playlist info
    const playlistResponse = await this.youtubeGet<
      YouTubeApiResponse<YouTubePlaylistInfo>
    >('playlists', {
      part: 'snippet,contentDetails',
      id: playlistId,
    });

    if (!playlistResponse.items.length) {
      throw new Error('Playlist not found');
    }

    const playlistInfo = playlistResponse.items[0];

    // Get playlist items
    const itemsResponse = await this.youtubeGet<
      YouTubeApiResponse<YouTubePlaylistItem>
    >('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: maxResults.toString(),
      pageToken: pageToken || '',
    });

    // Get video details for duration
    const videoIds = itemsResponse.items
      .filter((item) => item.contentDetails?.videoId)
      .map((item) => item.contentDetails!.videoId)
      .join(',');

    let videosWithDetails: YouTubeVideoItem[] = [];
    if (videoIds) {
      const detailsResponse = await this.youtubeGet<
        YouTubeApiResponse<YouTubeVideoItem>
      >('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
      });
      videosWithDetails = detailsResponse.items;
    }

    const tracks = videosWithDetails.map((video) =>
      this.mapVideoToTrack(video),
    );

    const playlist: YouTubePlaylistDto = {
      id: playlistInfo.id,
      title: playlistInfo.snippet.title,
      description: playlistInfo.snippet.description,
      imageUrl: this.getBestThumbnail(playlistInfo.snippet.thumbnails),
      trackCount: playlistInfo.contentDetails?.itemCount,
      channelTitle: playlistInfo.snippet.channelTitle,
      externalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    };

    return {
      playlist,
      tracks,
      nextPageToken: itemsResponse.nextPageToken || null,
    };
  }

  /**
   * Get podcasts (searching for podcast-related content)
   */
  async getPodcasts(maxResults = 10): Promise<PodcastsResponseDto> {
    // Search for podcast channels
    const podcastKeywords = ['podcast', 'talk show', 'interview'];
    const showsPromises = podcastKeywords.map((keyword) =>
      this.youtubeGet<YouTubeApiResponse<YouTubeSearchItem>>('search', {
        part: 'snippet',
        type: 'channel',
        q: `${keyword} music`,
        maxResults: Math.ceil(maxResults / podcastKeywords.length).toString(),
      }),
    );

    // Search for podcast episodes (videos)
    const episodesResponse = await this.youtubeGet<
      YouTubeApiResponse<YouTubeSearchItem>
    >('search', {
      part: 'snippet',
      type: 'video',
      q: 'podcast music interview',
      maxResults: maxResults.toString(),
    });

    const showsResponses = await Promise.all(showsPromises);

    const shows: PodcastShowDto[] = [];
    const seenChannelIds = new Set<string>();

    for (const response of showsResponses) {
      for (const item of response.items) {
        const channelId = item.id.channelId || item.snippet.channelId;
        if (channelId && !seenChannelIds.has(channelId)) {
          seenChannelIds.add(channelId);
          shows.push({
            id: channelId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            description: item.snippet.description,
            imageUrl: this.getBestThumbnail(item.snippet.thumbnails),
            externalUrl: `https://www.youtube.com/channel/${channelId}`,
          });
        }
      }
    }

    // Get video details for episodes
    const videoIds = episodesResponse.items
      .filter((item) => item.id.videoId)
      .map((item) => item.id.videoId)
      .join(',');

    let videosWithDetails: YouTubeVideoItem[] = [];
    if (videoIds) {
      const detailsResponse = await this.youtubeGet<
        YouTubeApiResponse<YouTubeVideoItem>
      >('videos', {
        part: 'snippet,contentDetails',
        id: videoIds,
      });
      videosWithDetails = detailsResponse.items;
    }

    const episodes: PodcastEpisodeDto[] = videosWithDetails.map((video) => {
      const durationMs = video.contentDetails?.duration
        ? this.parseIsoDuration(video.contentDetails.duration)
        : undefined;

      return {
        id: video.id,
        title: video.snippet.title,
        showTitle: video.snippet.channelTitle,
        showId: video.snippet.channelId,
        description: video.snippet.description,
        imageUrl: this.getBestThumbnail(video.snippet.thumbnails),
        durationMs,
        duration: durationMs ? this.formatDuration(durationMs) : undefined,
        publishedAt: video.snippet.publishedAt,
        externalUrl: `https://www.youtube.com/watch?v=${video.id}`,
      };
    });

    return {
      shows: shows.slice(0, maxResults),
      episodes,
    };
  }

  /**
   * Get home hero (featured track and top artists)
   */
  async getHomeHero(regionCode = 'US'): Promise<HomeHeroResponseDto> {
    // Get top chart to use first track as hero
    const topCharts = await this.getTopCharts(regionCode, undefined, 10);

    if (!topCharts.tracks.length) {
      throw new Error('No tracks available for hero');
    }

    const heroTrack = topCharts.tracks[0];

    // Group tracks by artist and create artist list
    const artistMap = new Map<
      string,
      { track: YouTubeTrackDto; count: number }
    >();

    for (const track of topCharts.tracks) {
      const existing = artistMap.get(track.artist);
      if (existing) {
        existing.count++;
      } else {
        artistMap.set(track.artist, { track, count: 1 });
      }
    }

    const artists: YouTubeArtistDto[] = Array.from(artistMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([name, data]) => ({
        id: data.track.channelId || name,
        name,
        imageUrl: data.track.imageUrl,
        externalUrl: data.track.channelId
          ? `https://www.youtube.com/channel/${data.track.channelId}`
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`,
      }));

    return {
      track: heroTrack,
      artists,
    };
  }
}
