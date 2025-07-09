# UniScrapper

**UniScrapper** is a modular, scalable scraper framework and backend API built with TypeScript. It allows scraping metadata, search results, and streaming links for movies and TV shows from various content sources — usable as a standalone API server or an NPM package.

> **Note:** Currently supports the source: `XPrime`. More sources will be added soon.

---

## 🚀 Features

- 🔍 Unified media search & metadata fetch
- 🎞️ Streaming link extraction from public sources
- 🧩 Modular source architecture for easy expansion
- ⚡ In-memory caching with `node-cache`
- 📦 Can be used as both an HTTP API and an NPM module
- 🔧 Built with TypeScript

---

## 📦 NPM Package Usage

### 📥 Installation

```bash
npm install uni_scrapper
````

### 📘 Example Usage

```ts
import UniScrapper from "uni_scrapper";

const scrapper = new UniScrapper();

(async () => {
  const results = await scrapper.search("Attack on Titan");

  const details = await scrapper.getDetails(results[0].id);

  const episodeId = details.seasons[0].episodes[0].id;

  const streams = await scrapper.getStreams(episodeId);

  console.log(streams);
})();
```

### ✅ Available Methods

| Method                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `search(query: string)` | Search movies/TV using TMDB                        |
| `getDetails(id)`        | Get metadata for a selected media item             |
| `getStreams(episodeId)` | Get streaming links for an episode (requires `id`) |

> ℹ️ For shows, use:
> `details.seasons[0].episodes[0].id`
> to fetch a valid episode ID to pass into `getStreams`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).