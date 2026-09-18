const { copyFileSync } = require('node:fs');
const { resolve } = require('node:path');

copyFileSync(resolve(__dirname, '..', 'challenges.json'), resolve(__dirname, '..', 'dist', 'challenges.json'));
