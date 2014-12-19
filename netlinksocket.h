/*
 * netlinksocket.h
 *
 *  Created on: Dec 11, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */
#ifndef NODE_NETLINKSOCKET_H_
#define NODE_NETLINKSOCKET_H_

#include <v8.h>
#include <node.h>
#include <uv.h>
#include <node_buffer.h>
#include "node_pointer.h"
#include "network-common.h"

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

#define AS_GENERIC_NLM(r) ((NetlinkSocket::req_generic *)r)
#define AS_NDMSG(r) ((struct NetlinkSocket::req_ndmsg *)r)
#define AS_RTMSG(r) ((struct NetlinkSocket::req_rtmsg *)r)
#define MAX_NODE_RTNETLINK_MESSAGE  (1540+sizeof(nlmsghdr))

// 16k receive buffer - this is used on each recvmsg() call.
// *only* used by uv_work() calls.
#define NODE_RTNETLINK_RECV_BUFFER 16384


class NetlinkSocket : public node::ObjectWrap {
public:
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
protected:

	class reqWrapper {
	public:
		static void free_req_callback_buffer(char *m,void *hint); // this is the node::Buffer free callback. See node/node_buffer.h
		v8::Persistent<Object> buffer; // Buffer object passed in. we make this Persistent until the req is fulfilled
		char *rawMemory;
		bool ownMemory; // true if we should free our own memory.
		int len;
		reqWrapper() : buffer(), rawMemory(NULL), ownMemory(false), len(0) {
		};
		reqWrapper( const reqWrapper &o ) = delete;     // we only use this in the tw_FIFO below
		inline reqWrapper& operator=(reqWrapper &&o) {  // and we don't want multiple copies of
			this->buffer = o.buffer;                    // of these wrappers around
			o.buffer.Clear();
			this->rawMemory = o.rawMemory; o.rawMemory = NULL;
			this->ownMemory = o.ownMemory; o.ownMemory = false;
			return *this;
		}
		void AttachBuffer(Local<Object> b) { // must be called in v8 thread
			buffer = Persistent<Object>::New(b); // keep the Buffer persistent until the write is done...
			if(rawMemory && ownMemory) free(rawMemory); rawMemory = NULL;
			rawMemory = node::Buffer::Data(b);
			len = node::Buffer::Length(b);
			ownMemory = false;
		}
		void DetachBuffer() {
			if(!buffer.IsEmpty()) buffer.Dispose();
			rawMemory = NULL; ownMemory = false; len = 0;
		}
		Local<Object> exportBuffer() {
			HandleScope scope;
			Local<Object> retbuffer;
			if(rawMemory) {
				node::Buffer *buf = UNI_BUFFER_NEW_WRAP(rawMemory,len,free_req_callback_buffer,NULL);
				retbuffer = UNI_BUFFER_FROM_CPOINTER(buf)->ToObject();
				// once exported, this reqWrapper is empty:
				rawMemory = NULL; ownMemory = false; len = 0;
				buffer.Dispose(); buffer.Clear();
			}
			return scope.Close(retbuffer);
		}
		void Malloc(int len) {
			buffer.Dispose(); buffer.Clear();
			if(rawMemory && ownMemory) free(rawMemory);
			rawMemory = (char *) malloc(len);
			ownMemory = true;
		}
		reqWrapper &operator=(const reqWrapper &o) = delete;
		~reqWrapper() {
			if(rawMemory && ownMemory) free(rawMemory);
			buffer.Dispose();
//			buffer.Clear(); // remove any Persistent references
		}
	};

	int fd;       // socket FD

	uint32_t seq; // sequence ID used when creating a netlink message header, incremented

	_net::err_ev err;

	v8::Persistent<Function> onDataCB;


	class sendMsgReq : public node::ObjectWrap {
		// Follows the same pattern as TunInterface's write, except that we support
		// scatter / gather style sendmsg semantics, so we need to have a list of reqWrappers
	public:
		TWlib::tw_safeFIFOmv<reqWrapper, netkitAlloc> send_queue;
		TWlib::tw_safeFIFOmv<reqWrapper, netkitAlloc> reply_queue;  // replies come back
		                                                            // but their callbacks can only be called in the v8 thread

		void *recvBuffer; // used to hold recv stuff before going back to v8 thread.
		uv_work_t work;
		_net::err_ev err; // the errno that happened sendmsg if an error occurred.
		v8::Persistent<Function> onSendCB;
		v8::Persistent<Function> onReplyCB;       // not using yet: This is for when we do a sendmsg and *don't* use NLM_F_ACK ...see do_sendmsg()
		v8::Persistent<Object> buffer; // Buffer object passed in
		char *_backing; // backing of the passed in Buffer
		int len;
		NetlinkSocket *self;
		// need Buffer
		sendMsgReq(NetlinkSocket *s) : node::ObjectWrap(),
				send_queue(), reply_queue(), recvBuffer(NULL), err(),
				onSendCB(), onReplyCB(), buffer(), _backing(NULL), len(0), self(s) {
			work.data = this;
		}
		sendMsgReq(NetlinkSocket *s, v8::Handle<v8::Object> handle) : sendMsgReq(s) {
			this->Wrap(handle);
		}
		void reqRef() {
			this->Ref();
		}
		void reqUnref() {
			this->Unref();
		}

		~sendMsgReq() {
			if(recvBuffer) free(recvBuffer);
		}

		sendMsgReq() = delete;

		static Persistent<Function> cstor;
	};

	static void do_sendmsg(uv_work_t *req);
	static void post_sendmsg(uv_work_t *req, int status);

public:
	NetlinkSocket() : node::ObjectWrap(), fd(0), seq(0), err(), onDataCB() {
	}

	static Handle<Value> Init(const Arguments& args);
	static void ExtendFrom(const Arguments& args);
    static Persistent<Function> cstor_socket;
    static Persistent<Function> cstor_sendMsgReq;


    static Handle<Value> New(const Arguments& args);
    static Handle<Value> NewInstance(const Arguments& args);

    static Handle<Value> Create(const Arguments& args);


    static Handle<Value> Bind(const Arguments& args);

    static Handle<Value> Sendmsg(const Arguments& args);
    static Handle<Value> OnRecv(const Arguments& args);
    static Handle<Value> OnError(const Arguments& args);

    static Handle<Value> Close(const Arguments& args);

	// create + add messages to sendMsgReq from JS
    static Handle<Value> CreateMsgReq(const Arguments& args);  // creates a sendMsgReq
    static Handle<Value> AddMsgToReq(const Arguments& args);   // adds a Buffer -> for adding a req_generic to the sendMsgReq

};




#endif /* NODE_NETLINKSOCKET_H_ */
