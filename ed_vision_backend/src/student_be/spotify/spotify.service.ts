import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  explicit: boolean;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private tokenCache: SpotifyToken | null = null;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || '';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('Spotify credentials not configured. Music search will be disabled.');
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is cached and still valid
    if (this.tokenCache && this.tokenCache.expires_at > Date.now()) {
      return this.tokenCache.access_token;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new HttpException(
        'Spotify credentials not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          },
        },
      );

      const { access_token, expires_in } = response.data;
      
      // Cache token with 5 minutes buffer before expiry
      this.tokenCache = {
        access_token,
        expires_at: Date.now() + (expires_in - 300) * 1000,
      };

      return access_token;
    } catch (error) {
      this.logger.error('Failed to get Spotify access token', error);
      throw new HttpException(
        'Failed to authenticate with Spotify',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async searchTracks(
    query: string,
    limit: number = 20,
    offset: number = 0,
    market: string = 'VN',
  ) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get<SpotifySearchResponse>(
        'https://api.spotify.com/v1/search',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: query,
            type: 'track',
            limit,
            offset,
            market,
          },
        },
      );

      const { items, total } = response.data.tracks;

      // Map Spotify tracks to our format
      const tracks = items.map((track) => {
        // Get album cover (prefer medium size)
        const albumImage = track.album.images.find((img) => img.height >= 300) || 
                          track.album.images[0];

        // Format duration
        const durationMs = track.duration_ms;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        return {
          id: `spotify:track:${track.id}`,
          source: 'spotify' as const,
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          album: track.album.name,
          durationMs: track.duration_ms,
          duration,
          imageUrl: albumImage?.url,
          previewUrl: track.preview_url,
          spotifyUrl: track.external_urls.spotify,
          explicit: track.explicit,
        };
      });

      const nextOffset = offset + items.length < total ? offset + items.length : null;

      return {
        tracks,
        nextOffset,
        total,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        if (status === 401) {
          this.logger.error('Spotify authentication failed');
          throw new HttpException(
            'Authentication with Spotify failed',
            HttpStatus.UNAUTHORIZED,
          );
        } else if (status === 429) {
          this.logger.warn('Spotify rate limit exceeded');
          throw new HttpException(
            'Too many requests to Spotify. Please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        } else if (status && status >= 500) {
          this.logger.error('Spotify service error', error);
          throw new HttpException(
            'Spotify service is temporarily unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }

      this.logger.error('Failed to search Spotify tracks', error);
      throw new HttpException(
        'Failed to search tracks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
