#! /usr/bin/env node
/*
* This builds the command line parsing code using the pegjs library.
* The output is a javascript command line parser that parses netfiler commands
* and generates a berkley packet filter(BPF) representation of the netfilter command
* in the form of a javascript object.  This object is then passed to the netfilter
* command parser to be converted to binary netfiler netlink message and send to the
* netfilter subsystem of the kernel via a netlink socket.
*/

var PEG = require('pegjs');
var fs = require('fs');

var inputFile = __dirname + "/node-netfilter.pegjs";
console.log("inputFile: " + inputFile);

var grammer = fs.readFileSync(inputFile, 'utf8');
var parser = PEG.buildParser(grammer, { output: "source" });
fs.writeFileSync("./node-netfilter.js", parser );
