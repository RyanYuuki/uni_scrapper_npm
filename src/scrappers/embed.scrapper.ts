import rotatingAxios, { BaseSource, Media, Stream } from "../index";

export class AutoEmbedSource extends BaseSource {
  baseUrl = "https://oc.autoembed.cc";
  headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  async getDetails(id: string): Promise<Media> {
    try {
      const response = await rotatingAxios.get(id);
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
    const { id, season, episode } = JSON.parse(slug);
    const type = season && episode ? "tv" : "movie";
    var url = `${this.baseUrl}/${type}/${id}`;

    if (type === "tv") {
      url += `/${season}/${episode}`;
    }

    const [engResponse, hindiResponse] = await Promise.all([
      rotatingAxios.get(url),
      rotatingAxios.get(`${url}?lang=Hindi`),
    ]);

    const parseResponse = (response: any, langLabel: string): Stream[] => {
      try {
        const data = response.data;

        if (data?.streams) {
          return data.streams.map((stream: any) => ({
            url: stream.stream_url,
            quality: stream.quality,
            subtitles: [],
          }));
        }

        if (data?.data?.downloads) {
          return data.data.downloads.map((stream: any) => ({
            url: stream.url,
            quality: `${langLabel} - ${stream.resolution}`,
            subtitles: (data.data.captions || []).map((sub: any) => ({
              file: sub.url,
              label: sub.lanName,
            })),
          }));
        }

        return [];
      } catch (err) {
        console.warn(`Failed to parse ${langLabel} response:`, err);
        console.warn("Response body:", JSON.stringify(response.data, null, 2));
        console.warn("Params used => ", url);
        return [];
      }
    };

    const engResults = parseResponse(engResponse, "English");
    const hindiResults = parseResponse(hindiResponse, "Hindi");

    const areSame = JSON.stringify(engResults) === JSON.stringify(hindiResults);
    return areSame ? engResults : [...engResults, ...hindiResults];
  }
}
