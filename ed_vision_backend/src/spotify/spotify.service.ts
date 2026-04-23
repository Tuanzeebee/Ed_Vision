import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

@Injectable()
export class SpotifyService {
  private token: SpotifyToken | null = null;
  private readonly clientId = process.env.SPOTIFY_CLIENT_ID;
  private readonly clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  private readonly baseUrl = 'https://api.spotify.com/v1';

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && this.token.expires_at > Date.now()) {
      return this.token.access_token;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new HttpException(
        'Spotify credentials not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${this.clientId}:${this.clientSecret}`,
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.token = {
        access_token: response.data.access_token,
        expires_at: Date.now() + response.data.expires_in * 1000 - 60000, // Refresh 1 min early
      };

      return this.token.access_token;
    } catch (error) {
      throw new HttpException(
        'Failed to get Spotify access token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async spotifyRequest(endpoint: string, params: any = {}) {
    const token = await this.getAccessToken();
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get featured playlists for hero section
  async getFeatured() {
    const data = await this.spotifyRequest('/browse/featured-playlists', {
      limit: 1,
    });

    const playlist = data.playlists.items[0];
    if (!playlist) {
      return null;
    }

    // Get tracks from the playlist
    const playlistDetails = await this.spotifyRequest(
      `/playlists/${playlist.id}`,
    );
    const firstTrack = playlistDetails.tracks.items[0]?.track;

    return {
      title: playlist.name,
      subtitle: playlist.description || playlist.owner.display_name,
      imageUrl: playlist.images[0]?.url,
      primaryTrack: firstTrack
        ? {
            id: firstTrack.id,
            source: 'spotify',
            title: firstTrack.name,
            artist: firstTrack.artists.map((a) => a.name).join(', '),
            album: firstTrack.album.name,
            durationMs: firstTrack.duration_ms,
            imageUrl: firstTrack.album.images[0]?.url,
            previewUrl: firstTrack.preview_url,
            spotifyUrl: firstTrack.external_urls.spotify,
            explicit: firstTrack.explicit,
          }
        : null,
      spotifyUrl: playlist.external_urls.spotify,
    };
  }

  // Get top artists (using multiple genres)
  async getTopArtists() {
    const genres = ['pop', 'rock', 'hip-hop', 'jazz', 'electronic', 'indie'];
    const artists: Array<{
      id: string;
      name: string;
      imageUrl: string;
      followers: number;
      popularity: number;
      plays: string;
    }> = [];

    for (const genre of genres.slice(0, 6)) {
      try {
        const data = await this.spotifyRequest('/search', {
          q: `genre:${genre}`,
          type: 'artist',
          limit: 1,
        });

        if (data.artists.items[0]) {
          const artist = data.artists.items[0];
          artists.push({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images[0]?.url,
            followers: artist.followers.total,
            popularity: artist.popularity,
            plays: this.formatFollowers(artist.followers.total),
          });
        }
      } catch (error) {
        console.error(`Failed to fetch artist for genre ${genre}:`, error);
      }
    }

    return artists;
  }

  // Get top charts from Global Top 50 playlist
  async getTopCharts() {
    // Spotify's Global Top 50 playlist ID
    const playlistId = '37i9dQZEVXbMDoHDwVN2tF';

    const data = await this.spotifyRequest(`/playlists/${playlistId}`);

    return data.tracks.items.slice(0, 10).map((item, index) => ({
      rank: index + 1,
      id: item.track.id,
      source: 'spotify',
      title: item.track.name,
      artist: item.track.artists.map((a) => a.name).join(', '),
      album: item.track.album.name,
      duration: this.formatDuration(item.track.duration_ms),
      durationMs: item.track.duration_ms,
      imageUrl: item.track.album.images[0]?.url,
      previewUrl: item.track.preview_url,
      spotifyUrl: item.track.external_urls.spotify,
      explicit: item.track.explicit,
      plays: Math.floor(Math.random() * 500),
    }));
  }

  // Get discover content (new releases + recommendations)
  async getDiscover() {
    const newReleases = await this.spotifyRequest('/browse/new-releases', {
      limit: 10,
    });

    const albums = newReleases.albums.items.map((album) => ({
      id: album.id,
      title: album.name,
      artist: album.artists.map((a) => a.name).join(', '),
      imageUrl: album.images[0]?.url,
      totalTracks: album.total_tracks,
      releaseDate: album.release_date,
      spotifyUrl: album.external_urls.spotify,
    }));

    return {
      newReleases: albums,
      topBillboard: await this.getTopCharts(),
    };
  }

  // Get podcasts (shows + episodes)
  async getPodcasts() {
    const keywords = ['tech', 'news', 'education', 'science', 'business'];
    const shows: Array<{
      id: string;
      title: string;
      publisher: string;
      imageUrl: string;
      totalEpisodes: number;
      description: string;
      spotifyUrl: string;
    }> = [];

    for (const keyword of keywords) {
      try {
        const data = await this.spotifyRequest('/search', {
          q: keyword,
          type: 'show',
          limit: 1,
        });

        if (data.shows.items[0]) {
          const show = data.shows.items[0];
          shows.push({
            id: show.id,
            title: show.name,
            publisher: show.publisher,
            imageUrl: show.images[0]?.url,
            totalEpisodes: show.total_episodes,
            description: show.description,
            spotifyUrl: show.external_urls.spotify,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch show for ${keyword}:`, error);
      }
    }

    // Get episodes from first show
    const episodes: Array<{
      id: string;
      title: string;
      showTitle: string;
      imageUrl: string;
      durationMs: number;
      duration: string;
      description: string;
      spotifyUrl: string;
      releaseDate: string;
      explicit: boolean;
    }> = [];
    if (shows.length > 0) {
      try {
        const data = await this.spotifyRequest(
          `/shows/${shows[0].id}/episodes`,
          { limit: 5 },
        );

        episodes.push(
          ...data.items.map((episode) => ({
            id: episode.id,
            title: episode.name,
            showTitle: shows[0].title,
            imageUrl: episode.images[0]?.url,
            durationMs: episode.duration_ms,
            duration: this.formatDuration(episode.duration_ms),
            description: episode.description,
            spotifyUrl: episode.external_urls.spotify,
            releaseDate: episode.release_date,
            explicit: episode.explicit,
          })),
        );
      } catch (error) {
        console.error('Failed to fetch episodes:', error);
      }
    }

    return {
      shows,
      episodes,
    };
  }

  // Search across all types
  async search(
    query: string,
    types: string[] = ['track', 'artist', 'album', 'show', 'episode'],
    limit: number = 10,
    offset: number = 0,
  ) {
    const data = await this.spotifyRequest('/search', {
      q: query,
      type: types.join(','),
      limit,
      offset,
    });

    const results: any = {
      tracks: [],
      artists: [],
      albums: [],
      shows: [],
      episodes: [],
    };

    if (data.tracks) {
      results.tracks = data.tracks.items.map((track) => ({
        id: track.id,
        source: 'spotify',
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        durationMs: track.duration_ms,
        duration: this.formatDuration(track.duration_ms),
        imageUrl: track.album.images[0]?.url,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        explicit: track.explicit,
      }));
    }

    if (data.artists) {
      results.artists = data.artists.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url,
        followers: artist.followers.total,
        popularity: artist.popularity,
        plays: this.formatFollowers(artist.followers.total),
      }));
    }

    if (data.albums) {
      results.albums = data.albums.items.map((album) => ({
        id: album.id,
        title: album.name,
        artist: album.artists.map((a) => a.name).join(', '),
        imageUrl: album.images[0]?.url,
        totalTracks: album.total_tracks,
        releaseDate: album.release_date,
        spotifyUrl: album.external_urls.spotify,
      }));
    }

    if (data.shows) {
      results.shows = data.shows.items.map((show) => ({
        id: show.id,
        title: show.name,
        publisher: show.publisher,
        imageUrl: show.images[0]?.url,
        totalEpisodes: show.total_episodes,
        description: show.description,
        spotifyUrl: show.external_urls.spotify,
      }));
    }

    if (data.episodes) {
      results.episodes = data.episodes.items.map((episode) => ({
        id: episode.id,
        title: episode.name,
        showTitle: episode.show?.name || '',
        imageUrl: episode.images[0]?.url,
        durationMs: episode.duration_ms,
        duration: this.formatDuration(episode.duration_ms),
        description: episode.description,
        spotifyUrl: episode.external_urls.spotify,
        releaseDate: episode.release_date,
        explicit: episode.explicit,
      }));
    }

    return results;
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private formatFollowers(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M Plays`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K Plays`;
    }
    return `${count} Plays`;
  }
}
