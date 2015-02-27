var nl = require('./netlink.js')
var bufferpack = require('./libs/bufferpack.js');

var nativelib = null;
try {
	nativelib = require('./build/Release/netkit.node');
} catch(e) {
	if(e.code == 'MODULE_NOT_FOUND')
		nativelib = require('./build/Debug/netkit.node');
	else
		console.error("Error in nativelib [debug]: " + e + " --> " + e.stack);
}

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
				subscriptions: nl.CN_IDX_PROC
			};

		sock.create(sock_opts,function(err) {
			if(err) {
				cb("socket.create() Error: " + util.inspect(err));
				return;
			} else {
				nl.sendConnectorMsg(sock,function(err,bufs){
					if(err) {
						util.inspect(err);
					} else {
						console.dir(bufs);
						sock.onRecv(function(err,bufs) {
							if(err) {
								cb("ERROR: ** Bad **");
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

	processProcEvent: function(buf) {
		// Take out the nl header and cn hdr to get to the cn data
		buf = buf.slice(36, buf.length-1);
		var w = buf.readUInt32LE(0,4);
		var ev = {};

		console.log('what=' + w);
		//console.dir(buf);
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
				console.log("default");
				return; 
		}
	},
};

module.exports = nlprocess;