import { createApp } from "./main";
import "./style.css";

const { app, router, pinia } = createApp();

// if ((window as any).__INITIAL_STATE__) {
//   pinia.state.value = JSON.parse((window as any).__INITIAL_STATE__);
// }


router.isReady().then(() => {
  app.mount("#app");
  console.log("hydrated");
})
