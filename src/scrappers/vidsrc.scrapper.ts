import axios from "axios";
import { BaseSource, Stream } from "../index";
import * as cheerio from "cheerio";

class VidSrcSource extends BaseSource {
  baseUrl = "https://himer365ery.com/play";
  headers = {
    Referer: "https://himer365ery.com/",
    origin: "https://himer365ery.com",
  };
  private tmdbApiKey: string;

  constructor(key: string) {
    super();
    this.tmdbApiKey = key;
  }

  async getImdbId(
    tmdbId: string,
    imdbId?: string,
    season?: string,
    episode?: string
  ): Promise<string> {
    if (imdbId) {
      return imdbId;
    }

    try {
      const type = season && episode ? "tv" : "movie";
      const resp = await axios.get(
        `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids`,
        {
          headers: {
            Authorization: `Bearer ${this.tmdbApiKey}`,
          },
        }
      );
      return resp.data.imdb_id;
    } catch (error) {
      console.error("Error getting IMDB ID:", error);
      throw error;
    }
  }

  extractFileUrl(htmlContent: string): string | null {
    const fileUrlRegex = /"file":"([^"]+)"/;
    const fileUrlMatch = htmlContent.match(fileUrlRegex);
    return fileUrlMatch ? fileUrlMatch[1].replace(/\\\//g, "/") : null;
  }

  extractKey(htmlContent: string): string | null {
    const keyRegex = /"key":"([^"]+)"/;
    const keyMatch = htmlContent.match(keyRegex);
    return keyMatch ? keyMatch[1] : null;
  }

  async getStreams(slug: string): Promise<Stream[]> {
    const { id: tmdbId, imdbId, season, episode } = JSON.parse(slug);
    let streams: Stream[] = [];

    try {
      const id = await this.getImdbId(tmdbId, imdbId, season, episode);

      const url = `${this.baseUrl}/${id}`;
      const response = await axios.get(url, {
        headers: this.headers,
      });
      const htmlContent = response.data;

      const fileUrl = this.extractFileUrl(htmlContent);
      const key = this.extractKey(htmlContent);

      if (fileUrl) {
        try {
          const decodedFileUrl = decodeURIComponent(fileUrl);
          const playerResp = await axios.get(decodedFileUrl, {
            headers: {
              ...this.headers,
              "X-CSRF-TOKEN": key,
            },
          });

          let promises: Promise<Stream | null>[] = [];

          for (const source of playerResp.data) {
            const index = playerResp.data.indexOf(source);

            if (index == 0) continue;

            const cleanedUrl =
              "https://jarvi366dow.com/playlist/" +
              source.file.replaceAll("~", "") +
              ".txt";

            promises.push(
              axios
                .get(cleanedUrl, {
                  headers: {
                    ...this.headers,
                    "X-CSRF-TOKEN": key,
                  },
                })
                .then((result) => {
                  console.log("Result => ", result.data);
                  const url = result.data;

                  return {
                    url,
                    quality: source.title,
                    subtitles: [],
                    headers: this.headers,
                  } as Stream;
                })
                .catch((error) => {
                  console.error(
                    `Error fetching stream from ${cleanedUrl}:`,
                    error.message
                  );
                  return null;
                })
            );
          }

          const results = await Promise.all(promises);
          streams = results.filter((stream) => stream !== null) as Stream[];
        } catch (error) {
          console.error("Error processing player response:", error);
        }
      }
    } catch (error) {
      console.error("Error in getStreams:", error);
    }

    return streams;
  }
}

export default VidSrcSource;
