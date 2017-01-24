var pr = require('../nl/prnetlink.js')
var nl = require('../nl/netlink.js');
var util = require('util');
var cmn = require('../libs/common.js');
var debug = cmn.logger.debug;
var error = cmn.logger.error;

nlprocess = {

	proc_fork_fmt: 	"I(cpu)d(timestamp_ns)" +
						"<I(parent_pid)I(parent_tgid)I(child_pid)I(child_tgid)" +
						"S(cmdline)",

	PROC_EVENT_NONE: 0x00000000,
	PROC_EVENT_FORK: 0x00000001,
	PROC_EVENT_EXEC: 0x00000002,
	PROC_EVENT_UID : 0x00000004,
	PROC_EVENT_GID : 0x00000040,
	PROC_EVENT_SID : 0x00000080,
	PROC_EVENT_PTRACE: 0x00000100,
	PROC_EVENT_COMM: 0x00000200,
	/* "next" should be 0x00000400 */
	/* "last" is the last process event: exit,
	 * while "next to last" is coredumping event */
	PROC_EVENT_COREDUMP: 0x40000000,
	PROC_EVENT_EXIT: 0x80000000,

	onProcessChange: function(cb) {
		var netkitObject = this;
		var sock = netkitObject.newNetlinkSocket();

		var sock_opts = {
				sock_class: nl.NETLINK_CONNECTOR,
				subscriptions: pr.CN_IDX_PROC
			};

		sock.create(sock_opts,function(err) {
			if(err) {
				return cb(new Error("socket.create() Error: " + util.inspect(err)));
			} else {
				pr.sendConnectorMsg(sock,function(err,bufs){
					if(err) {
						return cb( new Error("sendConnectorMsg() Error: " + util.inspect(err)));
					} else {
						sock.onRecv(function(err,bufs) {
							if(err) {
								cb(new Error("onRecv() Error: " + util.inspect(err)));
							} else {
								var result =
									nlprocess.processProcEvent(bufs[0]);
								if(typeof(result) !== 'undefined')
									cb(null, result);
							}
						});
					}
				});
			}
		});
	},


	// See struct proc_event in /linux/include/uapi/linux/cn_proc.h
	processProcEvent: function(buf) {
		if(!(buf instanceof Buffer)) return;
		//debug('buf-->' + buf.toJSON());

		// Slice out the nl header and cn hdr to get to the cn data
		buf = buf.slice(36, buf.length-1);

		// whats left has to be the exact size of a proc_event struct 40 bytes
		if(buf.length < 39) return;
		var w = buf.readUInt32LE(0,4);

		var ev = {};
		switch(w) {
			case nlprocess.PROC_EVENT_FORK:
				ev.event = "fork";
				ev.data = {};
				ev.data.parent_pid = buf.readUInt32LE(16);
				ev.data.parent_tgid = buf.readUInt32LE(20);
				ev.data.child_pid = buf.readUInt32LE(24);
				ev.data.child_tgid = buf.readUInt32LE(28);
				return ev;
				break;
			case nlprocess.PROC_EVENT_EXEC:
				ev.event = "exec";
				ev.data = {};
				ev.data.process_pid = buf.readUInt32LE(16);
				ev.data.process_tgid = buf.readUInt32LE(20);
				return ev;
				break;
			case nlprocess.PROC_EVENT_EXIT:
				ev.event = "exit";
				ev.data = {};
				ev.data.process_pid = buf.readUInt32LE(16);
				ev.data.process_tgid = buf.readUInt32LE(20);
				ev.data.exitcode = buf.readUInt32LE(24);
				ev.data.signal = buf.readUInt32LE(28);
				return ev;
				break;
			case nlprocess.PROC_EVENT_UID:
				ev.event = "uid";
				ev.data = {};
				ev.data.process_pid = buf.readUInt32LE(16);
				ev.data.process_tgid = buf.readUInt32LE(20);
				ev.data.ruid = buf.readUInt32LE(24);
				ev.data.euid = buf.readUInt32LE(28);
				return ev;
				break;
			default:
				//debug("default");
				return;
		}
	},
};

module.exports = nlprocess;
