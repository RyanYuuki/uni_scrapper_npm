import { AutoEmbedSource, Xprime } from "../src/index";

test("prints baseUrl with done", (done) => {
  const xprime = new AutoEmbedSource();
  xprime
    .getStreams("{\"id\":\"66732\",\"season\":1,\"name\":\"Stranger Things\",\"episode\":1,\"year\":\"2016\"}")
    .then((data) => {
      console.log(JSON.stringify(data, null, 2));
      expect(data).toBeDefined();
      done();
    })
    .catch(done);
});
