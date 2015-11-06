#! /usr/bin/env node

var PEG = require('pegjs');
var fs = require('fs');

var grammer = fs.readFileSync(__dirname + "/node-netfilter.pegjs", 'utf8');
var parser = PEG.buildParser(grammer, { output: "source" });
fs.writeFileSync("./node-netfilter.js", parser );

