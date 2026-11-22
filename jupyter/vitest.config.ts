import {defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {jsdom: {url: "https://jupyter.example.test/lab"}},
    include: ["test/**/*.test.ts"],
    restoreMocks: true,
    setupFiles: ["test/setup.ts"],
  },
})
