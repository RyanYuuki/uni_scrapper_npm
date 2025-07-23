import * as axios from "axios";
import { BaseSource } from "../types/base.source";
import { Stream } from "../types/stream";

/**
 * by default we are going to export only cloudstream
 */

/**
 *
 * goals
 * 1. extract html - done
 * 2. get server hash- done
 * 3. put that hash on serve base url - done
 * 4. from tha hashed link - done
 * 5 now modify the response same as ryan
 *
 * **/

export class MovieApiSource extends BaseSource {
  baseUrl = "https://cdn.moviesapi.club";
  serverBaseUrl = "https://cloudnestra.com";
  headers = {
    Referrer: `${this.baseUrl}/`,
    Origin: this.baseUrl,
  };
  async getStreams(slug: string): Promise<Stream[]> {
    console.time("stream");
    const { id, season, episode } = JSON.parse(slug);
    const type = season && episode ? "tv" : "movie";
    let url = `${this.baseUrl}/embed/${type}/${id}`;

    if (type === "tv") {
      url += `/${season}/${episode}`;
    }

    try {
      const data = await axios.get(url, {
        headers: this.headers,
      });

      const html = data.data as string;

      const serverMatches = html.match(/<iframe[^>]+src="([^"]+)"/);
      let iframeSrc = null;
      if (serverMatches && serverMatches[1]) {
        iframeSrc = "https:" + serverMatches[1];
      }

      const cloudstream = await axios.get(iframeSrc, {
        headers: {
          Referer: `${this.serverBaseUrl}`,
          Origin: this.serverBaseUrl,
        },
      });

      const serverHtml = cloudstream.data as string;
      const match = serverHtml.match(/src:\s*['"]([^'"]+)['"]/)[1];
      if (!match) throw new Error("server stream not found");

      const finalUrl = this.serverBaseUrl + match;
      const againCall = await axios.get(finalUrl, {
        headers: {
          Referer: `${this.serverBaseUrl}/`,
          Origin: `${this.serverBaseUrl}`,
        },
      });
      let m3u8Html = againCall.data as string;
      const m3u8Match = m3u8Html.match(/file\s*:\s*['"]([^'"]+?\.m3u8)['"]/);
      if (!m3u8Match && !m3u8Match[1]) throw new Error("m3u8 link not found");

      const m3u8URL = m3u8Match[1];

      console.timeEnd("stream");
      const streams: Stream[] = [
        {
          url: m3u8URL,
          quality: "auto",
          subtitles: [],
          headers: {
            Referer: `${this.serverBaseUrl}/`,
            Origin: `${this.serverBaseUrl}`,
          },
        },
      ];
      return streams;
    } catch (error) {
      console.log(error);
    }
  }
}
