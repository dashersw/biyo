<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="biyo-app">
    <h2 class="biyo-title">Biyo Vue Counter</h2>
    <div class="biyo-counter">
      <button class="biyo-button" @click="count--">-</button>
      <span class="biyo-count">{{ count }}</span>
      <button class="biyo-button" @click="count++">+</button>
    </div>
  </div>
</template>

<style scoped>
.biyo-app {
  background: #ffffff;
  color: #000000;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  max-width: 300px;
  margin: 0;
  box-sizing: border-box;
}

.biyo-title {
  color: #000000;
  font-size: 24px;
  margin: 0 0 20px 0;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
}

.biyo-counter {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.biyo-count {
  color: #000000;
  font-size: 24px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.biyo-button {
  background: #f5f5f5;
  color: #000000;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 24px;
  min-width: 48px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  line-height: 1;
  margin: 0;
  user-select: none;
}

.biyo-button:hover {
  background: #e0e0e0;
  border-color: #d0d0d0;
}

.biyo-button:active {
  background: #d0d0d0;
  transform: translateY(1px);
}

/* Reset any inherited styles */
.biyo-app *,
.biyo-app *::before,
.biyo-app *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: inherit;
}
</style>
