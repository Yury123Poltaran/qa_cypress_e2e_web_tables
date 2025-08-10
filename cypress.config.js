const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://demoqa.com',
    defaultCommandTimeout: 8000,
    setupNodeEvents(on, config) {}
  },
  video: false,
  screenshotOnRunFailure: true
});
