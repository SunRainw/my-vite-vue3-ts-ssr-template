import { createSSRApp } from "vue";
import App from "./App.vue";
import { createRouter } from "./router";
import { createPinia } from "pinia";

export const createApp = () => {
  const app = createSSRApp(App);
  const router = createRouter();
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  return { app, router, pinia };
};
