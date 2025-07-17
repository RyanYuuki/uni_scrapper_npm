import SourceHandler, { Source } from "../src/handler/sources.handler";

test("prints baseUrl with done", async () => {
  const xprime = new SourceHandler({
    tmdbKey:
      "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlMmYxZmIxMmNhYTg4MzIyNGE4MzYzZGMwMzI5YjNiYyIsIm5iZiI6MTcyMTIxMTY5NC40NzcsInN1YiI6IjY2OTc5YjJlOGE4ZDI0OTk1MTk4ZDBjMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.BkTreDXNoMQPf8uYufEOuS1xDzGUyqfL9AYJ89FJXBQ",
  });

  const data = await xprime.getStreams(
    JSON.stringify({
      id: "533535",
      imdbId: "tt6263850",
      name: "Deadpool & Wolverine",
      year: 2024,
      season: null,
      episode: null,
    }),
    Source.VIDSRC
  );
  expect(data).toBeDefined();
  console.log(JSON.stringify(data, null, 2));
});
