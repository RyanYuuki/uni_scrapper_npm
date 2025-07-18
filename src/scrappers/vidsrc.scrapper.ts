import axios, { AxiosResponse } from "axios";
import { BaseSource, Stream } from "../index";

class VidSrcSource extends BaseSource {
  baseUrl = "https://himer365ery.com/play";
  jarviBaseUrl = "https://jarvi366dow.com";
  headers = {
    Referer: "https://himer365ery.com/",
    origin: "https://himer365ery.com",
  };

  constructor() {
    super();
  }

  private extractFileUrl(htmlContent: string): string | null {
    const fileUrlRegex = /"file":"([^"]+)"/;
    const match = htmlContent.match(fileUrlRegex);
    return match ? match[1].replace(/\\\//g, "/") : null;
  }

  private extractKey(htmlContent: string): string | null {
    const keyRegex = /"key":"([^"]+)"/;
    const match = htmlContent.match(keyRegex);
    return match ? match[1] : null;
  }

  private buildFinalUrl(decodedFileUrl: string): string {
    return decodedFileUrl.includes("https")
      ? decodedFileUrl
      : `${this.jarviBaseUrl}${decodedFileUrl}`;
  }

  private buildPlaylistUrl(file: string): string {
    const strippedUri = decodeURIComponent(file.replaceAll("~", ""));
    return strippedUri.includes("playlist")
      ? `${this.jarviBaseUrl}/${strippedUri}`
      : `${this.jarviBaseUrl}/playlist/${strippedUri}.txt`;
  }

  private async fetchStreamData(
    url: string,
    quality: string,
    key: string
  ): Promise<Stream | null> {
    try {
      const response: AxiosResponse<string> = await axios.get(url, {
        headers: {
          ...this.headers,
          "X-CSRF-TOKEN": key,
        },
      });

      return {
        url: response.data,
        quality,
        subtitles: [],
        headers: this.headers,
      };
    } catch (error) {
      console.error(`Error fetching stream from ${url}:`, error);
      return null;
    }
  }

  private async processTvShowStreams(
    playerData: any[],
    season: string,
    episode: string,
    key: string
  ): Promise<Stream[]> {
    const seasonBlock = playerData.find((s) => s.id == season);
    if (!seasonBlock || !Array.isArray(seasonBlock.folder)) {
      throw new Error(`Invalid season block for season ${season}`);
    }

    const episodeBlock = seasonBlock.folder.find((e) => e.episode == episode);
    if (!episodeBlock || !Array.isArray(episodeBlock.folder)) {
      throw new Error(`Invalid episode block for episode ${episode}`);
    }

    const promises = episodeBlock.folder
      .filter((source) => source.file && source.title)
      .map((source) => {
        const playlistUrl = this.buildPlaylistUrl(source.file);
        return this.fetchStreamData(playlistUrl, source.title, key);
      });

    const results = await Promise.all(promises);
    return results.filter((stream): stream is Stream => stream !== null);
  }

  private async processMovieStreams(
    playerData: any[],
    key: string
  ): Promise<Stream[]> {
    const promises = playerData
      .filter((source) => source.file && source.title)
      .map((source) => {
        const playlistUrl = `${
          this.jarviBaseUrl
        }/playlist/${source.file.replaceAll("~", "")}.txt`;
        return this.fetchStreamData(playlistUrl, source.title, key);
      });

    const results = await Promise.all(promises);
    return results.filter((stream): stream is Stream => stream !== null);
  }

  public async getStreams(slug: string): Promise<Stream[]> {
    try {
      const slugData = JSON.parse(slug);
      const { imdbId, season, episode } = slugData;
      const isMovie = !season && !episode;

      const url = `${this.baseUrl}/${imdbId}`;
      const response = await axios.get(url, { headers: this.headers });
      const htmlContent = response.data;

      const fileUrl = this.extractFileUrl(htmlContent);
      const key = this.extractKey(htmlContent);

      if (!fileUrl || !key) {
        console.warn("Failed to extract file URL or key from HTML content");
        return [];
      }

      const decodedFileUrl = decodeURIComponent(fileUrl);
      const finalUrl = this.buildFinalUrl(decodedFileUrl);

      const playerResponse = await axios.get(finalUrl, {
        headers: {
          ...this.headers,
          "X-CSRF-TOKEN": key,
        },
      });

      if (isMovie) {
        return await this.processMovieStreams(playerResponse.data, key);
      } else {
        if (!season || !episode) {
          throw new Error("Season and episode are required for TV shows");
        }
        return await this.processTvShowStreams(
          playerResponse.data,
          season,
          episode,
          key
        );
      }
    } catch (error) {
      console.error("Error in getStreams:", error);
      return [];
    }
  }
}

export default VidSrcSource;
