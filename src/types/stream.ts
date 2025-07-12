export type Stream = {
  url: string;
  quality: string;
  subtitles?: Subtitle[];
  headers: {};
};

export interface Subtitle {
  label: string;
  file: string;
}
