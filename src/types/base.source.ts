import { Media, Stream } from "../index";

export abstract class BaseSource {
  abstract baseUrl: string;
  abstract headers: {};
  abstract getStreams(slug: string): Promise<Stream[]>;
}
