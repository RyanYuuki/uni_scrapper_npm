import {
  rotatingAxios as axios,
  Media,
  Stream,
  SearchResult,
  BaseSource,
  Xprime,
  AutoEmbedSource,
} from "../index";
import VidSrcSource from "../scrappers/vidsrc.scrapper";

export enum Source {
  XPRIME = "xprime",
  AUTOEMBED = "autoembed",
  VIDSRC = "vidsrc",
}

export class SourceHandler {
  private sources: Map<Source, BaseSource> = new Map();
  private apiKey: string;

  constructor({ tmdbKey }: { tmdbKey: string }) {
    this.initializeSources();
    this.apiKey = tmdbKey;
  }

  private request(url: string): Promise<any> {
    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  private initializeSources(): void {
    this.sources.set(Source.XPRIME, new Xprime());
    this.sources.set(Source.AUTOEMBED, new AutoEmbedSource());
    this.sources.set(Source.VIDSRC, new VidSrcSource());
  }

  getAllSources(): BaseSource[] {
    return Array.from(this.sources.values());
  }

  getSource(source: Source): BaseSource {
    const sourceInstance = this.sources.get(source);
    if (!sourceInstance) {
      throw new Error(`Source ${source} not found`);
    }
    return sourceInstance;
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      const cleanedQuery = query.replace(/\bseasons?\b/gi, "").trim();

      const movieUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
        cleanedQuery
      )}&page=1&include_adult=false`;
      const tvUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(
        cleanedQuery
      )}&page=1&include_adult=false`;

      const [movieRes, tvRes] = await Promise.all([
        this.request(movieUrl),
        this.request(tvUrl),
      ]);

      if (movieRes.status !== 200) {
        throw new Error(`Failed to load movie data: ${movieRes.status}`);
      }
      if (tvRes.status !== 200) {
        throw new Error(`Failed to load TV data: ${tvRes.status}`);
      }

      const movies: SearchResult[] = (movieRes.data.results || []).map(
        (e: any) => ({
          id: `https://api.themoviedb.org/3/movie/${e.id}`,
          title: e.title || e.name,
          poster: `https://image.tmdb.org/t/p/w500${
            e.poster_path || e.backdrop_path || ""
          }`,
        })
      );

      const series: SearchResult[] = (tvRes.data.results || []).map(
        (e: any) => ({
          id: `https://api.themoviedb.org/3/tv/${e.id}`,
          title: e.title || e.name,
          poster: `https://image.tmdb.org/t/p/w500${
            e.poster_path || e.backdrop_path || ""
          }`,
        })
      );

      const mixedResults: SearchResult[] = [];
      const maxLength = Math.max(movies.length, series.length);

      for (let i = 0; i < maxLength; i++) {
        if (i < series.length) mixedResults.push(series[i]);
        if (i < movies.length) mixedResults.push(movies[i]);
      }

      return mixedResults;
    } catch (error) {
      console.log("Search error:", error);
      throw error;
    }
  }

  async getDetails(id: string): Promise<Media> {
    try {
      const response = await this.request(id);
      const parsedData = response.data;
      const isMovie = id.includes("/movie");

      const name = parsedData.name || parsedData.title;
      const seasons = [];
      let content = null;

      const idMatch = id.match(/(?:movie|tv)\/(\d+)/);
      const tmdbId = idMatch?.[1];
      let imdbId = parsedData.imdb_id;

      if (!imdbId) {
        try {
          const type = !isMovie ? "tv" : "movie";
          const resp = await axios.get(
            `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids`,
            {
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
              },
            }
          );
          imdbId = resp.data.imdb_id;
        } catch (error) {
          console.error("Error getting IMDB ID:", error);
          throw error;
        }
      }

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

  async getStreams(
    id: string,
    source: Source = Source.VIDSRC
  ): Promise<Stream[]> {
    const allSources = Object.values(Source);
    const sourcesToTry = [source, ...allSources.filter((s) => s !== source)];

    const errors: any[] = [];

    for (const src of sourcesToTry) {
      try {
        const instance = this.getSource(source as Source);
        const streams = await instance.getStreams(id);
        if (streams && streams.length) {
          console.log(errors);
          return streams;
        }
      } catch (err) {
        errors.push({ source: src, error: err });
      }
    }

    throw new Error(
      `All sources failed:\n` +
        errors
          .map((e) => `- ${e.source}: ${e.error?.message ?? e.error}`)
          .join("\n")
    );
  }

  async getStreamsFromAllSources(
    id: string,
    except?: Source
  ): Promise<Stream[]> {
    const sourcesToUse = except
      ? Array.from(this.sources.entries()).filter(([key, _]) => key !== except)
      : Array.from(this.sources.entries());

    const allStreams = await Promise.all(
      sourcesToUse.map(([_, source]) => source.getStreams(id))
    );

    return allStreams.flat();
  }

  async getPopular() {
    try {
      const url = "https://api.themoviedb.org/3/trending/all/week?page=1";

      const data = await this.request(url);

      if (data.status !== 200) {
        throw new Error(`Failed to load movie data: ${data.status}`);
      }

      const result: SearchResult[] = (data.data.results || []).map((e: any) => {
        const type = e.media_type === "movie" ? "movie" : "tv";
        return {
          id: `https://api.themoviedb.org/3/${type}/${e.id}`,
          title: e.title || e.name,
          poster: `https://image.tmdb.org/t/p/w500${
            e.poster_path || e.backdrop_path || ""
          }`,
        };
      });

      return result;
    } catch (error) {
      console.log("Search error:", error);
      throw error;
    }
  }
}

export default SourceHandler;
