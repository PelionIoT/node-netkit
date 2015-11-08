//add rule ip filter input tcp dport 22 saddr 192.168.1.0/24 accept
//add rule ip filter input tcp dport 22 drop
//list table filter
//list chain table

{
	var nft = require('./nftables.js');
	var cmn = require('../libs/common.js');
	var ipfamily = "ip" // default family
	var payload_len = 0;
}

start
	= command:command { return command; }

command
	= op:operation fm:family? ce:command_expression
		{
			var cmd = {};
			cmd.command = op;
			cmd.type = ce.ty;
			cmd.family = ipfamily || fm;
			if(ce.ex != null)
				cmd.params = ce.ex;
			return cmd;
		}

operation
	= op:("add" / "del" / "list" / "get" / "flush") _ { return op; }

family
	= family:("ip6" / "ip") _
		{
			cmn.dbg("family : " + familiy);
			return family;
		}

// expand here with table and chain
command_expression
	= "table" _ tb:table_expression
		{
			return { ty: "table", ex:tb };
		}
	/ "chain" _  ch:hook_expression
		{
			return { ty: "chain", ex: ch };
		}
	/ "rule" __ ru:rule_expression?
		{
			if(typeof(ru) === 'undefined') {
				return {
					ty: "rule"
				};
			} else {
				return {
					ty: "rule", ex: ru
				};
			}
		}
	// / "expr" _ ex:expr_expression
	// 	{
	// 		throw new Error("Expression not implemented: " + ex);
	// 		return { tex: "expr", ex: ex };
	// 	}
	// / "set" _ ex:set_expression
	// 	{
	// 		throw new Error("Expression not implemented: " + ex);
	// 		return { tex: "set", ex: set };
	// 	}
	// / "setelem" _ ste:setelem_expression
	// 	{
	// 		throw new Error("Expression not implemented: " + ex);
	// 		return { tex: "setelem", ex: ste };
	// 	}
	// / "monitor" _ mn:monitor_expression
	// 	{
	// 		throw new Error("Expression not implemented: " + ex);
	// 		return { ty: "monitor", ex: mn };
	// 	}
	// / "export" _ exp:export_expression
	// 	{
	// 		throw new Error("Expression not implemented: " + ex);
	// 		return { ty: "export", ex: exp };
	// 	}

// // expand here with table and chain expressions
// command_expression
// 	= ce:( hook_expression / rule_expression / table_expression ) { return ce; }

rule_expression
	= tb:table ch:chain pt:protocol ctr:(rule_criteria)+ act:action
		{
			var exprs = [];
			var parms = {};

			exprs.push(pt[0]);
			exprs.push(pt[1]);

			for ( var i = 0; i < ctr.length; i++ )
			{
				var fld = ctr[i].field;
				var val = ctr[i].value;

				exprs.push(fld);

				if(val.type === 'address') {
					exprs.push(val.value[1]); // mask as bitwise
					exprs.push(val.value[0]); // address as value
				} else if(val.type === 'number') {
					exprs.push(val.value[0]); // the value
				}
			}

			exprs.push(act);
			parms.expressions = exprs;

			parms.table = tb;
			parms.chain = ch;

			return parms;
		}

table_expression
	= ta:table
		{
			return { name: ta };
		}

rule_criteria
	= fd:field vl:value
		{
			// console.dir(protocol);
			// console.dir(field);
			// console.dir(value);
			return { field : fd , value : vl };
		}

hook_expression          //{ type filter hook input priority 0 }
	= tb:table ch:chain "{" __ "type" _ ht:hooktype _ "hook" _ hn:hooknum _ "priority" _ hp:hookprio __ "}"
		{
			var parms = {};
			parms.table = tb;
			parms.name = ch;
			parms.type = ht;

			parms.hook = {};
			parms.hook.hooknum = hn;
			parms.hook.priority = hp;

			return parms;
		}

hooktype
	= "filter" / "route" / "nat"

hooknum
	= 	"prerouting"  	{ return 0; }
	/	"input" 		{ return 1; }
	/	"forward" 		{ return 2; }
	/	"output" 		{ return 3; }
	/	"postrouting"	{ return 4; }

hookprio
	= pr:[0-9]+ { return pr.join(""); }

table
	= ta:[a-zA-Z]+ __
		{
			return ta.join("");
		}

chain
	= chain:[a-zA-Z]+ _?
		{
			return chain.join("");
		}

action
	= drop / accept

value
	= val:( number / address) { return val; }

address
	= ip:( ipv4 / ipv6 ) {
		return ip;
	}


ipv6
	= addr:ipv6addr cd:cidr _
		{
			return {
				type: "address",
				value: [ addr,	cd ]
			};
		}

ipv4
	= addr:ipv4addr cd:cidr _
		{
			return {
				type: "address",
				value: [ addr,	cd ]
			};
		}

drop
	= "drop"
		{
	        return {
	            elem:
	            {
					name: "immediate",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_VERDICT,
						DATA: 		{ VERDICT: { CODE: 0x00000000 } }
	                }
				}
			};
		}

accept
	= "accept"
		{
	        return {
	            elem:
	            {
					name: "immediate",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_VERDICT,
						DATA: 		{ VERDICT: { CODE: 0x00000001 } }
	                }
				}
			};
		}

protocol
	= prot:( tcp / udp ) _
		{ cmn.dbg("protocol");
			return [
			{
				elem:
				{
					name: "payload",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_1,
						BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
						OFFSET: 	nft.iphdr_offsets.protocol,
						LEN: 		nft.iphdr_sizes.protocol
	                }
	            }
	        },
	        {
	            elem:
	            {
					name: "cmp",
					data: {
						SREG: 		nft.nft_registers.NFT_REG_1,
						OP:			nft.nft_cmp_ops.NFT_CMP_EQ,
						DATA: 		{ VALUE: prot } //nft.ip_proto.IPPROTO_TCP
	                }
				}
			}];

			return prot;
		}

field
 	= hd:(transport_header / network_header)
 		{
 			return hd;
 		}

network_header
	= field:( saddr / daddr ) _
		{cmn.dbg("network field");
			payload_len = field.len;
			return {
				elem:
				{
					name: "payload",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_1,
						BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
						OFFSET: 	field.offset,
						LEN:		field.len
	                }
	            }
	        };
		}

transport_header
	= field:( ipprotocol / dport ) _
		{cmn.dbg("transport field");
			payload_len = field.len;
			return {
				elem:
				{
					name: "payload",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_1,
						BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_TRANSPORT_HEADER,
						OFFSET: 	field.offset,
						LEN:		field.len
	                }
	            }
	        };
		}

number
	= num:(hex / decimal) _
		{cmn.dbg("number");
		var prepend = "";
		var numstr = num.toString(16);
		var pad = payload_len * 2;
		while(numstr.length < pad) numstr = "0".concat(numstr);

		payload_len
	        return {
	        	type: "number",
	        	value : [
			        {
			            elem:
			            {
							name: "cmp",
							data: {
								SREG: 		nft.nft_registers.NFT_REG_1,
								OP: 		nft.nft_cmp_ops.NFT_CMP_EQ,
								DATA: 		{ VALUE: "0x" + numstr } // 0x0016 = 22 - ssh protocol
			                }
						}
					}
				]
			};
		}

ipv6addr
	= quads:quads
		{ cmn.dbg("ipv6addr");
			if(ipfamily !== 'ip6') throw new Error("family != ip6 when ipv6 address detected")
			return {
	            elem:
	            {
					name: "cmp",
					data: {
						SREG: 		nft.nft_registers.NFT_REG_1,
						OP: 		nft.nft_cmp_ops.NFT_CMP_EQ,
						DATA: 		{
										// overkill but throws for bad hex val
										VALUE: "0x" + quads
									} // C0A83800 = 192.168.56.0
	                }
				}
			};
		}

ipv4addr
	= octets:octets
		{  cmn.dbg("ipv4addr");
			if(ipfamily !== 'ip') throw new Error("family != ip when ip address detected")
			var addr = new Buffer(4);
			addr.writeUInt8( parseInt(octets[0], 10), 0);
			addr.writeUInt8( parseInt(octets[1], 10), 1);
			addr.writeUInt8( parseInt(octets[2], 10), 2);
			addr.writeUInt8( parseInt(octets[3], 10), 3);
			return {
	            elem:
	            {
					name: "cmp",
					data: {
						SREG: 		nft.nft_registers.NFT_REG_1,
						OP: 		nft.nft_cmp_ops.NFT_CMP_EQ,
						DATA: 		{
										// overkill but throws for bad hex val
										VALUE: "0x" + addr.toString('hex')
									} // C0A83800 = 192.168.56.0
	                }
				}
			};
		}

cidr
	= cidr:(ipv4cidr / ipv6cidr)
		{   cmn.dbg("cidr")
			return {
	            elem:
	            {
					name: "bitwise",
					data: {
						SREG: 		nft.nft_registers.NFT_REG_1,
						DREG:		nft.nft_registers.NFT_REG_1,
						LEN: 		cidr.len,
						MASK: 		{ VALUE: "0x" + cidr.val },
						XOR: 		{ VALUE: "0x00000000" }
	                }
				}
			}
		}

ipv6cidr
	= "/" cd:([0-9][0-9]?[0-9]?)
		{
			var cidrv  = parseInt(cd.join(""), 10);
			return {
				val: cmn.maskFromCidr(cidrv, 'inet6'),
				len: 16
			};
		}

ipv4cidr
	= "/" cd:([0-9][0-9]?)
		{
			var cidrv  = parseInt(cd.join(""), 10);
			return {
				val: cmn.maskFromCidr(cidrv, 'inet'),
				len: 4
			};
		}

octets
	= oct1:([0-9]+) "." oct2:([0-9]+) "." oct3:([0-9]+) "." oct4:([0-9]+)
		{
			return [ oct1.join(""), oct2.join(""), oct3.join(""), oct4.join("") ];
		}

quads
	= st:startquad? nx:nextequad*
		{
			var buf = new Buffer(16);
			buf.fill(0);
			var sindex = 0;
			var written = 0;

			if(st != undefined) {
				var val = parseInt(st, 16);
				buf.writeUInt16BE(val, sindex, 2);
				written++;
				sindex += 2;
			}

			for(var i = 0; i < nx.length; i++) {
				if(nx[i].skip == true) {
					sindex = (8 - (nx.length - written + 1)) * 2;
				}
				val = parseInt(nx[i].val, 16);
				buf.writeUInt16BE(val, sindex, 2);
				sindex += 2;
				written++;
			}

			return buf.toString('hex');
		}

startquad
	= q:([0-9a-fA-F]+)? { val: return q.join(""); }

nextequad
	= q:(contquad / skipequad) { return q; }

contquad
	= ":"  q:[0-9a-fA-F]+ { return { skip: false, val: q.join("") }; }

skipequad
	= "::" q:[0-9a-fA-F]+ { return { skip: true, val: q.join("") }; }

hex
	= nibbles:("0x" [0-9a-fA-F]+) { return parseInt(nibbles.join(""), 16); }

decimal
	= digits:[0-9]+ { return parseInt(digits.join(""), 10); }
_
	= ([ \t])+

__
	= ([ \t])*

// Protocols
tcp
	= "tcp" { return "0x06"; }
udp
	= "udp" { return "0x11"; }

// IP header
ipprotocol
	= "prot"
	{
		return {
			offset: 	nft.iphdr_offsets.protocol,
			len:		nft.iphdr_sizes.protocol
		};
	}

saddr
	= "saddr"
	{
		if(ipfamily === 'ip'){
			return {
				offset: 	nft.iphdr_offsets.saddr,
				len:		nft.iphdr_sizes.saddr
			};
		} else {
			return {
				offset: 	nft.ipv6hdr_offsets.saddr,
				len:		nft.ipv6hdr_sizes.saddr
			};
		}
	}
daddr
	= "daddr"
	{
		if(ipfamily === 'ip'){
			return {
				offset: 	nft.iphdr_offsets.daddr,
				len:		nft.iphdr_sizes.daddr
			};
		} else {
			return {
				offset: 	nft.ipv6hdr_offsets.daddr,
				len:		nft.ipv6hdr_sizes.daddr
			};
		}
	}

// TCP header
dport
	= "dport"
	{
		return {
			offset: 	nft.tcphdr_offsets.dest,
			len:		nft.tcphdr_sizes.dest
		};
	}

sport
	= "sport"
	{
		return {
			offset: 	nft.tcphdr_offsets.source,
			len:		nft.tcphdr_sizes.source
		};
	}
