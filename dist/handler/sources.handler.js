"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceHandler = exports.Source = void 0;
const index_1 = require("../index");
const vidsrc_scrapper_1 = __importDefault(require("../scrappers/vidsrc.scrapper"));
var Source;
(function (Source) {
    Source["XPRIME"] = "xprime";
    Source["AUTOEMBED"] = "autoembed";
    Source["VIDSRC"] = "vidsrc";
})(Source || (exports.Source = Source = {}));
class SourceHandler {
    constructor({ tmdbKey }) {
        this.sources = new Map();
        this.initializeSources();
        this.apiKey = tmdbKey;
    }
    request(url) {
        return index_1.rotatingAxios.get(url, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        });
    }
    initializeSources() {
        this.sources.set(Source.XPRIME, new index_1.Xprime());
        this.sources.set(Source.AUTOEMBED, new index_1.AutoEmbedSource());
        this.sources.set(Source.VIDSRC, new vidsrc_scrapper_1.default(this.apiKey));
    }
    getAllSources() {
        return Array.from(this.sources.values());
    }
    getSource(source) {
        const sourceInstance = this.sources.get(source);
        if (!sourceInstance) {
            throw new Error(`Source ${source} not found`);
        }
        return sourceInstance;
    }
    async search(query) {
        try {
            const cleanedQuery = query.replace(/\bseasons?\b/gi, "").trim();
            const movieUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(cleanedQuery)}&page=1&include_adult=false`;
            const tvUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(cleanedQuery)}&page=1&include_adult=false`;
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
            const movies = (movieRes.data.results || []).map((e) => ({
                id: `https://api.themoviedb.org/3/movie/${e.id}`,
                title: e.title || e.name,
                poster: `https://image.tmdb.org/t/p/w500${e.poster_path || e.backdrop_path || ""}`,
            }));
            const series = (tvRes.data.results || []).map((e) => ({
                id: `https://api.themoviedb.org/3/tv/${e.id}`,
                title: e.title || e.name,
                poster: `https://image.tmdb.org/t/p/w500${e.poster_path || e.backdrop_path || ""}`,
            }));
            const mixedResults = [];
            const maxLength = Math.max(movies.length, series.length);
            for (let i = 0; i < maxLength; i++) {
                if (i < series.length)
                    mixedResults.push(series[i]);
                if (i < movies.length)
                    mixedResults.push(movies[i]);
            }
            return mixedResults;
        }
        catch (error) {
            console.log("Search error:", error);
            throw error;
        }
    }
    async getDetails(id) {
        try {
            const response = await this.request(id);
            const parsedData = response.data;
            const isMovie = id.includes("/movie");
            const name = parsedData.name || parsedData.title;
            const seasons = [];
            let content = null;
            const idMatch = id.match(/(?:movie|tv)\/(\d+)/);
            const tmdbId = idMatch?.[1];
            const imdbId = parsedData.imdb_id;
            if (!tmdbId)
                throw new Error("Invalid TMDB ID in URL");
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
            }
            else {
                const seasonList = parsedData.seasons || [];
                for (const season of seasonList) {
                    if (season.season_number === 0)
                        continue;
                    const currentSeason = {
                        title: `Season ${season.season_number}`,
                        poster: `https://image.tmdb.org/t/p/w500${season.poster_path || season.backdrop_path || ""}`,
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
        }
        catch (error) {
            console.error("getDetails error:", error);
            throw error;
        }
    }
    async getStreams(id, source = Source.AUTOEMBED) {
        const allSources = Object.values(Source);
        const sourcesToTry = [source, ...allSources.filter((s) => s !== source)];
        const errors = [];
        for (const src of sourcesToTry) {
            try {
                const instance = this.getSource(source);
                const streams = await instance.getStreams(id);
                if (streams && streams.length) {
                    return streams;
                }
            }
            catch (err) {
                errors.push({ source: src, error: err });
            }
        }
        throw new Error(`All sources failed:\n` +
            errors
                .map((e) => `- ${e.source}: ${e.error?.message ?? e.error}`)
                .join("\n"));
    }
    async getStreamsFromAllSources(id, except) {
        const sourcesToUse = except
            ? Array.from(this.sources.entries()).filter(([key, _]) => key !== except)
            : Array.from(this.sources.entries());
        const allStreams = await Promise.all(sourcesToUse.map(([_, source]) => source.getStreams(id)));
        return allStreams.flat();
    }
    async getPopular() {
        try {
            const url = "https://api.themoviedb.org/3/trending/all/week?page=1";
            const data = await this.request(url);
            if (data.status !== 200) {
                throw new Error(`Failed to load movie data: ${data.status}`);
            }
            const result = (data.data.results || []).map((e) => {
                const type = e.media_type === "movie" ? "movie" : "tv";
                return {
                    id: `https://api.themoviedb.org/3/${type}/${e.id}`,
                    title: e.title || e.name,
                    poster: `https://image.tmdb.org/t/p/w500${e.poster_path || e.backdrop_path || ""}`,
                };
            });
            return result;
        }
        catch (error) {
            console.log("Search error:", error);
            throw error;
        }
    }
}
exports.SourceHandler = SourceHandler;
exports.default = SourceHandler;
//# sourceMappingURL=sources.handler.js.map