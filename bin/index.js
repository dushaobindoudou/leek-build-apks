#!/usr/bin/env node
const minimist = require('minimist');
const lab = require('../index');

const argv = process.argv;
let argObj = {};
if (argv[0] === 'sudo' || argv[0] === 'su') {
    argObj = minimist(argv.slice(3));
} else {
    argObj = minimist(argv.slice(2));
}

// runParam: error、continue、rebuild
const runParam = argObj.run || argObj.r;

lab.start(runParam);
