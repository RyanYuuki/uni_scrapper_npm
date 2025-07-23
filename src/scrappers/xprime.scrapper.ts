import { rotatingAxios as axios } from "../index";
import { Stream, BaseSource, Subtitle, Media } from "../index";

export class Xprime extends BaseSource {
  baseUrl = "https://xprime.tv";

  headers = {
    Referer: `${this.baseUrl}/`,
    origin: this.baseUrl,
  };

  async getStreams(slug: string): Promise<Stream[]> {
    const { id, imdbId, name, year, season, episode } = JSON.parse(slug);
    return await this.fetchXprime(id, imdbId, name, year, season, episode);
  }

  private async fetchXprime(
    id: string,
    imdbId: string,
    name: string,
    year: string | number,
    season?: string | number,
    episode?: string | number
  ): Promise<Stream[]> {
    const fallback: Stream[] = [];

    try {
      let url = `https://backend.xprime.tv/primebox?name=${encodeURIComponent(
        name
      )}`;

      if (year !== undefined) url += `&fallback_year=${year}`;
      if (id !== undefined) url += `&id=${id}`;
      if (imdbId !== undefined) url += `&imdb=${imdbId}`;

      if (season != null && episode != null) {
        url += `&season=${season}&episode=${episode}`;
      }

      const primeboxUrl = url;
      const phoenixUrl = url.replaceAll("primebox", "phoenix");
      const primenetUrl = url.replaceAll("primebox", "primenet");

      const futures = await Promise.allSettled([
        this.fetchPrimebox(primeboxUrl),
        this.fetchPhoenix(phoenixUrl),
        this.fetchPrimenet(primenetUrl),
      ]);

      const streams: Stream[] = [];

      for (const result of futures) {
        if (result.status === "fulfilled" && result.value) {
          streams.push(...result.value);
        }
      }

      return streams;
    } catch (error) {
      console.error("fetchXprime error:", error);
      return fallback;
    }
  }

  private async fetchPrimebox(url: string): Promise<Stream[] | null> {
    try {
      const response = await axios.get(url);
      const data = response.data;
      const streams = data.streams || {};
      const result: Stream[] = [];

      Object.entries(streams).forEach(([quality, streamUrl]) => {
        const subtitles: Subtitle[] = [];
        if (data.subtitles) {
          for (const sub of data.subtitles) {
            subtitles.push({
              label: sub.label || "",
              file: sub.file || "",
            });
          }
        }

        result.push({
          url: streamUrl as string,
          quality: `Primebox - ${quality}`,
          subtitles,
          headers: this.headers,
        });
      });

      return result;
    } catch (e) {
      console.error("Failed to fetch/parse Primebox:", e);
      return null;
    }
  }

  private async fetchPhoenix(url: string): Promise<Stream[] | null> {
    try {
      const response = await axios.get(url);
      const data = response.data;

      if (data.url) {
        const subtitles: Subtitle[] = [];
        if (data.subs && data.subs.length > 0) {
          const phoenixSubtitles = data.subtitles || [];
          for (const sub of phoenixSubtitles) {
            subtitles.push({
              label: sub.label || "",
              file: sub.file || sub.src || "",
            });
          }
        }

        return [
          {
            url: data.url,
            quality: "Phoenix - Auto",
            subtitles,
            headers: this.headers,
          },
        ];
      }
      return [];
    } catch (e) {
      console.error("Failed to fetch/parse Phoenix:", e);
      return null;
    }
  }

  private async fetchPrimenet(url: string): Promise<Stream[] | null> {
    try {
      const response = await axios.get(url);
      const data = response.data;

      if (data.url) {
        return [
          {
            url: data.url,
            quality: "Primenet - Auto",
            subtitles: [],
            headers: this.headers,
          },
        ];
      }
      return [];
    } catch (e) {
      console.error("Failed to fetch/parse Primenet:", e);
      return null;
    }
  }
}
