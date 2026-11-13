const Path = require('path');

const { defineConfig } = require('vite');
const vuePlugin = require("@vitejs/plugin-vue2");

/**
 * https://vitejs.dev/config
 */
const config = defineConfig({
    root: Path.join(__dirname, 'src', 'renderer'),
    base: './', // relative paths, so the site works under https://<user>.github.io/<repo>/
    publicDir: 'public',
    server: {
        port: 8080,
        open: true,
    },
    build: {
        outDir: Path.join(__dirname, 'build', 'web'),
        emptyOutDir: true,
    },
    plugins: [vuePlugin()],
});

module.exports = config;
