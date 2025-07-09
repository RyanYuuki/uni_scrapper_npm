import { Stream, BaseSource, Media } from "../index";
export declare class Xprime extends BaseSource {
    baseUrl: string;
    headers: {
        Referer: string;
        origin: string;
    };
    getDetails(id: string): Promise<Media>;
    getStreams(slug: string): Promise<Stream[]>;
    private fetchXprime;
    private fetchPrimebox;
    private fetchPhoenix;
    private fetchPrimenet;
}
//# sourceMappingURL=xprime.scrapper.d.ts.map