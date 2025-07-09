export type Stream = {
  url: string;
  quality: string;
  subtitles?: Subtitle[];
};

export interface Subtitle {
  label: string;
  file: string;
}
