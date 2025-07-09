export interface ServerConfig {
    id: Number,
    urlPattern: string,
    baseUrl: string,
    type: ServerType
}

export enum ServerType {
    xprime,
    embed,
}