
var bufferpack = require('../libs/bufferpack.js');


// for documentation see: /usr/include/linux/neighbor.h
var ndmsg_fmt = "<B(_family)B(_pad1)H(_pad2)L(_ifindex)H(_state)B(_flags)B(_type)";

// for documentation see: /usr/include/linux/rtnetlink.h:~175
var rtmsg_fmt = "<B(_family)B(_dst_len)B(_src_len)B(_tos)B(_table)B(_protocol)B(_scope)B(_type)I(_flags)";

// for documentation see: /usr/include/linux/if_addr.h:~5
var ifaddrmsg_fmt = "<B(_family)B(_prefix_len)B(_flags)B(_scope)I(_index)";

var ifinfomsg_fmt = "<B(_family)B(_if_pad)H(_if_type)i(_if_index)I(_if_flags)I(_if_change)";

var rtattr_fmt = "<H(_len)H(_type)";

var nda_cacheinfo_fmt = "H(_confirmed)H(_used)H(_updated)H(_refcnt)";

rt = {

	link_info_attr_name_map: [
		"unspec",
		"address",
		"broadcast",
		"ifname",
		"mtu",
		"link",
		"qdisc",
		"stats",
		"cost",
		"priority",
		"master",
		"wireless",
		"protinfo",
		"txqlen",
		"map",
		"weight",
		"operstate",
		"linkmode",
		"linkinfo",
		"net_ns_pid",
		"ifalias",
		"num_vf",
		"vfinfo_list",
		"stats64",
		"vf_ports",
		"port_self",
		"af_spec",
		"group",
		"net_ns_fd",
		"ext_mask",
		"promiscuity",
		"num_tx_queues",
		"num_rx_queues",
		"carrier",
		"phys_port_id",
		"carrier_changes"
	],

	link_attributes: {
			IFLA_UNSPEC:			0,
			IFLA_ADDRESS:			1,
			IFLA_BROADCAST:			2,
			IFLA_IFNAME:			3,
			IFLA_MTU:				4,
			IFLA_LINK:				5,
			IFLA_QDISC:				6,
			IFLA_STATS:				7,
			IFLA_COST:				8,
			IFLA_PRIORITY:			9,
			IFLA_MASTER:			10,
			IFLA_WIRELESS:			11,
			IFLA_PROTINFO:			12,
			IFLA_TXQLEN:			13,
			IFLA_MAP:				14,
			IFLA_WEIGHT:			15,
			IFLA_OPERSTATE:			16,
			IFLA_LINKMODE:			17,
			IFLA_LINKINFO:			18,
			IFLA_NET_NS_PID:		19,
			IFLA_IFALIAS:			20,
			IFLA_NUM_VF:			21,
			IFLA_VFINFO_LIST:		22,
			IFLA_STATS64:			23,
			IFLA_VF_PORTS:			24,
			IFLA_PORT_SELF:			25,
			IFLA_AF_SPEC:			26,
			IFLA_GROUP:				27,
			IFLA_NET_NS_FD:			28,
			IFLA_EXT_MASK:			29,
			IFLA_PROMISCUITY:		30,
			IFLA_NUM_TX_QUEUES:		31,
			IFLA_NUM_RX_QUEUES:		32,
			IFLA_CARRIER:			33,
			IFLA_PHYS_PORT_ID:		34,
			IFLA_CARRIER_CHANGES:	35
	},

	addr_info_attr_name_map: [
		"unspec",
		"address",
		"local",
		"label",
		"broadcast",
		"anycast",
		"cacheinfo",
		"multicast",
		"flags"
	],

	addr_attributes: {
		IFA_UNSPEC: 0,
		IFA_ADDRESS: 1,
		IFA_LOCAL: 2,
		IFA_LABEL: 3,
		IFA_BROADCAST: 4,
		IFA_ANYCAST: 5,
		IFA_CACHEINFO: 6,
		IFA_MULTICAST: 7,
		IFA_FLAGS: 8
	},

	route_info_attr_name_map: [
		"unspec",
		"dst",
		"src",
		"iif",
		"oif",
		"gateway",
		"priority",
		"prefsrc",
		"metrics",
		"multipath",
		"protoinfo",
		"flow",
		"cacheinfo",
		"session",
		"mp_algo",
		"table",
		"mark",
		"mfc_stats"
	],

	route_attributes: {
		RTA_UNSPEC: 0,
		RTA_DST: 1,
		RTA_SRC: 2,
		RTA_IIF: 3,
		RTA_OIF: 4,
		RTA_GATEWAY: 5,
		RTA_PRIORITY: 6,
		RTA_PREFSRC: 7,
		RTA_METRICS: 8,
		RTA_MULTIPATH: 9,
		RTA_PROTOINFO: 10, /* no longer used */
		RTA_FLOW: 11,
		RTA_CACHEINFO: 12,
		RTA_SESSION: 13, /* no longer used */
		RTA_MP_ALGO: 14, /* no longer used */
		RTA_TABLE: 15,
		RTA_MARK: 16,
		RTA_MFC_STATS: 17
	},

	neigh_info_attr_name_map: [
		"unspec",
		"dst",
		"lladdr",
		"cacheinfo",
		"probes",
		"vlan",
		"port",
		"vni",
		"ifindex",
		"master",
	],

	neigh_attributes: {
		NDA_UNSPEC: 0,
		NDA_DST: 1,
		NDA_LLADDR: 2,
		NDA_CACHEINFO: 3,
		NDA_PROBES: 4,
		NDA_VLAN: 5,
		NDA_PORT: 6,
		NDA_VNI: 7,
		NDA_IFINDEX: 8,
		NDA_MASTER: 9,
	},

	payload_sizes: [

		16,	//RTM_NEWLINK:
		16,	//RTM_DELLINK:
		16,	//RTM_GETLINK:
		16,	//RTM_SETLINK:
		8,	//RTM_NEWADDR:
		8,	//RTM_DELADDR:
		8,	//RTM_GETADDR:
		12,	//RTM_NEWROUTE:
		12,	//RTM_DELROUTE:
		12,	//RTM_GETROUTE:
		12,	//RTM_NEWNEIGH:
		12,	//RTM_DELNEIGH:
		12,	//RTM_GETNEIGH:

		// not confirmed the rest
		8,	//RTM_NEWRULE:
		8,	//RTM_DELRULE:
		8,	//RTM_GETRULE:
		8,	//RTM_NEWQDISC:
		8,	//RTM_DELQDISC:
		8,	//RTM_GETQDISC:
		8,	//RTM_NEWTCLASS:
		8,	//RTM_DELTCLASS:
		8,	//RTM_GETTCLASS:
		8,	//RTM_NEWTFILTER:
		8,	//RTM_DELTFILTER:
		8,	//RTM_GETTFILTER:
		8,	//RTM_NEWACTION:
		8,	//RTM_DELACTION:
		8,	//RTM_GETACTION:
		8,	//RTM_NEWPREFIX:
		8,	//RTM_GETMULTICAST:
		8,	//RTM_GETANYCAST:
		8,	//RTM_NEWNEIGHTBL:
		8,	//RTM_GETNEIGHTBL:
		8,	//RTM_SETNEIGHTBL:
		8,	//RTM_NEWNDUSEROPT:
		8,	//RTM_NEWADDRLABEL:
		8,	//RTM_DELADDRLABEL:
		8,	//RTM_GETADDRLABEL:
		8,	//RTM_GETDCB:
		8,	//RTM_SETDCB:
		8,	//RTM_NEWNETCONF:
		8,	//RTM_GETNETCONF:
		8,	//RTM_NEWMDB:
		8,	//RTM_DELMDB:
		8	//RTM_GETMDB:
	],

	rtm_types_name_map: [
		"newLink",
		"delLink",
		"getLink",
		"setLink",
		"newAddress",
		"delAddress",
		"getAddress",
		"undefined",
		"newRoute",
		"delRoute",
		"getRoute",
		"undefined",
		"newNeighbor",
		"delNeighbor",
		"getNeighbor",
		"undefined",
		"newRule",
		"delRule",
		"getRule",
		"undefined",
		"RTM_NEWQDISC",
		"RTM_DELQDISC",
		"RTM_GETQDISC",
		"undefined",
		"RTM_NEWTCLASS",
		"RTM_DELTCLASS",
		"RTM_GETTCLASS",
		"undefined",
		"RTM_NEWTFILTER",
		"RTM_DELTFILTER",
		"RTM_GETTFILTER",
		"undefined",
		"RTM_NEWACTION",
		"RTM_DELACTION",
		"RTM_GETACTION",
		"undefined",
		"RTM_NEWPREFIX",
		"undefined",
		"undefined",
		"undefined",
		"undefined",
		"undefined",
		"RTM_GETMULTICAST",
		"undefined",
		"undefined",
		"undefined",
		"RTM_GETANYCAST",
		"undefined",
		"RTM_NEWNEIGHTBL",
		"undefined",
		"RTM_GETNEIGHTBL",
		"RTM_SETNEIGHTBL",
		"RTM_NEWNDUSEROPT",
		"undefined",
		"undefined",
		"undefined",
		"RTM_NEWADDRLABEL",
		"RTM_DELADDRLABEL",
		"RTM_GETADDRLABEL",
		"undefined",
		"undefined",
		"undefined",
		"RTM_GETDCB",
		"RTM_SETDCB",
		"RTM_NEWNETCONF",
		"undefined",
		"RTM_GETNETCONF",
		"undefined",
		"RTM_NEWMDB",
		"RTM_DELMDB",
		"RTM_GETMDB"
		],

		AF_INET6: 10,
		AF_INET: 2,

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


		/* inteface types */
		ARPHRD_ETHER:	2,

		/* infomsg link device flags */
		IFF_RUNNING:	0x40,
		IFF_CHANGE:		0xFFFFFFFF,

		/* address family attributes. see linux/if_link.h */
		IFLA_ADDRESS:   1,

		/* Filter mask */
		IFLA_EXT_MASK:  0x1D,
		RTEXT_FILTER_VF:0x0001,

		/* Route Type */
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

   	    /* Route scope */
		RT_SCOPE_UNIVERSE: 0,
		RT_SCOPE_SITE: 200,
		RT_SCOPE_LINK: 253,
		RT_SCOPE_HOST: 254,
		RT_SCOPE_NOWHERE: 255,


   	    /* RTnetlink multicast groups */
		RTN_GRP_NONE: 0,
		RTN_GRP_LINK: 1,
		RTN_GRP_NOTIFY: 2,
		RTN_GRP_NEIGH: 3,
		RTN_GRP_TC: 4,
		RTN_GRP_IPV4_IFADDR: 5,
		RTN_GRP_IPV4_MROUTE: 6,
		RTN_GRP_IPV4_ROUTE: 7,
		RTN_GRP_IPV4_RULE: 8,
		RTN_GRP_IPV6_IFADDR: 9,
		RTN_GRP_IPV6_MROUTE: 10,
		RTN_GRP_IPV6_ROUTE: 11,
		RTN_GRP_IPV6_IFINFO: 12,
		RTN_GRP_DECnet_IFADDR: 13,
		RTN_GRP_NOP2: 14,
		RTN_GRP_DECnet_ROUTE: 15,
		RTN_GRP_DECnet_RULE: 16,
		RTN_GRP_NOP4: 17,
		RTN_GRP_IPV6_PREFIX: 18,
		RTN_GRP_IPV6_RULE: 19,
		RTN_GRP_ND_USEROPT: 20,
		RTN_GRP_PHONET_IFADDR: 21,
		RTN_GRP_PHONET_ROUTE: 22,
		RTN_GRP_DCB: 23,
		RTN_GRP_IPV4_NETCONF: 24,
		RTN_GRP_IPV6_NETCONF: 25,
		RTN_GRP_MDB: 26,

	make_group: function(group) {
		return (1 << (group - 1));
	},

		NLMSG_MULTI: 2,
		NLMSG_DONE: 3,

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
		RTM_NEWNEIGH: 28,
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

	getRtmTypeName: function(type) {
		return rt.rtm_types_name_map[type - this.RTM_BASE];
	},

   	// <B(_family)B(_pad1)H(_pad2)L(_ifindex)H(_state)B(_flags)B(_type)
	buildNdmsg: function(params) {
		// fam,ifindex,state,flags,typ
		var o = bufferpack.metaObject(ndmsg_fmt);
		o._family = 0;
		o._pad1 = 0;
		o._pad2 = 0;
		o._ifindex = 0;
		o._state = 0;
		o._flags = 0;
		o._type = 0;
		return o;
	},


	//<B(_family)B(_if_pad)H(_if_type)i(_if_index)I(_if_flags)I(_if_change)
	buildInfomsg: function(params) {
		var o = bufferpack.metaObject(ifinfomsg_fmt);
		o._family = 0;
		o._if_pad = 0;
		o._if_type = 0;
		o._if_index = 0;
		o._if_flags = 0;
		o._if_change = 0;
		return o;
	},


// "<B(_family)B(_dst_len)B(_src_len)B(_tos)B(_table)B(_protocol)B(_scope)B(_type)I(_flags)";
	buildRtmsg: function() {
		var o = bufferpack.metaObject(rtmsg_fmt,true);
		return o;
	},

// ifaddrmsg = "<B(_family)B(_prefix_len)B(_flags)B(_scope)I(_index)"
	buildIfaddressmsg: function() {
		var o = bufferpack.metaObject(ifaddrmsg_fmt,true);
		o._family = 0;
		o._prefix_len = 0;
		o._flags = 0;
		o._scope = 0;
		o._if_index = 0;
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
			var len = 4; // look at linux/rtnetlink.h
	        var bufs = [];
	        if(data && Buffer.isBuffer(data)) {
     			len += data.length; // the rtattr header is 4 bytes
     			bufs.push(data);
	        }
	        var rtabuf = bufferpack.pack(rtattr_fmt,[len,typ]);
	        bufs.unshift(rtabuf);
//     		len = (len + 3) & 0xFFFFFFFFFC; // must always be aligned, with a size multiple of 4 bytes
	        var pad =  ((len + 3) & 0xFFFFFFFFFC) - len;
//	        console.log("pad: " + pad);
	        if(pad) {
	        	var padbuf = new Buffer(pad);
	        	padbuf.fill(0);
	        	bufs.push(padbuf);  // make the rtattr must have length which is multiple of 4. (again see linux/rtnetlink.h)

	        }
     		return Buffer.concat(bufs);
     	}
	},

	parseRtattributes: function(data, opts) {
		var ret = {};
		//console.dir(data);

		if(!data || !Buffer.isBuffer(data) || data.length < 16) {
			return ret;
		} else {
			var total_len = data.readUInt32LE(0);
			if(total_len != data.length) {
				return ret;
			}

			var type = data.readUInt16LE(4);
			//console.error("type = " + type);
			if(type === module.exports.NLMSG_DONE) {
				return ret;
			}
			var index = 16; // start after the msghdr

			var keys, payload;
			if(this.RTM_NEWLINK <= type && type <= this.RTM_GETLINK) {
			    //console.log('LINK');
				keys = rt.link_info_attr_name_map;
				payload = bufferpack.unpack(ifinfomsg_fmt,data,index)
			} else if(this.RTM_NEWADDR <= type && type <= this.RTM_GETADDR) {
			    //console.log('ADDR');
				keys = rt.addr_info_attr_name_map;
				payload = bufferpack.unpack(ifaddrmsg_fmt,data,index)
			} else if(this.RTM_NEWROUTE <= type && type <= this.RTM_GETROUTE) {
			    //console.log('ROUTE');
				keys = rt.route_info_attr_name_map
				payload = bufferpack.unpack(rtmsg_fmt,data,index)
			} else if(this.RTM_NEWNEIGH <= type && type <= this.RTM_GETNEIGH) {
			    //console.log('NEIGH');
				keys = rt.neigh_info_attr_name_map
				payload = bufferpack.unpack(ndmsg_fmt,data,index)
			}else {
				console.warn("WARNING: ** Received unsupported message type from netlink socket(type=" + type + ") **");
				return ret;
			}

			// skip the header,header payload padding that rounds the message up to multiple of 16
			index += rt.payload_sizes[type - 16];

			// console.log('start index = ' + index);
			ret = rt.parseAttrs(data, index, total_len, keys);

			ret['payload'] = payload;
			ret['operation'] = this.getRtmTypeName(type);
		}
		return ret;
	},

	parseAttrs: function(data, attr_start, total_len, attr_map) {
		var ret = {};
		var index = attr_start;

		while(index < total_len) {
			//console.log('index = ' + index);
			var len = data.readUInt16LE(index) - 4; // attr header len == attr header + field
			var attr_type = data.readUInt16LE(index + 2);
			//console.log('attr = ' + attr_type + ' len = ' + len);

			index += 4; // index to the data
			var value;

			if(0 <= attr_type && attr_type < attr_map.length)
			{
				var key = attr_map[attr_type];
				var regExNm = /name|label/;
				if(regExNm.test(key)) {
					ret[key] = data.toString('ascii',index,index + len-1);
				} else {
					ret[key] = data.slice(index, index + len);// bytes;
				}
				// console.log('added [' + key + '] = ' + ret[key])

				// get to next attribute padding to mod 4
		        var pad =  ((len + 3) & 0xFFFFFFFFFC) - len;
		        // console.log("pad: " + pad);
				index += (len + pad);
			}
		};

		return ret;
	},

	bufToArray: function(data, index, len) {
		var bytes = [];
		var bytes_idx = 0;
		for(var idx = index; idx < index + len; idx++)
		{
			bytes[bytes_idx] = data.readUInt8(idx);
			bytes_idx += 1;
		}
		return bytes;
	}
};

module.exports = rt;
