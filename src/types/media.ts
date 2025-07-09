type MediaType = "movie" | "tv";

export interface Content {
  id: string;
  title: string;
}

export interface Season {
  title: string;
  poster: string;
  episodes: Content[];
}

export interface Media {
  id: string;
  title: string;
  poster: string;
  seasons?: Season[];
  content?: Content;
  type: MediaType;
}

export interface SearchResult {
  id: string;
  title: string;
  poster: string;
}
