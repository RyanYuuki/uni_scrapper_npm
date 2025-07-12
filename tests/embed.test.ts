import { AutoEmbedSource, Xprime } from "../src/index";

test("prints baseUrl with done", (done) => {
  const xprime = new AutoEmbedSource();
  xprime
    .getStreams("https://tmdb.hexa.watch/api/tmdb/movie/597")
    .then((data) => {
      console.log(JSON.stringify(data, null, 2));
      expect(data).toBeDefined();
      done();
    })
    .catch(done);
});
