// 预渲染出首屏的页面并生成HTML文件

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolve = (p: string) => path.resolve(__dirname, p);

// 资源映射文件
const manifest = JSON.parse(
  fs.readFileSync(resolve("dist/client/ssr-manifest.json"), "utf-8")
);
// 模板文件
const template = fs.readFileSync(resolve("dist/static/index.html"), "utf-8");

(async () => {
  // 预渲染指定路由的首屏页面
  // 这里首屏的路由是 /
  let url = "/";
  // 调用生成模式下的entry-server.js，可以利用这里的逻辑添加preload资源
  const render = (await import("./dist/server/entry-server.js")).render;

  const { renderedHtml, preloadLinks } = await render(url, manifest);

  const html = template
    .replace(`<!--preload-links-->`, preloadLinks)
    .replace(`<!--ssr-outlet-->`, renderedHtml);

  const filePath = `dist/static${url === "/" ? "/index" : url}.html`;
  fs.writeFileSync(resolve(filePath), html);

  // HTML文件生成后，删除无用文件
  fs.unlinkSync(resolve("dist/static/ssr-manifest.json"));
})();
