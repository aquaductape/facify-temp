import { NextApiHandler } from "next";

import http from "https";
import { getBufferSize } from "../../utils/getBase64FromUrl";

const handler: NextApiHandler = async (req, res) => {
  const getData = () =>
    new Promise<{ base64: string; sizeMB: number } | { error: any }>(
      (resolve) => {
        http
          .get(req.body.url, (resp) => {
            resp.setEncoding("base64");
            let body = "data:" + resp.headers["content-type"] + ";base64,";
            resp.on("data", (data) => {
              body += data;
            });
            resp.on("end", () => {
              const sizeMB = getBufferSize(body);
              resolve({ base64: body, sizeMB, error: null });
            });
          })
          .on("error", (err) => {
            resolve({ error: err.message });
          });
      }
    );

  try {
    const result = await getData();

    return res.json(result);
  } catch (err) {
    return res.json({ error: err.code });
  }
};

export default handler;
