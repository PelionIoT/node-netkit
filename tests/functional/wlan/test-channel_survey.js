var nk = require('../../../index.js');
var util = require('util');
var iw = nk.iw;
var nl80211 = iwnl.nl80211;
var nl = iwnl.nl;

// var opts = {

// };


// var opts = {

//     cmd:        nl80211.controller.CTRL_CMD_GETFAMILY,
//     version:    nl80211.CTRL_VERSION,
//     flags:      nl.NLM_F_REQUEST | nl.NLM_F_ACK,
//     type:       iwnl.GENL_ID_CTRL,

//     data:       new Buffer("0C0002006E6C383032313100", 'hex')
// };

// var opts = {
//     cmd:        nl80211.commands.NL80211_CMD_GET_SCAN, //controller.CTRL_CMD_GETFAMILY,
//     //cmd:        nl80211.controller.CTRL_CMD_GETFAMILY,
//     version:    nl80211.CTRL_VERSION,
//     flags:      nl.NLM_F_REQUEST | nl.NLM_F_ACK | nl.NLM_F_ROOT | nl.NLM_F_MATCH,
//     type:       nl.NETLINK_GENERIC | 0x0a,

//     data:       new Buffer("0800030004000000", 'hex')
// };

// var opts = {
//     cmd:        nl80211.commands.NL80211_CMD_GET_WIPHY, //controller.CTRL_CMD_GETFAMILY,
//     //cmd:        nl80211.controller.CTRL_CMD_GETFAMILY,
//     version:    nl80211.CTRL_VERSION,
//     flags:      nl.NLM_F_REQUEST | nl.NLM_F_ACK | nl.NLM_F_ROOT | nl.NLM_F_MATCH,
//     type:       nl.NETLINK_GENERIC | 0x0a,

//     data:       new Buffer("0400ae00", 'hex')
// };


var ifname = 'wlp3s0';

var opts = {
    cmd:        nl80211.commands.NL80211_CMD_GET_SURVEY, //controller.CTRL_CMD_GETFAMILY,
    //cmd:        nl80211.controller.CTRL_CMD_GETFAMILY,
    version:    nl80211.CTRL_VERSION,
    flags:      nl.NLM_F_REQUEST | nl.NLM_F_ACK | nl.NLM_F_ROOT | nl.NLM_F_MATCH,
    type:       nl.NETLINK_GENERIC | 0x0a,

    data:       new Buffer("080003000E000000", 'hex'), // device index

    infotype: 'attr',
    params: iwnl.nl80211_sta_info,
};


//console.dir(opts);
nk.iw(opts, function(err,bufs) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
        console.log(util.inspect(bufs, {depth:null}));
	}
});

