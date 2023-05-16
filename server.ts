import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

import { createServer as createViteServer } from "vite";

const isProd = process.env.NODE_ENV === "production";
// 在ts文件中不能直接使用__dirname，所以需要使用这种方法
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolve = (p: string) => path.resolve(__dirname, p);

const manifest = isProd
  ? JSON.parse(
      fs.readFileSync(resolve("dist/client/ssr-manifest.json"), "utf-8")
    )
  : {};

const prodIndex = isProd
  ? fs.readFileSync(resolve("./dist/client/index.html"), "utf-8")
  : "";

async function createServer() {
  const app = express();
  let vite: any;

  if (isProd) {
    // 请求静态资源
    // app.use(
    //   "/assets",
    //   express.static(resolve("./dist/client/assets"), {
    //     maxAge: "1000h", // 设置缓存时间
    //   })
    // );
    // // 由于浏览器页签图片读取了public下的文件，需要单独设置
    // app.use(
    //   "/vite.svg",
    //   express.static(resolve("./dist/client/vite.svg"), {
    //     maxAge: "1000h", // 设置缓存时间
    //   })
    // );
    app.use(
      require("serve-static")(resolve("dist/client"), {
        index: false,
      })
    );
  } else {
    /**
     * 以中间件模式创建vite应用，这将禁用Vite本身的HTML服务逻辑
     * 并让上级服务接管控制
     */
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    // 使用 vite 的 Connect 实例作为中间件
    // 如果你使用了自己的 express 路由（express.Router()），你应该使用 router.use
    // 必须设置静态资源才能有作用
    app.use(vite.middlewares);
  }

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    let render, template;

    try {
      if (isProd) {
        template = prodIndex;
        render = (await import("./dist/server/entry-server.js")).render;
      } else {
        // 1. 读取index.html
        template = fs.readFileSync(resolve("index.html"), "utf-8");
        /**
         * 2. 应用vite HTML转换，这将会注入ViteHMR客户端
         *  同时也会从vite插件应用HTML
         *  例如：@vitejs/plugin-react 中的 global preambles
         */
        template = await vite.transformIndexHtml(url, template);

        /**
         * 3. 加载服务入口，vite.ssrLoadModule将自动转换
         * 你的ESM源码使之可以在Node.js中运行，无需打包
         * 并提供类似HMR的根据情况随时失效
         */
        render = (await vite.ssrLoadModule("/src/entry-server.ts")).render;
      }
      /**
       *  4. 渲染应用的 HTML。这假设 entry-server.js 导出的 `render`
       *  函数调用了适当的 SSR 框架 API。
       *  例如 ReactDOMServer.renderToString()
       */
      const { renderedHtml, preloadLinks } = await render(url, manifest);
      // 5. 注入渲染后的应用程序 HTML 到模板中。
      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--ssr-outlet-->`, renderedHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      // 如果捕获到了一个错误，让 Vite 来修复该堆栈，这样它就可以映射回
      // 你的实际源码中。
      if (isProd) {
        console.info((e as Error).stack);
        res.status(500).end((e as Error).stack);
      } else {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    }
  });

  app.listen(8900);
  console.info("Server is start port at 8900");
}

createServer();
