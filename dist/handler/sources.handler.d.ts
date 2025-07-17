import { Media, Stream, SearchResult, BaseSource } from "../index";
export declare enum Source {
    XPRIME = "xprime",
    AUTOEMBED = "autoembed",
    VIDSRC = "vidsrc"
}
export declare class SourceHandler {
    private sources;
    private apiKey;
    constructor({ tmdbKey }: {
        tmdbKey: string;
    });
    private request;
    private initializeSources;
    getAllSources(): BaseSource[];
    getSource(source: Source): BaseSource;
    search(query: string): Promise<SearchResult[]>;
    getDetails(id: string): Promise<Media>;
    getStreams(id: string, source?: Source): Promise<Stream[]>;
    getStreamsFromAllSources(id: string, except?: Source): Promise<Stream[]>;
    getPopular(): Promise<SearchResult[]>;
}
export default SourceHandler;
//# sourceMappingURL=sources.handler.d.ts.map