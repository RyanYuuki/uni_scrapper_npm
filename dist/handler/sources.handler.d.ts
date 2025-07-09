import { Media, Stream, SearchResult, BaseSource } from "../index";
export declare enum Source {
    XPRIME = "xprime"
}
export declare class SourceHandler {
    private sources;
    constructor();
    private initializeSources;
    getAllSources(): BaseSource[];
    getSource(source: Source): BaseSource;
    search(query: string): Promise<SearchResult[]>;
    getDetails(id: string, source?: Source): Promise<Media>;
    getStreams(id: string, source?: Source): Promise<Stream[]>;
}
export default SourceHandler;
//# sourceMappingURL=sources.handler.d.ts.map