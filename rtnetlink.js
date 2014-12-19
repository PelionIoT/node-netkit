
var bufferpack = require('./libs/bufferpack.js');

// for documentation see: /usr/include/linux/netlink.h
var nlmsghdr_fmt = "<I(_len)H(_type)H(_flags)I(_seq)I(_pid)";

// for documentation see: /usr/include/linux/neighbor.h
var ndmsg_fmt = "<B(_family)B(_pad1)H(_pad2)L(_ifindex)H(_state)B(_flags)B(_type)";
 
// for documentation see: /usr/include/linux/rtnetlink.h:~175
var rtmsg_fmt = "<B(_family)B(_dst_len)B(_src_len)B(_tos)B(_table)B(_protocol)B(_scope)B(_type)I(_flags)";

var rtattr_fmt = "<H(_len)H(_type)";

var nda_cacheinfo_fmt = "H(_confirmed)H(_used)H(_updated)H(_refcnt)";


module.exports = {
		// netlink message flags
		// See: linux/netlink.h
		
		NLM_F_REQUEST:		1,	/* It is request message. 	*/
		NLM_F_MULTI:		2,	/* Multipart message, terminated by NLMSG_DONE */
		NLM_F_ACK:   		4,	/* Reply with ack, with zero or error code */
		NLM_F_ECHO:  		8,	/* Echo this request 		*/
	    NLM_F_DUMP_INTR:	16, /* Dump was inconsistent due to sequence change */


	    // see: linux/neighbor.h
	    NTF_USE:		0x01,
	    NTF_PROXY:   	0x08,	/* == ATF_PUBL */
	    NTF_ROUTER:     0x80,

		NTF_SELF:    	0x02,
		NTF_MASTER:     0x04,

		/*
		 *	Neighbor Cache Entry States.
		 */

		NUD_INCOMPLETE: 0x01,
		NUD_REACHABLE:  0x02,
		NUD_STALE:   	0x04,
		NUD_DELAY:      0x08,
		NUD_PROBE:      0x10,
		NUD_FAILED:     0x20,

		/* Dummy states */
		NUD_NOARP:      0x40,
		NUD_PERMANENT:  0x80,
		NUD_NONE:       0x00,


		NDA_UNSPEC:     0,
		NDA_DST:        1,
		NDA_LLADDR:     2,
		NDA_CACHEINFO:  3,
		NDA_PROBES:     4,
		NDA_VLAN:       5,
		NDA_PORT:       6,
		NDA_VNI:        7,
		NDA_IFINDEX:    8,
		__NDA_MAX:      9,

		/** message types. see linux/rtnetlink.h */

		RTM_BASE:       16,
		RTM_NEWLINK: 16,
		RTM_DELLINK: 17,
		RTM_GETLINK: 18,
		RTM_SETLINK: 19,
		RTM_NEWADDR	: 20,
		RTM_DELADDR : 21,
		RTM_GETADDR: 22,
		RTM_NEWROUTE: 24,
		RTM_DELROUTE: 25,
		RTM_GETROUTE: 26,
		RTM_NEWNEIGH	: 28,
		RTM_DELNEIGH: 29,
		RTM_GETNEIGH: 30,
		RTM_NEWRULE	: 32,
		RTM_DELRULE: 33,
		RTM_GETRULE: 34,
		RTM_NEWQDISC: 36,
		RTM_DELQDISC: 37,
		RTM_GETQDISC: 38,
		RTM_NEWTCLASS	: 40,
		RTM_DELTCLASS: 41,
		RTM_GETTCLASS: 42,
		RTM_NEWTFILTER	: 44,
		RTM_DELTFILTER: 45,
		RTM_GETTFILTER: 46,
		RTM_NEWACTION	: 48,
		RTM_DELACTION: 49,
		RTM_GETACTION: 50,
		RTM_NEWPREFIX	: 52,
		RTM_GETMULTICAST : 58,
		RTM_GETANYCAST	: 62,
		RTM_NEWNEIGHTBL	: 64,
		RTM_GETNEIGHTBL	: 66,
		RTM_SETNEIGHTBL: 67,
		RTM_NEWNDUSEROPT : 68,
		RTM_NEWADDRLABEL : 72,
		RTM_DELADDRLABEL: 73,
		RTM_GETADDRLABEL: 74,
		RTM_GETDCB : 78,
		RTM_SETDCB: 79,
		RTM_NEWNETCONF : 80,
		RTM_GETNETCONF : 82,
		RTM_NEWMDB : 84,
		RTM_DELMDB : 85,
		RTM_GETMDB: 86,

		RTN_UNSPEC: 0,
		RTN_UNICAST: 1,		/* Gateway or direct route	*/
		RTN_LOCAL: 2,		/* Accept locally		*/
   	    RTN_BROADCAST: 3,	/* Accept locally as broadcast, send as broadcast */
   	    RTN_ANYCAST: 4,		/* Accept locally as broadcast, but send as unicast */
   	    RTN_MULTICAST: 5,	/* Multicast route		*/
   	    RTN_BLACKHOLE: 6,	/* Drop				*/
   	    RTN_UNREACHABLE: 7,	/* Destination is unreachable   */
   	    RTN_PROHIBIT: 8,	/* Administratively prohibited	*/
   	    RTN_THROW: 9,		/* Not in this table		*/
   	    RTN_NAT: 10,		/* Translate this address	*/
   	    RTN_XRESOLVE: 11,	/* Use external resolver	*/
   	    __RTN_MAX: 12,



// Build a netlink header... returns a packbuffer 'meta' object
// ._len, ._seq, ._pid are automatically filled in later.
	buildHdr: function() {
		var o = bufferpack.metaObject(nlmsghdr_fmt);
		o._len = 0;                  // auto
		o._type = 0;                 // should be the netlink command
		o._flags = this.NLM_F_REQUEST;    // native will add NLM_F_ACK if needed
		o._seq = 0;                  // auto
		o._pid = 0;                  // auto
		return o;
	},

	buildNdmsg: function(fam,ifindex,state,flags,typ) {
		var o = bufferpack.metaObject(ndmsg_fmt);
		fam==undefined ? o._family = 0 : o._family = fam;                  // auto
		o._pad1 = 0; 
		o._pad2 = 0;
		ifindex==undefined ? o._ifindex = 0 : o._ifindex = ifindex;
		state==undefined ? o._state = 0 : o._state = state;
		flags==undefined ? o._flags = 0 : o._flags = flags;
		typ==undefined ? o._type = 0 : o._type = typ;
		return o;
	},

// "<B(_family)B(_dst_len)B(_src_len)B(_tos)B(_table)B(_protocol)B(_scope)B(_type)I(_flags)";
	buildRtmsg: function() {
		var o = bufferpack.metaObject(rtmsg_fmt,true);
		return o;
	},

	/**
	 * Returns a rt attribute, which consist of a struct rtattr { type, length } followed by data.
	 * @param  {integer} typ  no larger that an unsigned short (65536)
	 * @param  {Buffer} data the data for this attribute
	 * @return {Buffer} A Buffer holding the header and data.
	 */
	buildRtattrBuf: function(typ,data) {
		if(typeof typ !== 'number' || (data && !Buffer.isBuffer(data))) {
			console.error("ERROR: ** Bad parameters to buildRtattrBuf() **");
		} else {
			var len = 0;
			if(data && data.length)
     			len = data.length + 4; // the rtattr header is 4 bytes
     		else
     			len = 4;
     		var rtabuf = bufferpack.pack(rtattr_fmt,[typ,len]);
     		if(data)
     			return Buffer.concat([rtabuf,data]);
     		else
     			return rtabuf;
     	}
	}


};