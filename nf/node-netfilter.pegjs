/*
See: https://wiki.archlinux.org/index.php/Nftables

list
  all tables [family]
  table [family] <name>
  chain [family] [<table> <name>]
  rule  [family] [<table>] [<chain>]

add
  table [family] <name>
  chain [family] <table> <name> [chain definitions]
  rule [family] <table> <chain> <rule definition>

table [family] <name> (shortcut for `add table`)

insert
  rule [family] <table> <chain> <rule definition>

delete
  table [family] <name>
  chain [family] <table> <name>
  rule [family] <table> <handle>

flush
  table [family] <name>
  chain [family] <table> <name>
 */

{
	var nft = require('./nftables.js');
	var cmn = require('../libs/common.js');
	var bignum = require('bignum');
	var debug = cmn.logger.debug;

	var payload_len = 0;
	var command_object = {};
	command_object.params = {};
	command_object.family = "ip"; // default when not specified
}

start
	= command:command { return command_object; }

command
	= op:operation { }

operation
	=   "list" 		_   family? 		list_entity		{ command_object.command = "list"; return null;}
	/ 	"add" 		_	family? 		add_entity		{ command_object.command = "add"; }
	/ 	"table"		_	family? 		addtable_entity	{ command_object.command = "add"; }
	/ 	"insert"	_ 	family? 		insert_entity	{ command_object.command = "insert"; }
	/ 	"delete"	_	family? 		delete_entity	{ command_object.command = "delete"; }
	/ 	"flush" 	_	family? 		flush_entity	{ command_object.command = "flush"; }

list_entity
	= "all tables"
		{ command_object.type = "table"; }

	/ "table" _ table_name
		{ command_object.type = "table"; }

	/ "chain" __ chain_specifier?
		{ command_object.type = "chain"; }

	/ "rule" __ rule_specifier?
		{ command_object.type = "rule"; }

add_entity
	= "table" _ table_name
		{ command_object.type = "table"; }

	/ "chain" _ table_identifier _ chain_name _ hook_expression
		{ command_object.type = "chain"; }

	/ "rule" _ table_identifier _ chain_identifier _ rule_expression
		{ command_object.type = "rule"; }

addtable_entity
	= table_name
		{ command_object.type = "table"; }

insert_entity
	= "rule" _ table_identifier _ chain_identifier _ rule_position _ rule_expression
		{ command_object.type = "rule"; }

delete_entity
	= "table" _ table_name
		{ command_object.type = "table"; }

	/ "chain" _ table_identifier _ chain_name
		{ command_object.type = "chain"; }

	/ "rule" _ rule_handle
		{ command_object.type = "rule"; }

flush_entity
	= "table" _ table_name
		{ command_object.type = "table"; }

	/ "chain" _ table_identifier _ chain_name
		{ command_object.type = "chain"; }


family
	= family:("ip" "6"?) __
		{
			command_object.family = family.join("");
		}

chain_name
	= ch:chain { command_object.params.name = ch; }

chain_identifier
	= ch:chain { command_object.params.chain = ch; }

table_name
	= ta:table { command_object.params.name = ta; }

table_identifier
	= ta:table { command_object.params.table = ta; }

chain_specifier
	= __ table_identifier __ chain_name

rule_specifier
	= __ table_identifier __ chain_identifier?

rule_expression
	= rd:rule_definition? ct:connection_track? lgst:log_stmt? act:action?
		{

			var exprs = [];
			var parms = {};

			if(rd != undefined) {

				if(rd.protocol != undefined) {
					exprs.push(rd.protocol[0]);
					exprs.push(rd.protocol[1]);
				}

				for ( var i = 0; i < rd.criteria.length; i++ )
				{
					var fld = rd.criteria[i].field;
					var val = rd.criteria[i].value;

					exprs.push(fld);

					if(val.type === 'address') {
						exprs.push(val.value[1]); // mask as bitwise
						exprs.push(val.value[0]); // address as value
					} else if(val.type === 'number') {
						exprs.push(val.value[0]); // the value
					}
				}
			}

			if(ct != undefined) {
				for(var connection_track in ct) {
					exprs.push(ct[connection_track]);
				}
			}

			if(lgst != undefined) exprs.push(lgst);
			if(act != undefined) exprs.push(act);
			command_object.params.expressions = exprs;
		}

rule_definition
	= pt:protocol? ctr:(rule_criteria)+
		{ return { protocol:pt, criteria: ctr }; }

rule_position
	= "position" _ p:( hex / decimal )
		{
			command_object.params.position = '0x' + p.toString(16);
		}

rule_criteria
	= fd:field vl:value
		{
			return { field : fd , value : vl };
		}

rule_handle
	= rh:( hex / decimal ) { command_object.params.handle = '0x' + rh.toString(16); }

hook_expression          //{ type filter hook input priority 0 }
	= "{" __ "type" _ ht:hooktype _ "hook" _ hn:hooknum _ "priority" _ hp:hookprio __ "}"
		{
			command_object.type = ht;
			command_object.params.hook = {};
			command_object.params.hook.hooknum = hn;
			command_object.params.hook.priority = hp;
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
	= ta:[a-zA-Z]+
		{
			return ta.join("");
		}

chain
	= chain:[a-zA-Z]+
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
	= addr:ipv6addr cd:cidr? _
		{
			return {
				type: "address",
				value: [ addr,	cd ]
			};
		}

ipv4
	= addr:ipv4addr cd:cidr? _
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

// see: include/linux/netfilter/nf_conntrack_common
connection_track
	= "ct" _ op:nft_ct_key
		{
	        var retval = [
	            {
	            elem:
	            {
					name: "ct",
					data: {
						KEY: 		0, //op.key,
						//DIRECTION: 	1, //op.state,
						//SREG:      	1
						DREG:       1
	                }
				}},

				{
	            elem:
	            {
					name: "bitwise",
					data: {
						SREG: 		nft.nft_registers.NFT_REG_1,
						DREG:		nft.nft_registers.NFT_REG_1,
						LEN: 		4,
						MASK: 		{ VALUE: "0x08000000" },
						XOR: 		{ VALUE: "0x00000000" }
	                }
				}},

				{
	            elem:
	            {
					name: "cmp",
					data: {
						SREG: 		nft.nft_registers.NFT_REG_1,
						OP:			nft.nft_cmp_ops.NFT_CMP_NEQ,
						DATA: 		{ VALUE: "0x00000000" }
	                }
				}}

			];

			// DREG: 		0,
			// DIRECTION: 	2,
			// SREG: 		3,
			// if(pfx != null) retval.elem.data.PREFIX = pfx;

			return retval;
		}


nft_ct_key
	= "state" _ st:ct_state	_
		{ return ;
		}
	/ "direction" _ dir:ct_direction	{ return dir; }
	/ "status"							{ return 2; }
	/ "mark"							{ return 3; }
	/ "secmark"							{ return 4; }
	/ "expiration"						{ return 5; }
	/ "helper"							{ return 6; }
	/ "l3protocol"						{ return 7; }
	/ "src"								{ return 8; }
	/ "dst"								{ return 9; }
	/ "protocol"						{ return 10; }
	/ "proto_src"						{ return 11; }
	/ "proto_dst"						{ return 12; }
	/ "labels"							{ return 13; }

ct_state
	= "established"					 	{ return 0x02000000; }
	/ "related"							{ return 0x04000000; }
	/ "new"								{ return 0x08000000; }
	/ "isreply"							{ return 3; }

ct_direction
	= "original"	{ return 0; }
	/ "reply"		{ return 1; }

log_stmt
	= "log" __ pfx:log_prefix? __ grp:log_group? __ snp:log_snaplen?
			__ thr:log_qthreshold? __ lvl:log_level? __ flgs:log_flags? __
		{
	        var retval = {
	            elem:
	            {
					name: "log",
					data: {
						GROUP: 		(grp === null) ? 0 : grp,
	                }
				}
			};

			if(pfx != null) retval.elem.data.PREFIX = pfx;
			if(snp != null) retval.elem.data.SNAPLEN = snp;
			if(thr != null) retval.elem.data.QTHRESHOLD = thr;
			if(lvl != null) retval.elem.data.LEVEL = lvl;
			if(flgs != null) retval.elem.data.FLAGS = flgs;

			return retval;
		}

log_prefix
	= "prefix" _ '"'str:string'"'
		{ return str; }

log_group
	= "group" _ d:decimal
		{ return d.toNumber(); }

log_snaplen
	= "snaplen" _ d:decimal
		{ return d.toNumber(); }

log_qthreshold
	= "qthreshold" _ d:decimal
		{ return d.toNumber(); }

log_level
	= "level" _ d:decimal
		{ return d.toNumber(); }

log_flags
	= "flags" _ d:decimal
		{ return d.toNumber(); }

protocol
	= prot:( tcp / udp ) _
		{ debug("protocol");
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
		{debug("network field");
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
		{debug("transport field");
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
		{debug("number");
		var prepend = "";
		var numstr = '0x' + num.toString(16);
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
								DATA: 		{ VALUE: numstr } // 0x0016 = 22 - ssh protocol
			                }
						}
					}
				]
			};
		}

ipv6addr
	= quads:quads
		{ debug("ipv6addr");
			if(command_object.family !== 'ip6') throw new Error("family != ip6 when ipv6 address specified")
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
		{  debug("ipv4addr");
			if(command_object.family !== 'ip') throw new Error("family != ip when ip address specified")
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
		{   debug("cidr")
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
	= nibbles:("0x" [0-9a-fA-F]+) { return bignum(nibbles[1].join(""), 16); }

decimal
	= digits:[0-9]+ { return bignum(digits.join(""), 10); }

string
	= str:([ 0-9a-zA-Z])+ { return str.join(""); }
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
		if(command_object.family === 'ip'){
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
		if(command_object.family === 'ip'){
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
