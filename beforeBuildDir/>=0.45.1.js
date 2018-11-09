#!/usr/bin/env node

const path = require('path');
const shelljs = require('shelljs');

console.log('\n\n\n\n\n\n');


const projectRoot = process.argv[process.argv.length - 1];

// shelljs.exec(`rm -rf ${projectRoot}/android/build.gradle`);
shelljs.exec(`cp -f ${path.join(__dirname, './assets/build.gradle')} ${projectRoot}/android/build.gradle`);

console.log('重置 build.gradle 完成');





console.log('\n\n\n\n\n\n');
