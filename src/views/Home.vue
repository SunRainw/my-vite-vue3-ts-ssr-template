<template>
  <div>This is Home Page</div>
  <span>Count from Pinia:</span>
  <button @click="increaseCount">{{ count }}</button>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCountStore } from "../pinia";
const countStore = useCountStore();
const { count } = storeToRefs(countStore);
const { increaseCount } = countStore;
</script>
