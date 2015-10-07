#ifndef NETLINKTYPES_H_
#define NETLINKTYPES_H_

#include <v8.h>
#include <node.h>
#include <uv.h>
#include <node_buffer.h>
#include "node_pointer.h"
#include "network-common.h"
#include "error-common.h"
#include "nan.h"

#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <linux/if.h>
#include <linux/sockios.h>
#include <linux/netlink.h>  // netlink communication
#include <linux/rtnetlink.h>  // RT_NETLINK class procedures for netlink. See: http://inai.de/documents/Netlink_Protocol.pdf
#include <linux/neighbour.h>  // for capability to do commands like "ip neighbor"

#define TW_OVERRIDE_LOG 1
#define TWLIB_HAS_MOVE_SEMANTICS 1

#define TW_ERROR(s,...)  ERROR_OUT( s , ##__VA_ARGS__ )
#define TW_CRASH(s,...)  ERROR_OUT( s , ##__VA_ARGS__ )
#define TW_WARN(s,...)  WARN_OUT( s , ##__VA_ARGS__ )

#include <TW/tw_fifo.h>

using namespace node;
using namespace v8;

using namespace TWlib;

typedef Allocator<Alloc_Std> netkitAlloc;

#define AS_GENERIC_NLM(r) ((NetlinkTypes::req_generic *)r)
#define AS_NDMSG(r) ((struct NetlinkTypes::req_ndmsg *)r)
#define AS_RTMSG(r) ((struct NetlinkTypes::req_rtmsg *)r)
#define MAX_NODE_RTNETLINK_MESSAGE  (1540+sizeof(nlmsghdr))

// 16k receive buffer - this is used on each recvmsg() call.
// *only* used by uv_work() calls.
#define NODE_RTNETLINK_RECV_BUFFER 16384

namespace NetlinkTypes{

	typedef struct {  // use generic message, we can cast to the one we need
		struct nlmsghdr	hdr;
		// might be... struct ndmsg for neighbors...or whatever - space follows here
		char buf[1540];  // extra space is for various attributes netlink takes
	} req_generic;

	typedef struct {
		struct nlmsghdr	hdr;
		struct ndmsg nd;
		char  			buf[512];
	} req_ndmsg;

	typedef struct {
		struct nlmsghdr	hdr;
		struct rtmsg rt;
		char  			buf[1024];
	} req_rtmsg;

	enum SocketMode{
		SOCKET_NONBLOCKING = 0,
		SOCKET_BLOCKING
	};
};

#endif