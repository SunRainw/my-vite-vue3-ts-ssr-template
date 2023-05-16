import { basename } from 'node:path'
import { createApp } from "./main";
import { renderToString } from "@vue/server-renderer";

export const render = async (url: string, manifest: any = {}) => {
  // console.info(url)
  const { app, router, pinia  } = createApp();

  await router.push(url);
  await router.isReady();

  // 注入vue ssr中的上下文对象
  const renderCtx: { modules?: string[] } = {};
  const renderedHtml = await renderToString(app, renderCtx);
  const preloadLinks = renderPreloadLinks(renderCtx.modules, manifest)
  const state = JSON.stringify(pinia.state.value);

  return { renderedHtml, preloadLinks, state };
};

function renderPreloadLinks(modules: any, manifest: any) {
  let links = "";
  const seen = new Set();
  console.info(modules)
  modules.forEach((id: string) => {
    const files = manifest[id];
    if (files) {
      files.forEach((file: string) => {
        if (!seen.has(file)) {
          seen.add(file);
          const filename = basename(file);
          if (manifest[filename]) {
            for (const depFile of manifest[filename]) {
              links += renderPreloadLink(depFile);
              seen.add(depFile);
            }
          }
          links += renderPreloadLink(file);
        }
      });
    }
  });
  return links;
}

function renderPreloadLink(file: string) {
  if (file.endsWith(".js")) {
    return `<link rel="modulepreload" crossorigin href="${file}">`;
  } else if (file.endsWith(".css")) {
    return `<link rel="stylesheet" href="${file}">`;
  } else if (file.endsWith(".woff")) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`;
  } else if (file.endsWith(".woff2")) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`;
  } else if (file.endsWith(".gif")) {
    return ` <link rel="preload" href="${file}" as="image" type="image/gif">`;
  } else if (file.endsWith(".jpg") || file.endsWith(".jpeg")) {
    return ` <link rel="preload" href="${file}" as="image" type="image/jpeg">`;
  } else if (file.endsWith(".png")) {
    return ` <link rel="preload" href="${file}" as="image" type="image/png">`;
  } else {
    // TODO
    return "";
  }
}
