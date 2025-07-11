import { rotatingAxios as axios } from "../index";
import { Stream, BaseSource, Subtitle, Media } from "../index";

export class Xprime extends BaseSource {
  baseUrl = "https://xprime.tv";

  headers = {
    Referer: this.baseUrl,
    origin: this.baseUrl.slice(0, -1),
  };

  async getDetails(id: string): Promise<Media> {
    try {
      const response = await axios.get(id);
      console.log(id);
      const parsedData = response.data;
      const isMovie = id.includes("movie");

      const name = parsedData.name || parsedData.title;
      const seasons = [];
      let content = null;

      const idMatch = id.match(/(?:movie|tv)\/(\d+)/);
      const tmdbId = idMatch?.[1];
      const imdbId = parsedData.imdb_id;

      if (!tmdbId) throw new Error("Invalid TMDB ID in URL");

      if (isMovie) {
        const releaseDate = parsedData.release_date || "";
        const year = releaseDate ? releaseDate.split("-")[0] : "";
        content = {
          title: "Movie",
          id: JSON.stringify({
            id: tmdbId,
            imdbId,
            year,
            name,
          }),
        };
      } else {
        const seasonList = parsedData.seasons || [];

        for (const season of seasonList) {
          if (season.season_number === 0) continue;

          const currentSeason = {
            title: `Season ${season.season_number}`,
            poster: `https://image.tmdb.org/t/p/w500${
              season.poster_path || season.backdrop_path || ""
            }`,
            episodes: [],
          };

          const episodeCount = season.episode_count || 0;
          const airDate = season.air_date || "";
          const year = airDate ? airDate.split("-")[0] : "";

          for (let ep = 1; ep <= episodeCount; ep++) {
            currentSeason.episodes.push({
              title: `Episode ${ep}`,
              id: JSON.stringify({
                id: tmdbId,
                imdbId,
                season: season.season_number,
                name,
                episode: ep,
                year,
              }),
            });
          }

          seasons.push(currentSeason);
        }
      }

      if (isMovie) {
        return {
          id: id,
          title: name,
          poster: `https://image.tmdb.org/t/p/w500${parsedData.poster_path}`,
          type: "movie",
          seasons: [
            {
              title: "Movie",
              poster: "",
              episodes: [content],
            },
          ],
        };
      }

      return {
        id: id,
        title: name,
        poster: `https://image.tmdb.org/t/p/w500${parsedData.poster_path}`,
        seasons: seasons,
        type: "tv",
      };
    } catch (error) {
      console.error("getDetails error:", error);
      throw error;
    }
  }

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
      )}&fallback_year=${year}&id=${id}&imdb=${imdbId}`;

      if (season != null && episode != null) {
        url += `&season=${season}&episode=${episode}`;
      }

      const primeboxUrl = url;
      const phoenixUrl = url.replaceAll("primebox", "phoenix");
      const primenetUrl = url.replaceAll("primebox", "primenet");

      console.log("Calling Primebox URL:", primeboxUrl);
      console.log("Calling Phoenix URL:", phoenixUrl);
      console.log("Calling Primenet URL:", primenetUrl);

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
