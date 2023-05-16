import { ref } from "vue";
import type { Ref } from "vue";
import { defineStore } from "pinia";

export const useCountStore = defineStore("count", () => {
  const count: Ref<number> = ref(0);
  const increaseCount = () => {
    count.value++;
  };
  // if (import.meta.env.SSR) {
  //   count.value = 3;
  // }
  return { count, increaseCount };
});
