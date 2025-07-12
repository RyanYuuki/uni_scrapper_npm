"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotatingAxios = exports.Source = exports.UniScrapper = void 0;
const axios_1 = __importDefault(require("axios"));
const headers_1 = require("./utils/headers");
__exportStar(require("./types/stream"), exports);
__exportStar(require("./types/media"), exports);
__exportStar(require("./types/base.source"), exports);
__exportStar(require("./scrappers/xprime.scrapper"), exports);
__exportStar(require("./scrappers/embed.scrapper"), exports);
__exportStar(require("./types/media"), exports);
var sources_handler_1 = require("./handler/sources.handler");
Object.defineProperty(exports, "UniScrapper", { enumerable: true, get: function () { return sources_handler_1.SourceHandler; } });
Object.defineProperty(exports, "Source", { enumerable: true, get: function () { return sources_handler_1.Source; } });
function getRandomHeaders() {
    const randomIndex = Math.floor(Math.random() * headers_1.headerConfigs.length);
    return headers_1.headerConfigs[randomIndex];
}
const rotatingAxios = axios_1.default.create({
    timeout: 30000,
    maxRedirects: 5,
});
exports.rotatingAxios = rotatingAxios;
rotatingAxios.interceptors.request.use((config) => {
    const randomHeaders = getRandomHeaders();
    config.headers = {
        ...config.headers,
        ...randomHeaders,
    };
    return config;
}, (error) => {
    return Promise.reject(error);
});
exports.default = rotatingAxios;
//# sourceMappingURL=index.js.map