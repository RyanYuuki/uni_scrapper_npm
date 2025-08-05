import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { headerConfigs } from "./utils/headers";
export * from "./types/stream";
export * from "./types/media";
export * from "./types/base.source";
export * from "./scrappers/xprime.scrapper";
export * from "./scrappers/embed.scrapper";
export * from "./types/media";
export {
  SourceHandler as UniScrapper,
  Source,
} from "./handler/sources.handler";

function getRandomHeaders() {
  const randomIndex = Math.floor(Math.random() * headerConfigs.length);
  return headerConfigs[randomIndex];
}

const proxyUrl = process.env.PROXY_URL;

const axiosConfig: AxiosRequestConfig = {
  timeout: 30000,
  maxRedirects: 5,
};

if (proxyUrl) {
  const proxy = new URL(proxyUrl);
  axiosConfig.proxy = {
    host: proxy.hostname,
    port: Number(proxy.port),
    auth: {
      username: proxy.username,
      password: proxy.password,
    },
    protocol: proxy.protocol.replace(":", ""),
  };
}

const rotatingAxios: AxiosInstance = axios.create(axiosConfig);

rotatingAxios.interceptors.request.use(
  (config: any) => {
    const randomHeaders = getRandomHeaders();

    config.headers = {
      ...config.headers,
      ...randomHeaders,
    };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default rotatingAxios;
export { rotatingAxios };
