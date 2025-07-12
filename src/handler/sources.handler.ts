import {
  rotatingAxios as axios,
  Media,
  Stream,
  SearchResult,
  BaseSource,
  Xprime,
  AutoEmbedSource,
} from "../index";

export enum Source {
  XPRIME = "xprime",
  AUTOEMBED = "autoembed",
}

export class SourceHandler {
  private sources: Map<Source, BaseSource> = new Map();

  constructor() {
    this.initializeSources();
  }

  private initializeSources(): void {
    this.sources.set(Source.XPRIME, new Xprime());
    this.sources.set(Source.AUTOEMBED, new AutoEmbedSource());
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

      const movieUrl = `https://tmdb.hexa.watch/api/tmdb/search/movie?query=${encodeURIComponent(
        cleanedQuery
      )}&page=1&include_adult=false`;
      const tvUrl = `https://tmdb.hexa.watch/api/tmdb/search/tv?query=${encodeURIComponent(
        cleanedQuery
      )}&page=1&include_adult=false`;

      const [movieRes, tvRes] = await Promise.all([
        axios.get(movieUrl),
        axios.get(tvUrl),
      ]);

      if (movieRes.status !== 200) {
        throw new Error(`Failed to load movie data: ${movieRes.status}`);
      }
      if (tvRes.status !== 200) {
        throw new Error(`Failed to load TV data: ${tvRes.status}`);
      }

      const movies: SearchResult[] = (movieRes.data.results || []).map(
        (e: any) => ({
          id: `https://tmdb.hexa.watch/api/tmdb/movie/${e.id}`,
          title: e.title || e.name,
          poster: `https://image.tmdb.org/t/p/w500${
            e.poster_path || e.backdrop_path || ""
          }`,
        })
      );

      const series: SearchResult[] = (tvRes.data.results || []).map(
        (e: any) => ({
          id: `https://tmdb.hexa.watch/api/tmdb/tv/${e.id}`,
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

  async getStreams(
    id: string,
    source: Source = Source.AUTOEMBED
  ): Promise<Stream[]> {
    const sourceInstance = this.getSource(source);
    return await sourceInstance.getStreams(id);
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
}

export default SourceHandler;
