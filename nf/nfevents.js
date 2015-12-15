'use-strict'

var nlnf = require('./nlnetfilter.js');
var nf = nfnetlink = require('../nl/nfnetlink.js');
var ul = require('./nfulog.js');
var util = require('util');
var cmn = require('../libs/common.js');
var rt = require('../nl/rtnetlink.js');

nfevents = (function(){

	var nfsendcommand = function(opts, sock, attrs, cb) {
		return new cmn.Promise(function(resolve,reject) {
			try{
				nf.sendNetfilterCommand(opts, sock, attrs, function(err,bufs){
					if(err) {
						return reject(err);
					} else {
						return resolve(bufs);
					}
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var buildNfulCommandAttr = function(type, command) {
		var command_buf;

		if(Buffer.isBuffer(command)) {
			command_buf = command;
		} else {
			command_buf = new Buffer([command]);
		}
		var command_attr = rt.buildRtattrBuf(type, command_buf);

		return {
			writeAttributes: function(bufs) {
				bufs.push(command_attr);
			}
		}
	};

	var unbindpf = function(sock, opts) {
		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_msg_types.NFULNL_MSG_CONFIG,
		                                         ul.nfulnl_msg_config_cmds.NFULNL_CFG_CMD_PF_UNBIND);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var bindpf = function(sock,opts) {
		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_msg_types.NFULNL_MSG_CONFIG,
		                                         ul.nfulnl_msg_config_cmds.NFULNL_CFG_CMD_PF_BIND);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var bindgroup = function(sock, opts) {
		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_msg_types.NFULNL_MSG_CONFIG,
		                                         ul.nfulnl_msg_config_cmds.NFULNL_CFG_CMD_BIND);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var unbindgroup = function(sock, opts) {
		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_msg_types.NFULNL_MSG_CONFIG,
		                                         ul.nfulnl_msg_config_cmds.NFULNL_CFG_CMD_UNBIND);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var packetcopy = function(opts, sock, mode, range) {

		var packet_cpy = Buffer(6);
		packet_cpy.writeUInt32BE(range, 0);
		packet_cpy.writeUInt8(mode, 4);
		packet_cpy.writeUInt8(0, 5);

		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_attr_config.NFULA_CFG_MODE, packet_cpy);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var buffersize = function(opts, sock, size) {
		var bufsize = Buffer(4);
		bufsize.writeUInt32BE(size);

		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_attr_config.NFULA_CFG_NLBUFSIZ,
					                             bufsize);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var timeout = function(opts, sock, time) {
		var ticks = Buffer(4);
		ticks.writeUInt32BE(ticks);

		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_attr_config.NFULA_CFG_TIMEOUT,
					                             ticks);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var qthreshold = function(opts, sock, thresh) {
		var t = Buffer(4);
		t.writeUInt32BE(thresh);

		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_attr_config.NFULA_CFG_QTHRESH, t);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var flags = function(opts, sock, flgs) {
		var f = Buffer(4);
		t.writeUInt32BE(flgs);

		return new cmn.Promise(function(resolve,reject){
			try {
				var attrs = buildNfulCommandAttr(ul.nfulnl_attr_config.NFULA_CFG_FLAGS, f);
				nfsendcommand(opts, sock, attrs).then(function(bufs){
					resolve(bufs)
				}, function(err){
					reject(err);
				});
			} catch(err) {
				reject(err);
			}
		});
	};

	var addConfigAttributes = function(sock, opts) {
		var commands = [];

		if(opts.hasOwnProperty('packet_copy'))
		{
			var packet_cpy_opt = opts['packet_copy'];
			if( (typeof(packet_cpy_opt.mode) === 'undefined') ||
			    (typeof(packet_cpy_opt.range) === 'undefined') ) {
				return cb(new Error("mode and range must be specified in packet_copy option."));
			}

			try {

				var mode = ul['NFULNL_' + packet_cpy_opt.mode.toUpperCase()];
				var range = Math.min(packet_cpy_opt.range, 0xFFFF);

				commands.push(packetcopy(opts, sock, mode,range));

			} catch(err) {
				return cb(err);
			}
		}

		if(opts.hasOwnProperty('buffer_size'))
		{
			var size = opts['buffer_size'];
			commands.push(buffersize(opts, sock, size));
		}

		if(opts.hasOwnProperty('timeout'))
		{// ten millisecond tick
			var size = opts['timeout'];
			commands.push(timeout(opts, sock, size));
		}

		if(opts.hasOwnProperty('qthreshold'))
		{// ten millisecond tick
			var thresh = opts['qthreshold'];
			commands.push(qthreshold(opts, sock, thresh));
		}

		if(opts.hasOwnProperty('flags'))
		{
			var flgs = opts['flags'];

			try {
				var val = 0;
				flgs.split(',').map(function(f){
					val |= ul[f];
				});

				commands.push(flags(opts, sock, val));

			} catch(err) {
				return cb(err);
			}
		}

		return cmn.Promise.all(commands);
	};

	return {
		listen: function(opts, cb) {
		    var nk = this;

		    if(typeof(opts) === 'undefined' || typeof(cb) === 'undefined') {
		    	return cb(new Error("Bad arguments expecting command:[Object], callback[function]"));
		    }

		    var sock = nk.newNetlinkSocket();
			var sock_opts = {
					sock_class: nl.NETLINK_NETFILTER,
				};

			sock.create(sock_opts,function(err) {
				if(err) {
					sock.close();
					return cb(new Error("socket.create() Error: " + util.inspect(err)));
				} else {

					cmn.onExit( function() {
						unbindgroup(sock, opts).then(function() {
							sock.close();
						})
					});

					if(!opts.hasOwnProperty('res_id')) opts['res_id'] = 0;
					opts['batch'] = "false";
					opts['type_flags'] = nl.NLM_F_REQUEST | nl.NLM_F_ACK;
					opts['family'] = nk.AF_INET;
					opts['subsys'] = nf.NFNL_SUBSYS_ULOG;
					opts['cmd'] = ul.nfulnl_msg_types.NFULNL_MSG_CONFIG;

					unbindpf(sock,opts).then( function(bufs) {
						return bindpf(sock,opts);
					}).then( function() {
						return bindgroup(sock,opts)
					}).then(function() {
						return addConfigAttributes(sock, opts);
					}).then(function(){
						sock.onRecv(function(err,bufs){
							if(err) {
								cb(new Error("onRecv() Error: " + util.inspect(err)));
							} else {
								cb(null, ul.parseNfulogAttributes(bufs));
							}
						});
					}, function(err) {
						cmn.logger.error(util.inspect(err));
					})
					.catch(function(err){
						cmn.logger.error(util.inspect(err));
					});
				}
			});
		}
	}
}());

module.exports = nfevents;