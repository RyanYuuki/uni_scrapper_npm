import rotatingAxios, { BaseSource, Media, Stream } from "../index";

export class AutoEmbedSource extends BaseSource {
  baseUrl = "https://oc.autoembed.cc";
  headers = {
    Referer: "https://moviebox.ng/",
    origin: "https://moviebox.ng",
  };

  async getStreams(slug: string): Promise<Stream[]> {
    const { id, season, episode } = JSON.parse(slug);
    const type = season && episode ? "tv" : "movie";
    var url = `${this.baseUrl}/${type}/${id}`;

    if (type === "tv") {
      url += `/${season}/${episode}`;
    }

    const [engResponse, hindiResponse] = await Promise.all([
      rotatingAxios.get(url),
      rotatingAxios.get(`${url}?lang=Hindi`),
    ]);

    const parseResponse = (response: any, langLabel: string): Stream[] => {
      try {
        const data = response.data;

        if (data?.streams) {
          return data.streams.map((stream: any) => ({
            url: stream.stream_url,
            quality: stream.quality,
            subtitles: [],
            headers: this.headers,
          }));
        }

        if (data?.data?.downloads) {
          return data.data.downloads.map((stream: any) => ({
            url: stream.url,
            headers: this.headers,
            quality: `${langLabel} - ${stream.resolution}`,
            subtitles: (data.data.captions || []).map((sub: any) => ({
              file: sub.url,
              label: sub.lanName,
            })),
          }));
        }

        return [];
      } catch (err) {
        console.warn(`Failed to parse ${langLabel} response:`, err);
        console.warn("Response body:", JSON.stringify(response.data, null, 2));
        console.warn("Params used => ", url);
        return [];
      }
    };

    const engResults = parseResponse(engResponse, "English");
    const hindiResults = parseResponse(hindiResponse, "Hindi");

    const areSame = JSON.stringify(engResults) === JSON.stringify(hindiResults);
    return areSame ? engResults : [...engResults, ...hindiResults];
  }
}
