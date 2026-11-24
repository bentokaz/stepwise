/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

/** Short commit hash, shown in feedback reports so bugs can be matched to a build. */
function appVersion(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  // Relative base so the build works at https://<user>.github.io/<repo>/
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
