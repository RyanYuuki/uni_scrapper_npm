import axios from "axios";
import {
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

  async getDetails(id: string, source: Source = Source.XPRIME): Promise<Media> {
    const sourceInstance = this.getSource(source);
    return await sourceInstance.getDetails(id);
  }

  async getStreams(
    id: string,
    source: Source = Source.XPRIME
  ): Promise<Stream[]> {
    const sourceInstance = this.getSource(source);
    return await sourceInstance.getStreams(id);
  }
}

export default SourceHandler;
