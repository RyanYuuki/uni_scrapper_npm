import { BaseSource } from "../types/base.source";
import { Stream } from "../types/stream";

export class MovieApiSource extends BaseSource {
  baseUrl = "https://moviesapi.club";
  headers = {
    Referrer: `${this.baseUrl}/`,
    Origin: this.baseUrl,
  };
  async getStreams(slug: string): Promise<Stream[]> {

  }
}
