#! /usr/bin/env node

var PEG = require('../node_modules/pegjs');
var fs = require('fs');

var grammer = fs.readFileSync(__dirname + "/node-netfilter.pegjs");
var parser = PEG.buildParser(grammer, { output: "source" });
fs.writeFileSync("./node-netfiler.js", parser );

