import SourceHandler, { Source } from "../src/handler/sources.handler";

test("prints baseUrl with done", async () => {
  const source = new SourceHandler({
    tmdbKey:
      "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlMmYxZmIxMmNhYTg4MzIyNGE4MzYzZGMwMzI5YjNiYyIsIm5iZiI6MTcyMTIxMTY5NC40NzcsInN1YiI6IjY2OTc5YjJlOGE4ZDI0OTk1MTk4ZDBjMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.BkTreDXNoMQPf8uYufEOuS1xDzGUyqfL9AYJ89FJXBQ",
  });

  const data = await source.search("Stranger Things");
  const details = await source.getDetails(data[0].id);
  const streams = await source.getStreams(
    details.seasons![0].episodes[0].id,
    Source.VIDSRC
  );
  expect(data).toBeDefined();
  expect(details).toBeDefined();
  expect(streams).toBeDefined();
  console.log(JSON.stringify(streams, null, 2));
});
