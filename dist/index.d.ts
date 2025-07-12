import { AxiosInstance } from "axios";
export * from "./types/stream";
export * from "./types/media";
export * from "./types/base.source";
export * from "./scrappers/xprime.scrapper";
export * from "./scrappers/embed.scrapper";
export * from "./types/media";
export { SourceHandler as UniScrapper, Source, } from "./handler/sources.handler";
declare const rotatingAxios: AxiosInstance;
export default rotatingAxios;
export { rotatingAxios };
//# sourceMappingURL=index.d.ts.map