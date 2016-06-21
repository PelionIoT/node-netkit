'use strict';

var NlAttributes = require('../nl/nlattributes.js');
var nlnetfilter = require('./nlnetfilter.js');
var nl = nlnetfilter.nl;
var nlnf = require('../nl/nfnetlink.js');
var util = require('util');
var cmn = require("../libs/common.js");
var fs = require("fs");
var parser = require("./node-netfilter.js");
var EventEmitter = require('events').EventEmitter;

var nfcommand = (function(){

    var emitter = new EventEmitter();

	function command(command) {
		var opts = parser.parse(command);			
		return command_by_structure(opts);
	}

	function command_by_structure(opts) {
		return new Promise(function(resolve,reject) {

			var listen = (opts.command === 'monitor') ? true : false; 
			build_command(opts,function(err){
				// console.log(util.inspect(opts, {depth: null}));
				if(err) {
					return reject(err);
				} else {
					opts.batch = true;
					var attrs = new NlAttributes(opts.type, opts.params, nlnf );
					nlnetfilter.netfilterSend(null, opts,
						attrs, function(err,bufs){

						if(listen) {
							var ret = attrs.generateNetlinkResponse(bufs);
							if(ret.length) {
								emitter.emit('event', ret[0].payload);
							}
						} else if(err) {
							return reject(err);
						} else {
							//console.dir(bufs);
							return resolve(attrs.generateNetlinkResponse(bufs));
						}
					});
				}
			});
		});
	}

	function build_command(opts,cb) {
		if(!opts.type) opts.type ='rule';
		opts.subsys = nlnf.NFNL_SUBSYS_NFTABLES;
		set_cmd(opts,cb);
		nlnetfilter.set_family(opts,cb);
		set_type(opts,cb);
		return cb();
	}

	function set_cmd(opts, cb) {
		var command = opts.command;
		var type = opts.type.toUpperCase();
		switch(command) {
			case "get":
				opts.cmd = nlnf['NFT_MSG_GET'+ type];
				break;
			case "add":
				switch(type) {
					case "SETELEM":
						opts.type = 'setelemlist';
						opts.cmd =  nlnf.NFT_MSG_NEWSETELEM;
						break;

					case "SET":
						opts.params.id = randomIntInclusive(0, 0xFFFFFFFF);
						opts.cmd =  nlnf['NFT_MSG_NEW' + type];
						break;
					case "RULE":
					case "CHAIN":
						opts.cmd =  nlnf['NFT_MSG_NEW' + type];
						if(typeof opts.params.handle !== 'undefined') delete opts.params.handle;
						break;
					default:
						opts.cmd =  nlnf['NFT_MSG_NEW' + type];
						break;
				}
				break;
			case "insert":
				switch(type) {
					case "RULE":
						opts.cmd =  nlnf.NFT_MSG_NEWRULE;
						break;
					default:
						cb(new Error(command + "only implemented for type rule"));
						break;
				}
				break;
			case "delete":
				opts.cmd =  nlnf['NFT_MSG_DEL' + type];
				break;
			case "flush":
				switch(type) {
					case "TABLE":
						opts.cmd =  nlnf.NFT_MSG_DELRULE;
						break;
					case "RULESET":
						opts.cmd =  nlnf.NFT_MSG_DELTABLE;
						break;
					default:
						opts.cmd =  nlnf['NFT_MSG_DEL' + type];
						break;
				}
				break;
			case "update":
				opts.cmd =  nlnf['NFT_MSG_NEW' + type];
				break;
			case "list":
				switch(type) {
					case "SET":
						opts.cmd =  nlnf.NFT_MSG_GETSETELEM;
						break;
					default:
						opts.cmd =  nlnf['NFT_MSG_GET' + type];
						break;
				}
				break;
			case "monitor":
				opts.cmd =  nlnf.NFT_MSG_NEWSET;
				break;
			default:
				cb(new Error(command +
					" command not supported: get, add, del, update"));
				break;
		}
	}

	function set_type(opts, cb) {

		var command = opts.command;
		var type = opts.type;
		switch(command) {
			case "get":
				switch(type){
					case "table":
						opts.type_flags = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "rule":
						opts.type_flags = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					default:
						opts.type_flags = nl.NLM_F_ACK;
						break;
				}
				break;
			case "add":
				switch(type) {
					case "rule":
						opts.type_flags =  nl.NLM_F_APPEND | nl.NLM_F_CREATE |nl.NLM_F_ACK;
						break;
					case "set_elem_list":
						opts.type_flags =  nl.NLM_F_ATOMIC;
						break;
					case "set":
						opts.type_flags =  nl.NLM_F_MATCH | nl.NLM_F_ATOMIC;
						break;
					case "chain":
						opts.type_flags =  nl.NLM_F_ATOMIC;
						break;
					default:
						opts.type_flags =  nl.NLM_F_ACK;
						break;
				}
				break;
			case "insert":
				switch(type) {
					case "rule":
						opts.type_flags =  nl.NLM_F_REQUEST | nl.NLM_F_MATCH | nl.NLM_F_ATOMIC;
						opts.batch = true; // up until using atomic all types containing match would not require a batch
						                      // netfilter netlink command. See: nfnetlink.sendNetfilterCommand()
						break;
					default:
						cb(new Error(command + "only implemented for type rule"));
						break;
				}
				break;
			case "delete":
			case "flush":
				switch(type){
					case "ruleset":
						opts.type = "table";
						opts.type_flags = nl.NLM_F_ACK;
						break;
					default:
						opts.type_flags = nl.NLM_F_ACK;
						break;
				}
				break;
			case "update":
				opts.type_flags =  nl.NLM_F_ACK;
				break;
			case "list":
				switch(type){
					case "table":
						opts.type_flags = nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "rule":
						opts.type_flags = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "chain":
						opts.type_flags = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "set":
						opts.type_flags = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "set_elem_list":
						opts.type_flags = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_ACK;
						break;
					default:
						cb(new Error(command + " not implemented for type " + type));
						break;
				}
				break;
			case "monitor":
				opts.type_flags = nl.NLM_F_REQUEST | nl.NLM_F_ACK;			
				break;
			default:
				cb(new Error(command +
					" command not supported: get, add, del, update"));
				break;
		}
	}

	function randomIntInclusive(low, high) {
    		return Math.floor(Math.random() * (high - low + 1) + low);
	}


	return {
        on: function(event, cb) {
            emitter.on(event,cb);
        },
		command: command,
		command_by_structure: command_by_structure,
		build_command: build_command
	};

})();

module.exports = nfcommand;