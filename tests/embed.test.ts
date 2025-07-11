import { AutoEmbedSource, Xprime } from "../src/index";

test("prints baseUrl with done", (done) => {
  const xprime = new AutoEmbedSource();
  xprime
    .getDetails("https://tmdb.hexa.watch/api/tmdb/movie/597")
    .then((data) => {
      console.log(JSON.stringify(data, null, 2));

      const id = data.seasons![0].episodes[0].id;

      xprime.getStreams(id).then((streams) => {
        console.log(JSON.stringify(streams, null, 2));
      });

      expect(data).toBeDefined();
      done();
    })
    .catch(done);
});
