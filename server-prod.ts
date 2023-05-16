import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

// @ts-ignore
import { render } from "./dist/server/entry-server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  const resolve = (p: string) => path.resolve(__dirname, p);
  // 模块使用打包好的
  const template = fs.readFileSync(
    resolve("./dist/client/index.html"),
    "utf-8"
  );

  // 请求静态资源
  app.use(
    "/assets",
    express.static(resolve("./dist/client/assets"), {
      maxAge: "1000h", // 设置缓存时间
    })
  );
  // 由于浏览器页签图片读取了public下的文件，需要单独设置
  app.use(
    "/vite.svg",
    express.static(resolve("./dist/client/vite.svg"), {
      maxAge: "1000h", // 设置缓存时间
    })
  );
  app.use("*", async (req, res) => {
    const url = req.originalUrl;
    try {
      const manifest = JSON.parse(
        fs.readFileSync(resolve("dist/client/ssr-manifest.json"), "utf-8")
      );
      const { renderedHtml, preloadLinks } = await render(url, manifest);

      // 5. 注入渲染后的应用程序HTML 到模板中
      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--ssr-outlet-->`, renderedHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      console.info((e as Error).stack);
      res.status(500).end((e as Error).stack);
    }
  });

  app.listen(8901);
  console.info("Server is start port at 8901");
}

createServer();
