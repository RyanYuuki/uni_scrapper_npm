"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Xprime = void 0;
const index_1 = require("../index");
const index_2 = require("../index");
class Xprime extends index_2.BaseSource {
    constructor() {
        super(...arguments);
        this.baseUrl = "https://xprime.tv";
        this.headers = {
            Referer: this.baseUrl,
            origin: this.baseUrl.slice(0, -1),
        };
    }
    async getStreams(slug) {
        const { id, imdbId, name, year, season, episode } = JSON.parse(slug);
        return await this.fetchXprime(id, imdbId, name, year, season, episode);
    }
    async fetchXprime(id, imdbId, name, year, season, episode) {
        const fallback = [];
        try {
            let url = `https://backend.xprime.tv/primebox?name=${encodeURIComponent(name)}&fallback_year=${year}&id=${id}&imdb=${imdbId}`;
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
            const streams = [];
            for (const result of futures) {
                if (result.status === "fulfilled" && result.value) {
                    streams.push(...result.value);
                }
            }
            return streams;
        }
        catch (error) {
            console.error("fetchXprime error:", error);
            return fallback;
        }
    }
    async fetchPrimebox(url) {
        try {
            const response = await index_1.rotatingAxios.get(url);
            const data = response.data;
            const streams = data.streams || {};
            const result = [];
            Object.entries(streams).forEach(([quality, streamUrl]) => {
                const subtitles = [];
                if (data.subtitles) {
                    for (const sub of data.subtitles) {
                        subtitles.push({
                            label: sub.label || "",
                            file: sub.file || "",
                        });
                    }
                }
                result.push({
                    url: streamUrl,
                    quality: `Primebox - ${quality}`,
                    subtitles,
                    headers: this.headers,
                });
            });
            return result;
        }
        catch (e) {
            console.error("Failed to fetch/parse Primebox:", e);
            return null;
        }
    }
    async fetchPhoenix(url) {
        try {
            const response = await index_1.rotatingAxios.get(url);
            const data = response.data;
            if (data.url) {
                const subtitles = [];
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
        }
        catch (e) {
            console.error("Failed to fetch/parse Phoenix:", e);
            return null;
        }
    }
    async fetchPrimenet(url) {
        try {
            const response = await index_1.rotatingAxios.get(url);
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
        }
        catch (e) {
            console.error("Failed to fetch/parse Primenet:", e);
            return null;
        }
    }
}
exports.Xprime = Xprime;
//# sourceMappingURL=xprime.scrapper.js.map