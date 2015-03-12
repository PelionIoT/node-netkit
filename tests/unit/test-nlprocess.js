var np = require('../../nlprocess.js');

exports.testBogusBuffer = function(test){
	test.doesNotThrow(function() {
		np.processProcEvent(null);  	// null
		np.processProcEvent();			// undefined
		np.processProcEvent("");		// wrong type
		np.processProcEvent(0);		// wrong type
		np.processProcEvent({});		// wrong type
		np.processProcEvent(new Buffer(1)); // less than netlink header size
		np.processProcEvent(new Buffer(16)); // netlink header but no length
		np.processProcEvent(Buffer([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]));
	});//, [error], [message])

    test.done();
};


var fork_buf = Buffer([76,0,0,0,3,0,0,0,212,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,212,1,0,0,0,0,0,0,40,0,0,0,1,0,0,0,0,0,0,0,70,8,94,161,240,1,0,0,202,5,0,0,202,5,0,0,67,6,0,0,67,6,0,0,0,0,0,0,0,0,0,0]);
var exec_buf = Buffer([76,0,0,0,3,0,0,0,213,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,213,1,0,0,0,0,0,0,40,0,0,0,2,0,0,0,0,0,0,0,148,72,98,161,240,1,0,0,67,6,0,0,67,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
var exit_buf = Buffer([76,0,0,0,3,0,0,0,177,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,177,0,0,0,0,0,0,0,40,0,0,0,0,0,0,128,0,0,0,0,63,93,242,0,49,1,0,0,207,5,0,0,207,5,0,0,0,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0]);
var uid_buf = Buffer([76,0,0,0,3,0,0,0,14,3,0,0,0,0,0,0,1,0,0,0,1,0,0,0,14,3,0,0,0,0,0,0,40,0,0,0,4,0,0,0,0,0,0,0,107,156,235,12,85,2,0,0,175,6,0,0,175,6,0,0,104,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0]);

exports.testProcessTypes = function(test){
	test.doesNotThrow(function() {
		var buf = Buffer(37);
		buf[36] = nlprocess.PROC_EVENT_FORK;
		test.deepEqual(
			np.processProcEvent(buf),
			undefined,
			"good type but no more data" );
	});
    test.done();
};

exports.testProcessExit = function(test){
	test.doesNotThrow(function() {
		test.deepEqual(
			np.processProcEvent(exit_buf),
			{ event: 'exit', data: { process_pid: 1487, process_tgid: 1487, exitcode: 0, signal: 17 } },
			"should parse exit event" );
	});
    test.done();
};

exports.testProcessFork = function(test){
	test.doesNotThrow(function() {
		test.deepEqual(
			np.processProcEvent(fork_buf),
			{ event: 'fork',
			  data:
			   { parent_pid: 1482,
			     parent_tgid: 1482,
			     child_pid: 1603,
			     child_tgid: 1603 } },
			"should parse fork event" );
	});
    test.done();
};

exports.testProcessExec = function(test){
	test.doesNotThrow(function() {
		test.deepEqual(
			np.processProcEvent(exec_buf),
			{ event: 'exec',
			  data: { process_pid: 1603, process_tgid: 1603 } },
			"should parse exec event" );
	});
    test.done();
};

exports.testProcessUid = function(test){
	test.doesNotThrow(function() {
		test.deepEqual(
			np.processProcEvent(uid_buf),
			{ event: 'uid',
			  data: { process_pid: 1711, process_tgid: 1711, ruid: 104, euid: 104 } },
			"should parse uid event" );
	});
    test.done();
};
