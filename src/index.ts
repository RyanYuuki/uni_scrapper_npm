<<<<<<< HEAD
import axios, { AxiosInstance } from "axios";
=======
import axios from "axios";
>>>>>>> 258ebfb70922c4c25eb151310df4e7e0fb0dc866

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

const rotatingAxios: Axios.AxiosInstance = axios.create({
  timeout: 30000,
  //   maxRedirects: 5,
  ...("maxRedirects" in axios.defaults && { maxRedirects: 5 }),
});

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
