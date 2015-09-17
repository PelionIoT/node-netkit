nft = {



	/*
	* Standard well-defined IP protocols.
	* include/uapi/linux/in.h
	*/
	ip_proto: {
	  IPPROTO_IP:  0,		/* Dummy protocol for TCP		*/
	  IPPROTO_ICMP:  1,		/* Internet Control Message Protocol	*/
	  IPPROTO_IGMP:  2,		/* Internet Group Management Protocol	*/
	  IPPROTO_IPIP:  4,		/* IPIP tunnels (older KA9Q tunnels use 94) */
	  IPPROTO_TCP:  6,		/* Transmission Control Protocol	*/
	  IPPROTO_EGP:  8,		/* Exterior Gateway Protocol		*/
	  IPPROTO_PUP:  12,		/* PUP protocol				*/
	  IPPROTO_UDP:  17,		/* User Datagram Protocol		*/
	  IPPROTO_IDP:  22,		/* XNS IDP protocol			*/
	  IPPROTO_TP:  29,		/* SO Transport Protocol Class 4	*/
	  IPPROTO_DCCP:  33,		/* Datagram Congestion Control Protocol */
	  IPPROTO_IPV6:  41,		/* IPv6-in-IPv4 tunnelling		*/
	  IPPROTO_RSVP:  46,		/* RSVP Protocol			*/
	  IPPROTO_GRE:  47,		/* Cisco GRE tunnels (rfc 1701,1702)	*/
	  IPPROTO_ESP:  50,		/* Encapsulation Security Payload protocol */
	  IPPROTO_AH:  51,		/* Authentication Header protocol	*/
	  IPPROTO_MTP:  92,		/* Multicast Transport Protocol		*/
	  IPPROTO_BEETPH:  94,		/* IP option pseudo header for BEET	*/
	  IPPROTO_ENCAP:  98,		/* Encapsulation Header			*/
	  IPPROTO_PIM:  103,		/* Protocol Independent Multicast	*/
	  IPPROTO_COMP:  108,		/* Compression Header Protocol		*/
	  IPPROTO_SCTP:  132,		/* Stream Control Transport Protocol	*/
	  IPPROTO_UDPLITE:  136,	/* UDP-Lite (RFC 3828)			*/
	  IPPROTO_RAW:  255,		/* Raw IP packets			*/
	},


	/*
	* iphdr structure definitions from -  include/uapi/linux/ip.h
		struct iphdr {
			 #if defined(__LITTLE_ENDIAN_BITFIELD)
			         __u8    ihl:4,
			                 version:4;
			 #elif defined (__BIG_ENDIAN_BITFIELD)
			         __u8    version:4,
			                 ihl:4;
			 #else
			 #error  "Please fix <asm/byteorder.h>"
			 #endif
			         __u8    tos;
			         __u16   tot_len;
			         __u16   id;
			         __u16   frag_off;
			         __u8    ttl;
			         __u8    protocol;
			         __u16   check;
			         __u32   saddr;
			         __u32   daddr;
			 };
	*/
	iphdr_offsets: {
		version_ihl: 	0,
		tos: 			1,
		tot_len: 		2,
		id: 			4,
		frag_off: 		6,
		ttl: 			8,
		protocol: 		9,
		check: 			10,
		saddr: 			12,
		daddr: 			16,
		/*The options start here. */
	},

	iphdr_sizes: {
		version_ihl: 	1,
		tos: 			1,
		tot_len: 		2,
		id: 			2,
		frag_off: 		2,
		ttl: 			1,
		protocol: 		1,
		check: 			2,
		saddr: 			4,
		daddr: 			4,
		/*The options start here. */
	},


	/*
	* iphdr structure definitions from -  include/uapi/linux/ipv6.h
		*
		*	IPv6 fixed header
		*
		*	BEWARE, it is incorrect. The first 4 bits of flow_lbl
		*	are glued to priority now, forming "class".
		*

	NOTE!!!   need to resolve descrepancies between this and ietf docs: https://www.ietf.org/rfc/rfc2460.txt

		struct ipv6hdr {
		#if defined(__LITTLE_ENDIAN_BITFIELD)
			__u8			priority:4,
						version:4;
		#elif defined(__BIG_ENDIAN_BITFIELD)
			__u8			version:4,
						priority:4;
		#else
		#error	"Please fix <asm/byteorder.h>"
		#endif
			__u8			flow_lbl[3];

			__be16			payload_len;
			__u8			nexthdr;
			__u8			hop_limit;

			struct	in6_addr	saddr;
			struct	in6_addr	daddr;
		};
	*/
	ipv6hdr_offsets: {
		prio_version: 	0,
		flow_lbl:		1,
		payload_len:	4,
		nexthdr:		6,
		hop_limit: 		7,
		saddr: 			8,
		daddr: 			16
	},

	ipv6hdr_sizes: {
		prio_version: 	1,
		flow_lbl:		3,  // hack to achieve alignment.  ned better way to specify field sizes in bits
		payload_len:	2,
		nexthdr:		1,
		hop_limit: 		1,
		saddr: 			8,
		daddr: 			8
	},


	/*
	* tcphdr structure definitions from -  include/uapi/linux/tcp.h
	*/
	tcphdr_offsets: {
		source: 	0,
		dest: 		2,
		seq: 		4,
		ack_seq: 	8,
		offset_flag:12,
		window: 	14,
		check: 		16,
		urg_ptr: 	18,
	},

	tcphdr_sizes: {
		source: 	2,
		dest: 		2,
		seq: 		4,
		ack_seq: 	4,
		offset_flag:2,
		window: 	2,
		check: 		2,
		urg_ptr: 	2,
	},

	/*
	* nft register defines
	*/
	nft_registers: {
		NFT_REG_VERDICT: 	0,
		NFT_REG_1: 			1,
		NFT_REG_2: 			2,
		NFT_REG_3: 			3,
		NFT_REG_4: 			4,
	},

	/**
	 * enum nft_verdicts - nf_tables internal verdicts
	 *
	 * @NFT_CONTINUE: continue evaluation of the current rule
	 * @NFT_BREAK: terminate evaluation of the current rule
	 * @NFT_JUMP: push the current chain on the jump stack and jump to a chain
	 * @NFT_GOTO: jump to a chain without pushing the current chain on the jump stack
	 * @NFT_RETURN: return to the topmost chain on the jump stack
	 *
	 * The nf_tables verdicts share their numeric space with the netfilter verdicts.
	 */
	nft_verdicts: {
		NFT_CONTINUE: 	-1,
		NFT_BREAK: 		-2,
		NFT_JUMP:		-3,
		NFT_GOTO: 		-4,
		NFT_RETURN: 	-5,
	},


	/* @NFT_PAYLOAD_LL_HEADER: link layer header
  	* @NFT_PAYLOAD_NETWORK_HEADER: network header
  	* @NFT_PAYLOAD_TRANSPORT_HEADER: transport header
	*/
	nft_payload_bases: {
		NFT_PAYLOAD_LL_HEADER: 0,
		NFT_PAYLOAD_NETWORK_HEADER: 1,
		NFT_PAYLOAD_TRANSPORT_HEADER: 2,
	},

	/**
	 * enum nft_cmp_ops - nf_tables relational operator
	 *
	 * @NFT_CMP_EQ: equal
	 * @NFT_CMP_NEQ: not equal
	 * @NFT_CMP_LT: less than
	 * @NFT_CMP_LTE: less than or equal to
	 * @NFT_CMP_GT: greater than
	 * @NFT_CMP_GTE: greater than or equal to
	 */
	nft_cmp_ops: {
		NFT_CMP_EQ: 	0,
		NFT_CMP_NEQ: 	1,
		NFT_CMP_LT: 	2,
		NFT_CMP_LTE: 	3,
		NFT_CMP_GT: 	4,
		NFT_CMP_GTE: 	5,
	},


	/**
	 * enum nft_hook_attributes - nf_tables netfilter hook netlink attributes
	 *
	 * @NFTA_HOOK_HOOKNUM: netfilter hook number (NLA_U32)
	 * @NFTA_HOOK_PRIORITY: netfilter hook priority (NLA_U32)
	 */
	nft_hook_attributes: {
		NFTA_HOOK_UNSPEC: 		0,
		NFTA_HOOK_HOOKNUM: 		1,
		NFTA_HOOK_PRIORITY: 	2,
		NFTA_HOOK_SPEC: 		['','n/32','n/32']
	},

	/**
	 * enum nft_table_flags - nf_tables table flags
	 *
	 * @NFT_TABLE_F_DORMANT: this table is not active
	 */
	nft_table_flags: {
		NFT_TABLE_F_DORMANT:  0x1,
	},


	/* ------------------------------------------------------------------------
	*
	*	NFT atrributes section
	*
	*	SPEC values: 	s = string,
	* 					n/<x> = number/size in bytes
	*					r = recursion (nested attribute object)
	*					l = list of attribute objects
	*					e = expression object: with the attibute object in the data element
	*										and the element's attribute object type in the name
	*
	*  ------------------------------------------------------------------------  */


	/**
	 * enum nft_table_attributes - nf_tables table netlink attributes
	 *
	 * @NFTA_TABLE_NAME: name of the table (NLA_STRING)
	 * @NFTA_TABLE_FLAGS: bitmask of enum nft_table_flags (NLA_U32)
	 * @NFTA_TABLE_USE: number of chains in this table (NLA_U32)
	 */
	nft_table_attributes: {
		NFTA_TABLE_UNSPEC: 		0,
		NFTA_TABLE_NAME: 		1,
		NFTA_TABLE_FLAGS: 		2,
		NFTA_TABLE_USE: 		3,
		NFTA_TABLE_SPEC:		['','s','n/32','n/32']
	},

	/**
	 * enum nft_chain_attributes - nf_tables chain netlink attributes
	 *
	 * @NFTA_CHAIN_TABLE: name of the table containing the chain (NLA_STRING)
	 * @NFTA_CHAIN_HANDLE: numeric handle of the chain (NLA_U64)
	 * @NFTA_CHAIN_NAME: name of the chain (NLA_STRING)
	 * @NFTA_CHAIN_HOOK: hook specification for basechains (NLA_NESTED: nft_hook_attributes)
	 * @NFTA_CHAIN_POLICY: numeric policy of the chain (NLA_U32)
	 * @NFTA_CHAIN_USE: number of references to this chain (NLA_U32)
	 * @NFTA_CHAIN_TYPE: type name of the string (NLA_NUL_STRING)
	 * @NFTA_CHAIN_COUNTERS: counter specification of the chain (NLA_NESTED: nft_counter_attributes)
	 */
	nft_chain_attributes: {
		NFTA_CHAIN_UNSPEC: 		0,
		NFTA_CHAIN_TABLE: 		1,
		NFTA_CHAIN_HANDLE: 		2,
		NFTA_CHAIN_NAME: 		3,
		NFTA_CHAIN_HOOK: 		4,
		NFTA_CHAIN_POLICY: 		5,
		NFTA_CHAIN_USE: 		6,
		NFTA_CHAIN_TYPE: 		7,
		NFTA_CHAIN_COUNTERS: 	8,
		NFTA_CHAIN_SPEC: 		['','s','n/64','s','r/nft_hook_attributes','n/32','n/32','s','r/nft_counter_attributes']
	},

	/**
	 * enum nft_rule_attributes - nf_tables rule netlink attributes
	 *
	 * @NFTA_RULE_TABLE: name of the table containing the rule (NLA_STRING)
	 * @NFTA_RULE_CHAIN: name of the chain containing the rule (NLA_STRING)
	 * @NFTA_RULE_HANDLE: numeric handle of the rule (NLA_U64)
	 * @NFTA_RULE_EXPRESSIONS: list of expressions (NLA_NESTED: nft_expr_attributes)
	 * @NFTA_RULE_COMPAT: compatibility specifications of the rule (NLA_NESTED: nft_rule_compat_attributes)
	 * @NFTA_RULE_POSITION: numeric handle of the previous rule (NLA_U64)
	 * @NFTA_RULE_USERDATA: user data (NLA_BINARY, NFT_USERDATA_MAXLEN)
	 */
	nft_rule_attributes: {
		NFTA_RULE_UNSPEC: 		0,
		NFTA_RULE_TABLE: 		1,
		NFTA_RULE_CHAIN: 		2,
		NFTA_RULE_HANDLE: 		3,
		NFTA_RULE_EXPRESSIONS: 	4,
		NFTA_RULE_COMPAT: 		5,
		NFTA_RULE_POSITION: 	6,
		NFTA_RULE_USERDATA: 	7,
		NFTA_RULE_SPEC: 		['','s','s','n/64','l/nft_list_attributes','r/nft_rule_compat_attributes','n/64','b']
	},

	/**
	 * enum nft_list_attributes - nf_tables generic list netlink attributes
	 *
	 * @NFTA_LIST_ELEM: list element (NLA_NESTED)
	 */
	nft_list_attributes:  {
		NFTA_LIST_UNPEC: 	0,
		NFTA_LIST_ELEM: 	1,
		NFTA_LIST_SPEC: 	['','r/nft_expr_attributes'],
	},

	/**
	 * enum nft_expr_attributes - nf_tables expression netlink attributes
	 *
	 * @NFTA_EXPR_NAME: name of the expression type (NLA_STRING)
	 * @NFTA_EXPR_DATA: type specific data (NLA_NESTED)
	 */
	nft_expr_attributes: {
		NFTA_EXPR_UNSPEC: 	0,
		NFTA_EXPR_NAME: 	1,
		NFTA_EXPR_DATA: 	2,
		NFTA_EXPR_SPEC: 	['','s','e'],
	},

	/**
	 * enum nft_rule_compat_flags - nf_tables rule compat flags
	 *
	 * @NFT_RULE_COMPAT_F_INV: invert the check result
	 */
	nft_rule_compat_flags:  {
		NFT_RULE_COMPAT_F_INV: 			(1 << 1),
		NFT_RULE_COMPAT_F_MASK: 		(1 << 1),
	},

	/**
	 * enum nft_rule_compat_attributes - nf_tables rule compat attributes
	 *
	 * @NFTA_RULE_COMPAT_PROTO: numerice value of handled protocol (NLA_U32)
	 * @NFTA_RULE_COMPAT_FLAGS: bitmask of enum nft_rule_compat_flags (NLA_U32)
	 */
	nft_rule_compat_attributes: {
		NFTA_RULE_COMPAT_UNSPEC: 		0,
		NFTA_RULE_COMPAT_PROTO: 		1,
		NFTA_RULE_COMPAT_FLAGS: 		2,
	},

	/**
	 * enum nft_cmp_attributes - nf_tables cmp expression netlink attributes
	 *
	 * @NFTA_CMP_SREG: source register of data to compare (NLA_U32: nft_registers)
	 * @NFTA_CMP_OP: cmp operation (NLA_U32: nft_cmp_ops)
	 * @NFTA_CMP_DATA: data to compare against (NLA_NESTED: nft_data_attributes)
	 */
	nft_cmp_attributes: {
		NFTA_CMP_UNSPEC: 	0,
		NFTA_CMP_SREG: 		1,
		NFTA_CMP_OP: 		2,
		NFTA_CMP_DATA: 		3,

		//NFTA_CMP_SPEC: 		['','n/32','n/32','n/32', 'n/32']
		NFTA_CMP_SPEC: 		['','n/32','n/32','r/nft_data_attributes']
	},

	/**
	 * enum nft_counter_attributes - nf_tables counter expression netlink attributes
	 *
	 * @NFTA_COUNTER_BYTES: number of bytes (NLA_U64)
	 * @NFTA_COUNTER_PACKETS: number of packets (NLA_U64)
	 */
	nft_counter_attributes: {
		NFTA_COUNTER_UNSPEC: 	0,
		NFTA_COUNTER_BYTES: 	1,
		NFTA_COUNTER_PACKETS: 	2,
		NFTA_COUNTER_SPEC: 		['','n/64','n/64']

	},

	/**
	 * enum nft_payload_attributes - nf_tables payload expression netlink attributes
	 *
	 * @NFTA_PAYLOAD_DREG: destination register to load data into (NLA_U32: nft_registers)
	 * @NFTA_PAYLOAD_BASE: payload base (NLA_U32: nft_payload_bases)
	 * @NFTA_PAYLOAD_OFFSET: payload offset relative to base (NLA_U32)
	 * @NFTA_PAYLOAD_LEN: payload length (NLA_U32)
	 */
	nft_payload_attributes: {
		NFTA_PAYLOAD_UNSPEC: 	0,
		NFTA_PAYLOAD_DREG: 		1,
		NFTA_PAYLOAD_BASE: 		2,
		NFTA_PAYLOAD_OFFSET: 	3,
		NFTA_PAYLOAD_LEN: 		4,
		NFTA_PAYLOAD_SPEC: 		['','n/32','n/32','n/32','n/32']
	},


	/**
	 * enum nft_data_attributes - nf_tables data netlink attributes
	 *
	 * @NFTA_DATA_VALUE: generic data (NLA_BINARY)
	 * @NFTA_DATA_VERDICT: nf_tables verdict (NLA_NESTED: nft_verdict_attributes)
	 */
	nft_data_attributes: {
		NFTA_DATA_UNSPEC: 	0,
		NFTA_DATA_VALUE: 	1,
		NFTA_DATA_VERDICT: 	2,
		NFTA_DATA_SPEC: 	['','g','r/nft_verdict_attributes']
	},

	/**
	 * enum nft_bitwise_attributes - nf_tables bitwise expression netlink attributes
	 *
	 * @NFTA_BITWISE_SREG: source register (NLA_U32: nft_registers)
	 * @NFTA_BITWISE_DREG: destination register (NLA_U32: nft_registers)
	 * @NFTA_BITWISE_LEN: length of operands (NLA_U32)
	 * @NFTA_BITWISE_MASK: mask value (NLA_NESTED: nft_data_attributes)
	 * @NFTA_BITWISE_XOR: xor value (NLA_NESTED: nft_data_attributes)
	 *
	 * The bitwise expression performs the following operation:
	 *
	 * dreg = (sreg & mask) ^ xor
	 *
	 * which allow to express all bitwise operations:
	 *
	 * 		mask	xor
	 * NOT:		1	1
	 * OR:		0	x
	 * XOR:		1	x
	 * AND:		x	0
	 */
	nft_bitwise_attributes: {
		NFTA_BITWISE_UNSPEC: 	0,
		NFTA_BITWISE_SREG: 		1,
		NFTA_BITWISE_DREG: 		2,
		NFTA_BITWISE_LEN: 		3,
		NFTA_BITWISE_MASK: 		4,
		NFTA_BITWISE_XOR: 		5,
		NFTA_BITWISE_SPEC: 		['','n/32','n/32','n/32','r/nft_data_attributes','r/nft_data_attributes']
	},

	/**
	 * enum nft_verdict_attributes - nf_tables verdict netlink attributes
	 *
	 * @NFTA_VERDICT_CODE: nf_tables verdict (NLA_U32: enum nft_verdicts)
	 * @NFTA_VERDICT_CHAIN: jump target chain name (NLA_STRING)
	 */
	nft_verdict_attributes: {
		NFTA_VERDICT_UNSPEC: 		0,
		NFTA_VERDICT_CODE: 			1,
		NFTA_VERDICT_CHAIN: 		2,
		NFTA_VERDICT_SPEC: 			['','n/32','s']
	},

	/**
	 * enum nft_immediate_attributes - nf_tables immediate expression netlink attributes
	 *
	 * @NFTA_IMMEDIATE_DREG: destination register to load data into (NLA_U32)
	 * @NFTA_IMMEDIATE_DATA: data to load (NLA_NESTED: nft_data_attributes)
	 */
	nft_immediate_attributes: {
		NFTA_IMMEDIATE_UNSPEC: 		0,
		NFTA_IMMEDIATE_DREG: 		1,
		NFTA_IMMEDIATE_DATA: 		2,
		NFTA_IMMEDIATE_SPEC: 		['','n/32','r/nft_data_attributes']
	},


// /**
//  * enum nft_set_flags - nf_tables set flags
//  *
//  * @NFT_SET_ANONYMOUS: name allocation, automatic cleanup on unlink
//  * @NFT_SET_CONSTANT: set contents may not change while bound
//  * @NFT_SET_INTERVAL: set contains intervals
//  * @NFT_SET_MAP: set is used as a dictionary
//  */
// enum nft_set_flags {
// 	NFT_SET_ANONYMOUS		= 0x1,
// 	NFT_SET_CONSTANT		= 0x2,
// 	NFT_SET_INTERVAL		= 0x4,
// 	NFT_SET_MAP			= 0x8,
//	NFT_SET_TYPE: 				['s','s','n/32','n/32','n/32','n/32','n/32','n/32','n/32','n/32','n/32']
// };

// /**
//  * enum nft_set_policies - set selection policy
//  *
//  * @NFT_SET_POL_PERFORMANCE: prefer high performance over low memory use
//  * @NFT_SET_POL_MEMORY: prefer low memory use over high performance
//  */
// enum nft_set_policies {
// 	NFT_SET_POL_PERFORMANCE,
// 	NFT_SET_POL_MEMORY,
// };

// /**
//  * enum nft_set_desc_attributes - set element description
//  *
//  * @NFTA_SET_DESC_SIZE: number of elements in set (NLA_U32)
//  */
// enum nft_set_desc_attributes {
// 	NFTA_SET_DESC_UNSPEC,
// 	NFTA_SET_DESC_SIZE,
// 	__NFTA_SET_DESC_MAX
// };
// #define NFTA_SET_DESC_MAX	(__NFTA_SET_DESC_MAX - 1)

// /**
//  * enum nft_set_attributes - nf_tables set netlink attributes
//  *
//  * @NFTA_SET_TABLE: table name (NLA_STRING)
//  * @NFTA_SET_NAME: set name (NLA_STRING)
//  * @NFTA_SET_FLAGS: bitmask of enum nft_set_flags (NLA_U32)
//  * @NFTA_SET_KEY_TYPE: key data type, informational purpose only (NLA_U32)
//  * @NFTA_SET_KEY_LEN: key data length (NLA_U32)
//  * @NFTA_SET_DATA_TYPE: mapping data type (NLA_U32)
//  * @NFTA_SET_DATA_LEN: mapping data length (NLA_U32)
//  * @NFTA_SET_POLICY: selection policy (NLA_U32)
//  * @NFTA_SET_DESC: set description (NLA_NESTED)
//  * @NFTA_SET_ID: uniquely identifies a set in a transaction (NLA_U32)
//  */
// enum nft_set_attributes {
// 	NFTA_SET_UNSPEC,
// 	NFTA_SET_TABLE,
// 	NFTA_SET_NAME,
// 	NFTA_SET_FLAGS,
// 	NFTA_SET_KEY_TYPE,
// 	NFTA_SET_KEY_LEN,
// 	NFTA_SET_DATA_TYPE,
// 	NFTA_SET_DATA_LEN,
// 	NFTA_SET_POLICY,
// 	NFTA_SET_DESC,
// 	NFTA_SET_ID,
// 	__NFTA_SET_MAX
// };
// #define NFTA_SET_MAX		(__NFTA_SET_MAX - 1)

// /**
//  * enum nft_set_elem_flags - nf_tables set element flags
//  *
//  * @NFT_SET_ELEM_INTERVAL_END: element ends the previous interval
//  */
// enum nft_set_elem_flags {
// 	NFT_SET_ELEM_INTERVAL_END	= 0x1,
// };

// /**
//  * enum nft_set_elem_attributes - nf_tables set element netlink attributes
//  *
//  * @NFTA_SET_ELEM_KEY: key value (NLA_NESTED: nft_data)
//  * @NFTA_SET_ELEM_DATA: data value of mapping (NLA_NESTED: nft_data_attributes)
//  * @NFTA_SET_ELEM_FLAGS: bitmask of nft_set_elem_flags (NLA_U32)
//  */
// enum nft_set_elem_attributes {
// 	NFTA_SET_ELEM_UNSPEC,
// 	NFTA_SET_ELEM_KEY,
// 	NFTA_SET_ELEM_DATA,
// 	NFTA_SET_ELEM_FLAGS,
// 	__NFTA_SET_ELEM_MAX
// };
// #define NFTA_SET_ELEM_MAX	(__NFTA_SET_ELEM_MAX - 1)

// /**
//  * enum nft_set_elem_list_attributes - nf_tables set element list netlink attributes
//  *
//  * @NFTA_SET_ELEM_LIST_TABLE: table of the set to be changed (NLA_STRING)
//  * @NFTA_SET_ELEM_LIST_SET: name of the set to be changed (NLA_STRING)
//  * @NFTA_SET_ELEM_LIST_ELEMENTS: list of set elements (NLA_NESTED: nft_set_elem_attributes)
//  * @NFTA_SET_ELEM_LIST_SET_ID: uniquely identifies a set in a transaction (NLA_U32)
//  */
// enum nft_set_elem_list_attributes {
// 	NFTA_SET_ELEM_LIST_UNSPEC,
// 	NFTA_SET_ELEM_LIST_TABLE,
// 	NFTA_SET_ELEM_LIST_SET,
// 	NFTA_SET_ELEM_LIST_ELEMENTS,
// 	NFTA_SET_ELEM_LIST_SET_ID,
// 	__NFTA_SET_ELEM_LIST_MAX
// };
// #define NFTA_SET_ELEM_LIST_MAX	(__NFTA_SET_ELEM_LIST_MAX - 1)

// /**
//  * enum nft_data_types - nf_tables data types
//  *
//  * @NFT_DATA_VALUE: generic data
//  * @NFT_DATA_VERDICT: netfilter verdict
//  *
//  * The type of data is usually determined by the kernel directly and is not
//  * explicitly specified by userspace. The only difference are sets, where
//  * userspace specifies the key and mapping data types.
//  *
//  * The values 0xffffff00-0xffffffff are reserved for internally used types.
//  * The remaining range can be freely used by userspace to encode types, all
//  * values are equivalent to NFT_DATA_VALUE.
//  */
// enum nft_data_types {
// 	NFT_DATA_VALUE,
// 	NFT_DATA_VERDICT	= 0xffffff00U,
// };

// #define NFT_DATA_RESERVED_MASK	0xffffff00U


// /**
//  * enum nft_byteorder_ops - nf_tables byteorder operators
//  *
//  * @NFT_BYTEORDER_NTOH: network to host operator
//  * @NFT_BYTEORDER_HTON: host to network opertaor
//  */
// enum nft_byteorder_ops {
// 	NFT_BYTEORDER_NTOH,
// 	NFT_BYTEORDER_HTON,
// };

// /**
//  * enum nft_byteorder_attributes - nf_tables byteorder expression netlink attributes
//  *
//  * @NFTA_BYTEORDER_SREG: source register (NLA_U32: nft_registers)
//  * @NFTA_BYTEORDER_DREG: destination register (NLA_U32: nft_registers)
//  * @NFTA_BYTEORDER_OP: operator (NLA_U32: enum nft_byteorder_ops)
//  * @NFTA_BYTEORDER_LEN: length of the data (NLA_U32)
//  * @NFTA_BYTEORDER_SIZE: data size in bytes (NLA_U32: 2 or 4)
//  */
// enum nft_byteorder_attributes {
// 	NFTA_BYTEORDER_UNSPEC,
// 	NFTA_BYTEORDER_SREG,
// 	NFTA_BYTEORDER_DREG,
// 	NFTA_BYTEORDER_OP,
// 	NFTA_BYTEORDER_LEN,
// 	NFTA_BYTEORDER_SIZE,
// 	__NFTA_BYTEORDER_MAX
// };
// #define NFTA_BYTEORDER_MAX	(__NFTA_BYTEORDER_MAX - 1)

// /**
//  * enum nft_cmp_ops - nf_tables relational operator
//  *
//  * @NFT_CMP_EQ: equal
//  * @NFT_CMP_NEQ: not equal
//  * @NFT_CMP_LT: less than
//  * @NFT_CMP_LTE: less than or equal to
//  * @NFT_CMP_GT: greater than
//  * @NFT_CMP_GTE: greater than or equal to
//  */
// enum nft_cmp_ops {
// 	NFT_CMP_EQ,
// 	NFT_CMP_NEQ,
// 	NFT_CMP_LT,
// 	NFT_CMP_LTE,
// 	NFT_CMP_GT,
// 	NFT_CMP_GTE,
// };
// /**
//  * enum nft_lookup_attributes - nf_tables set lookup expression netlink attributes
//  *
//  * @NFTA_LOOKUP_SET: name of the set where to look for (NLA_STRING)
//  * @NFTA_LOOKUP_SREG: source register of the data to look for (NLA_U32: nft_registers)
//  * @NFTA_LOOKUP_DREG: destination register (NLA_U32: nft_registers)
//  * @NFTA_LOOKUP_SET_ID: uniquely identifies a set in a transaction (NLA_U32)
//  */
// enum nft_lookup_attributes {
// 	NFTA_LOOKUP_UNSPEC,
// 	NFTA_LOOKUP_SET,
// 	NFTA_LOOKUP_SREG,
// 	NFTA_LOOKUP_DREG,
// 	NFTA_LOOKUP_SET_ID,
// 	__NFTA_LOOKUP_MAX
// };
// #define NFTA_LOOKUP_MAX		(__NFTA_LOOKUP_MAX - 1)

// /**
//  * enum nft_payload_bases - nf_tables payload expression offset bases
//  *
//  * @NFT_PAYLOAD_LL_HEADER: link layer header
//  * @NFT_PAYLOAD_NETWORK_HEADER: network header
//  * @NFT_PAYLOAD_TRANSPORT_HEADER: transport header
//  */
// enum nft_payload_bases {
// 	NFT_PAYLOAD_LL_HEADER,
// 	NFT_PAYLOAD_NETWORK_HEADER,
// 	NFT_PAYLOAD_TRANSPORT_HEADER,
// };
// *
//  * enum nft_exthdr_attributes - nf_tables IPv6 extension header expression netlink attributes
//  *
//  * @NFTA_EXTHDR_DREG: destination register (NLA_U32: nft_registers)
//  * @NFTA_EXTHDR_TYPE: extension header type (NLA_U8)
//  * @NFTA_EXTHDR_OFFSET: extension header offset (NLA_U32)
//  * @NFTA_EXTHDR_LEN: extension header length (NLA_U32)

// enum nft_exthdr_attributes {
// 	NFTA_EXTHDR_UNSPEC,
// 	NFTA_EXTHDR_DREG,
// 	NFTA_EXTHDR_TYPE,
// 	NFTA_EXTHDR_OFFSET,
// 	NFTA_EXTHDR_LEN,
// 	__NFTA_EXTHDR_MAX
// };
// #define NFTA_EXTHDR_MAX		(__NFTA_EXTHDR_MAX - 1)

// /**
//  * enum nft_meta_keys - nf_tables meta expression keys
//  *
//  * @NFT_META_LEN: packet length (skb->len)
//  * @NFT_META_PROTOCOL: packet ethertype protocol (skb->protocol), invalid in OUTPUT
//  * @NFT_META_PRIORITY: packet priority (skb->priority)
//  * @NFT_META_MARK: packet mark (skb->mark)
//  * @NFT_META_IIF: packet input interface index (dev->ifindex)
//  * @NFT_META_OIF: packet output interface index (dev->ifindex)
//  * @NFT_META_IIFNAME: packet input interface name (dev->name)
//  * @NFT_META_OIFNAME: packet output interface name (dev->name)
//  * @NFT_META_IIFTYPE: packet input interface type (dev->type)
//  * @NFT_META_OIFTYPE: packet output interface type (dev->type)
//  * @NFT_META_SKUID: originating socket UID (fsuid)
//  * @NFT_META_SKGID: originating socket GID (fsgid)
//  * @NFT_META_NFTRACE: packet nftrace bit
//  * @NFT_META_RTCLASSID: realm value of packet's route (skb->dst->tclassid)
//  * @NFT_META_SECMARK: packet secmark (skb->secmark)
//  * @NFT_META_NFPROTO: netfilter protocol
//  * @NFT_META_L4PROTO: layer 4 protocol number
//  * @NFT_META_BRI_IIFNAME: packet input bridge interface name
//  * @NFT_META_BRI_OIFNAME: packet output bridge interface name
//  * @NFT_META_PKTTYPE: packet type (skb->pkt_type), special handling for loopback
//  * @NFT_META_CPU: cpu id through smp_processor_id()
//  * @NFT_META_IIFGROUP: packet input interface group
//  * @NFT_META_OIFGROUP: packet output interface group
//  * @NFT_META_CGROUP: socket control group (skb->sk->sk_classid)
//  */
// enum nft_meta_keys {
// 	NFT_META_LEN,
// 	NFT_META_PROTOCOL,
// 	NFT_META_PRIORITY,
// 	NFT_META_MARK,
// 	NFT_META_IIF,
// 	NFT_META_OIF,
// 	NFT_META_IIFNAME,
// 	NFT_META_OIFNAME,
// 	NFT_META_IIFTYPE,
// 	NFT_META_OIFTYPE,
// 	NFT_META_SKUID,
// 	NFT_META_SKGID,
// 	NFT_META_NFTRACE,
// 	NFT_META_RTCLASSID,
// 	NFT_META_SECMARK,
// 	NFT_META_NFPROTO,
// 	NFT_META_L4PROTO,
// 	NFT_META_BRI_IIFNAME,
// 	NFT_META_BRI_OIFNAME,
// 	NFT_META_PKTTYPE,
// 	NFT_META_CPU,
// 	NFT_META_IIFGROUP,
// 	NFT_META_OIFGROUP,
// 	NFT_META_CGROUP,
// };

// /**
//  * enum nft_meta_attributes - nf_tables meta expression netlink attributes
//  *
//  * @NFTA_META_DREG: destination register (NLA_U32)
//  * @NFTA_META_KEY: meta data item to load (NLA_U32: nft_meta_keys)
//  * @NFTA_META_SREG: source register (NLA_U32)
//  */
// enum nft_meta_attributes {
// 	NFTA_META_UNSPEC,
// 	NFTA_META_DREG,
// 	NFTA_META_KEY,
// 	NFTA_META_SREG,
// 	__NFTA_META_MAX
// };
// #define NFTA_META_MAX		(__NFTA_META_MAX - 1)

// /**
//  * enum nft_ct_keys - nf_tables ct expression keys
//  *
//  * @NFT_CT_STATE: conntrack state (bitmask of enum ip_conntrack_info)
//  * @NFT_CT_DIRECTION: conntrack direction (enum ip_conntrack_dir)
//  * @NFT_CT_STATUS: conntrack status (bitmask of enum ip_conntrack_status)
//  * @NFT_CT_MARK: conntrack mark value
//  * @NFT_CT_SECMARK: conntrack secmark value
//  * @NFT_CT_EXPIRATION: relative conntrack expiration time in ms
//  * @NFT_CT_HELPER: connection tracking helper assigned to conntrack
//  * @NFT_CT_L3PROTOCOL: conntrack layer 3 protocol
//  * @NFT_CT_SRC: conntrack layer 3 protocol source (IPv4/IPv6 address)
//  * @NFT_CT_DST: conntrack layer 3 protocol destination (IPv4/IPv6 address)
//  * @NFT_CT_PROTOCOL: conntrack layer 4 protocol
//  * @NFT_CT_PROTO_SRC: conntrack layer 4 protocol source
//  * @NFT_CT_PROTO_DST: conntrack layer 4 protocol destination
//  */
// enum nft_ct_keys {
// 	NFT_CT_STATE,
// 	NFT_CT_DIRECTION,
// 	NFT_CT_STATUS,
// 	NFT_CT_MARK,
// 	NFT_CT_SECMARK,
// 	NFT_CT_EXPIRATION,
// 	NFT_CT_HELPER,
// 	NFT_CT_L3PROTOCOL,
// 	NFT_CT_SRC,
// 	NFT_CT_DST,
// 	NFT_CT_PROTOCOL,
// 	NFT_CT_PROTO_SRC,
// 	NFT_CT_PROTO_DST,
// 	NFT_CT_LABELS,
// };

// /**
//  * enum nft_ct_attributes - nf_tables ct expression netlink attributes
//  *
//  * @NFTA_CT_DREG: destination register (NLA_U32)
//  * @NFTA_CT_KEY: conntrack data item to load (NLA_U32: nft_ct_keys)
//  * @NFTA_CT_DIRECTION: direction in case of directional keys (NLA_U8)
//  * @NFTA_CT_SREG: source register (NLA_U32)
//  */
// enum nft_ct_attributes {
// 	NFTA_CT_UNSPEC,
// 	NFTA_CT_DREG,
// 	NFTA_CT_KEY,
// 	NFTA_CT_DIRECTION,
// 	NFTA_CT_SREG,
// 	__NFTA_CT_MAX
// };
// #define NFTA_CT_MAX		(__NFTA_CT_MAX - 1)

// /**
//  * enum nft_limit_attributes - nf_tables limit expression netlink attributes
//  *
//  * @NFTA_LIMIT_RATE: refill rate (NLA_U64)
//  * @NFTA_LIMIT_UNIT: refill unit (NLA_U64)
//  */
// enum nft_limit_attributes {
// 	NFTA_LIMIT_UNSPEC,
// 	NFTA_LIMIT_RATE,
// 	NFTA_LIMIT_UNIT,
// 	__NFTA_LIMIT_MAX
// };
// #define NFTA_LIMIT_MAX		(__NFTA_LIMIT_MAX - 1)

// /**
//  * enum nft_log_attributes - nf_tables log expression netlink attributes
//  *
//  * @NFTA_LOG_GROUP: netlink group to send messages to (NLA_U32)
//  * @NFTA_LOG_PREFIX: prefix to prepend to log messages (NLA_STRING)
//  * @NFTA_LOG_SNAPLEN: length of payload to include in netlink message (NLA_U32)
//  * @NFTA_LOG_QTHRESHOLD: queue threshold (NLA_U32)
//  * @NFTA_LOG_LEVEL: log level (NLA_U32)
//  * @NFTA_LOG_FLAGS: logging flags (NLA_U32)
//  */
// enum nft_log_attributes {
// 	NFTA_LOG_UNSPEC,
// 	NFTA_LOG_GROUP,
// 	NFTA_LOG_PREFIX,
// 	NFTA_LOG_SNAPLEN,
// 	NFTA_LOG_QTHRESHOLD,
// 	NFTA_LOG_LEVEL,
// 	NFTA_LOG_FLAGS,
// 	__NFTA_LOG_MAX
// };
// #define NFTA_LOG_MAX		(__NFTA_LOG_MAX - 1)

// /**
//  * enum nft_queue_attributes - nf_tables queue expression netlink attributes
//  *
//  * @NFTA_QUEUE_NUM: netlink queue to send messages to (NLA_U16)
//  * @NFTA_QUEUE_TOTAL: number of queues to load balance packets on (NLA_U16)
//  * @NFTA_QUEUE_FLAGS: various flags (NLA_U16)
//  */
// enum nft_queue_attributes {
// 	NFTA_QUEUE_UNSPEC,
// 	NFTA_QUEUE_NUM,
// 	NFTA_QUEUE_TOTAL,
// 	NFTA_QUEUE_FLAGS,
// 	__NFTA_QUEUE_MAX
// };
// #define NFTA_QUEUE_MAX		(__NFTA_QUEUE_MAX - 1)

// #define NFT_QUEUE_FLAG_BYPASS		0x01 /* for compatibility with v2 */
// #define NFT_QUEUE_FLAG_CPU_FANOUT	0x02 /* use current CPU (no hashing) */
// #define NFT_QUEUE_FLAG_MASK		0x03

// /**
//  * enum nft_reject_types - nf_tables reject expression reject types
//  *
//  * @NFT_REJECT_ICMP_UNREACH: reject using ICMP unreachable
//  * @NFT_REJECT_TCP_RST: reject using TCP RST
//  * @NFT_REJECT_ICMPX_UNREACH: abstracted ICMP unreachable for bridge and inet
//  */
// enum nft_reject_types {
// 	NFT_REJECT_ICMP_UNREACH,
// 	NFT_REJECT_TCP_RST,
// 	NFT_REJECT_ICMPX_UNREACH,
// };

// /**
//  * enum nft_reject_code - Generic reject codes for IPv4/IPv6
//  *
//  * @NFT_REJECT_ICMPX_NO_ROUTE: no route to host / network unreachable
//  * @NFT_REJECT_ICMPX_PORT_UNREACH: port unreachable
//  * @NFT_REJECT_ICMPX_HOST_UNREACH: host unreachable
//  * @NFT_REJECT_ICMPX_ADMIN_PROHIBITED: administratively prohibited
//  *
//  * These codes are mapped to real ICMP and ICMPv6 codes.
//  */
// enum nft_reject_inet_code {
// 	NFT_REJECT_ICMPX_NO_ROUTE	= 0,
// 	NFT_REJECT_ICMPX_PORT_UNREACH,
// 	NFT_REJECT_ICMPX_HOST_UNREACH,
// 	NFT_REJECT_ICMPX_ADMIN_PROHIBITED,
// 	__NFT_REJECT_ICMPX_MAX
// };
// #define NFT_REJECT_ICMPX_MAX	(__NFT_REJECT_ICMPX_MAX - 1)

// /**
//  * enum nft_reject_attributes - nf_tables reject expression netlink attributes
//  *
//  * @NFTA_REJECT_TYPE: packet type to use (NLA_U32: nft_reject_types)
//  * @NFTA_REJECT_ICMP_CODE: ICMP code to use (NLA_U8)
//  */
// enum nft_reject_attributes {
// 	NFTA_REJECT_UNSPEC,
// 	NFTA_REJECT_TYPE,
// 	NFTA_REJECT_ICMP_CODE,
// 	__NFTA_REJECT_MAX
// };
// #define NFTA_REJECT_MAX		(__NFTA_REJECT_MAX - 1)

// /**
//  * enum nft_nat_types - nf_tables nat expression NAT types
//  *
//  * @NFT_NAT_SNAT: source NAT
//  * @NFT_NAT_DNAT: destination NAT
//  */
// enum nft_nat_types {
// 	NFT_NAT_SNAT,
// 	NFT_NAT_DNAT,
// };

// /**
//  * enum nft_nat_attributes - nf_tables nat expression netlink attributes
//  *
//  * @NFTA_NAT_TYPE: NAT type (NLA_U32: nft_nat_types)
//  * @NFTA_NAT_FAMILY: NAT family (NLA_U32)
//  * @NFTA_NAT_REG_ADDR_MIN: source register of address range start (NLA_U32: nft_registers)
//  * @NFTA_NAT_REG_ADDR_MAX: source register of address range end (NLA_U32: nft_registers)
//  * @NFTA_NAT_REG_PROTO_MIN: source register of proto range start (NLA_U32: nft_registers)
//  * @NFTA_NAT_REG_PROTO_MAX: source register of proto range end (NLA_U32: nft_registers)
//  * @NFTA_NAT_FLAGS: NAT flags (see NF_NAT_RANGE_* in linux/netfilter/nf_nat.h) (NLA_U32)
//  */
// enum nft_nat_attributes {
// 	NFTA_NAT_UNSPEC,
// 	NFTA_NAT_TYPE,
// 	NFTA_NAT_FAMILY,
// 	NFTA_NAT_REG_ADDR_MIN,
// 	NFTA_NAT_REG_ADDR_MAX,
// 	NFTA_NAT_REG_PROTO_MIN,
// 	NFTA_NAT_REG_PROTO_MAX,
// 	NFTA_NAT_FLAGS,
// 	__NFTA_NAT_MAX
// };
// #define NFTA_NAT_MAX		(__NFTA_NAT_MAX - 1)

// /**
//  * enum nft_masq_attributes - nf_tables masquerade expression attributes
//  *
//  * @NFTA_MASQ_FLAGS: NAT flags (see NF_NAT_RANGE_* in linux/netfilter/nf_nat.h) (NLA_U32)
//  */
// enum nft_masq_attributes {
// 	NFTA_MASQ_UNSPEC,
// 	NFTA_MASQ_FLAGS,
// 	__NFTA_MASQ_MAX
// };
// #define NFTA_MASQ_MAX		(__NFTA_MASQ_MAX - 1)

// /**
//  * enum nft_redir_attributes - nf_tables redirect expression netlink attributes
//  *
//  * @NFTA_REDIR_REG_PROTO_MIN: source register of proto range start (NLA_U32: nft_registers)
//  * @NFTA_REDIR_REG_PROTO_MAX: source register of proto range end (NLA_U32: nft_registers)
//  * @NFTA_REDIR_FLAGS: NAT flags (see NF_NAT_RANGE_* in linux/netfilter/nf_nat.h) (NLA_U32)
//  */
// enum nft_redir_attributes {
// 	NFTA_REDIR_UNSPEC,
// 	NFTA_REDIR_REG_PROTO_MIN,
// 	NFTA_REDIR_REG_PROTO_MAX,
// 	NFTA_REDIR_FLAGS,
// 	__NFTA_REDIR_MAX
// };
// #define NFTA_REDIR_MAX		(__NFTA_REDIR_MAX - 1)

// /**
//  * enum nft_gen_attributes - nf_tables ruleset generation attributes
//  *
//  * @NFTA_GEN_ID: Ruleset generation ID (NLA_U32)
//  */
// enum nft_gen_attributes {
// 	NFTA_GEN_UNSPEC,
// 	NFTA_GEN_ID,
// 	__NFTA_GEN_MAX
// };
// #define NFTA_GEN_MAX		(__NFTA_GEN_MAX - 1)
};

module.exports = nft;