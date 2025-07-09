"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceHandler = exports.Source = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
var Source;
(function (Source) {
    Source["XPRIME"] = "xprime";
})(Source || (exports.Source = Source = {}));
class SourceHandler {
    constructor() {
        this.sources = new Map();
        this.initializeSources();
    }
    initializeSources() {
        this.sources.set(Source.XPRIME, new index_1.Xprime());
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
            const movieUrl = `https://tmdb.hexa.watch/api/tmdb/search/movie?query=${encodeURIComponent(cleanedQuery)}&page=1&include_adult=false`;
            const tvUrl = `https://tmdb.hexa.watch/api/tmdb/search/tv?query=${encodeURIComponent(cleanedQuery)}&page=1&include_adult=false`;
            const [movieRes, tvRes] = await Promise.all([
                axios_1.default.get(movieUrl),
                axios_1.default.get(tvUrl),
            ]);
            if (movieRes.status !== 200) {
                throw new Error(`Failed to load movie data: ${movieRes.status}`);
            }
            if (tvRes.status !== 200) {
                throw new Error(`Failed to load TV data: ${tvRes.status}`);
            }
            const movies = (movieRes.data.results || []).map((e) => ({
                id: `https://tmdb.hexa.watch/api/tmdb/movie/${e.id}`,
                title: e.title || e.name,
                poster: `https://image.tmdb.org/t/p/w500${e.poster_path || e.backdrop_path || ""}`,
            }));
            const series = (tvRes.data.results || []).map((e) => ({
                id: `https://tmdb.hexa.watch/api/tmdb/tv/${e.id}`,
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
    async getDetails(id, source = Source.XPRIME) {
        const sourceInstance = this.getSource(source);
        return await sourceInstance.getDetails(id);
    }
    async getStreams(id, source = Source.XPRIME) {
        const sourceInstance = this.getSource(source);
        return await sourceInstance.getStreams(id);
    }
}
exports.SourceHandler = SourceHandler;
exports.default = SourceHandler;
//# sourceMappingURL=sources.handler.js.map