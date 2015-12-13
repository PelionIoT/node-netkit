var nk = require('../../index.js');
var util = require('util');
var nft = nk.nf.nft;


var options = {
	// set the amount of packet data that nflog copies to userspace
	// mode: COPY_NONE, COP_META_COPY_PACKET (part of the pavket we are interested in)
	// range: size of packet to get
 	packet_copy: { mode: "COPY_PACKET", range: 0xFFFF },

 	// set the group number of events to listen to (default: 0)
	res_id: 0,

	// Sets the size (in bytes) of the buffer that is used to
	// stack log messages in nflog.

	// NOTE: The use of this function is strongly discouraged. The default
	// buffer size (which is one memory page) provides the optimum results
	// in terms of performance. Do not use this function in your applications.
 	// buffer_size: 20,

 	// Set the maximum number of log entries in the buffer
 	// until it is pushed to userspace.
	qthreshold: 5,

	//  Set the maximum time(in 1/100 of a second) that nflog waits until it
 	// 	pushes the log buffer to userspace if no new logged packets have occured.
 	// 	Basically, nflog implements a buffer to reduce the computational cost
 	// 	of delivering the log message to userspace.
	timeout: 100

	// There are two existing flags:
	// 	- NFULNL_CFG_F_SEQ: This enables local nflog sequence numbering.
	// 	- NFULNL_CFG_F_SEQ_GLOBAL: This enables global nflog sequence numbering.
	//flags: "NFULNL_CFG_F_SEQ, NFULNL_CFG_F_SEQ_GLOBAL"
};

nk.nfListen(options, function(err, buf){
	if(err) {
		console.error(util.inspect(err));
	} else {
		console.dir(buf);
	}
});
