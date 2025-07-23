import { MovieApiSource } from "../src/scrappers/movieapi.scrapper"; // Adjust path if needed

test("prints m3u8 stream from MovieApiSource", (done) => {
  const movieApi = new MovieApiSource();

   const testSlug = JSON.stringify({
    id: "66732",
    season: 1,
    episode: 1,
    name: "Stranger Things",
    year: "2016",
  });

  movieApi
    .getStreams(testSlug)
    .then((data) => {
      console.log(JSON.stringify(data, null, 2));
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].url).toMatch(/\.m3u8/);
      done();
    })
    .catch((err) => {
      console.error("Stream fetch failed:", err);
      done(err);
    });
});
