/*
 * netlinksocket.h
 *
 *  Created on: Dec 11, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */
#ifndef NODE_NETLINKSOCKET_H_
#define NODE_NETLINKSOCKET_H_

#include "netlinktypes.h"

class NetlinkSocket : public node::ObjectWrap {
public:
    static Persistent<Function> cstor_socket;
    static Persistent<Function> cstor_sockMsgReq;

public:
	NetlinkSocket() 
		: node::ObjectWrap()
		, fd(0)
		, seq(0)
		, err()
		, onDataCB() 
	{
		seq = time(NULL); // yes. I did the same thing as iproute2 guys. See: iproute2/lib/libnetlink.c:~80
		                  // my guess is this number just needs to be unique.
		memset(&addr_local,0,sizeof(sockaddr_nl));
		memset(&addr_peer,0,sizeof(sockaddr_nl));
	}

	static Handle<Value> Init(const Arguments& args);
	static void ExtendFrom(const Arguments& args);


    static Handle<Value> New(const Arguments& args);
    static Handle<Value> NewInstance(const Arguments& args);

    static Handle<Value> Create(const Arguments& args);


    static Handle<Value> Bind(const Arguments& args);

    static Handle<Value> Sendmsg(const Arguments& args);
    static Handle<Value> OnRecv(const Arguments& args);
    static Handle<Value> StopRecv(const Arguments& args);
    static Handle<Value> OnError(const Arguments& args);

    static Handle<Value> Close(const Arguments& args);

	// create + add messages to sockMsgReq from JS
    static Handle<Value> CreateMsgReq(const Arguments& args);  // creates a sockMsgReq
    static Handle<Value> AddMsgToReq(const Arguments& args);   // adds a Buffer -> for adding a req_generic to the sockMsgReq

protected:
	class reqWrapper {
		public:
			reqWrapper();
			~reqWrapper();

			inline reqWrapper& operator=(reqWrapper &&o);
			void AttachBuffer(Local<Object> b);
			void DetachBuffer();
			bool hasBuffer() { return (rawMemory != NULL);	}
			Handle<Object> ExportBuffer();
			void malloc(int c);

		public:
			static void free_req_callback_buffer(char *m,void *hint); // this is the node::Buffer free callback. See node/node_buffer.h
			v8::Persistent<Object> buffer; // Buffer object passed in. we make this Persistent until the req is fulfilled
			char *rawMemory;
			bool ownMemory; // true if we should free our own memory.
			int len;
			bool iserr;

		private:
			// we only use this in the tw_FIFO below
			// and we don't want multiple copies of 
			// of these wrappers around
			reqWrapper( const reqWrapper &o );     
			reqWrapper &operator=(const reqWrapper &o);
	};

protected:
	class sockMsgReq : public node::ObjectWrap {
		// Follows the same pattern as TunInterface's write, except that we support
		// scatter / gather style sendmsg semantics, so we need to have a list of reqWrappers
		public:
			typedef TWlib::tw_safeFIFOmv<reqWrapper, netkitAlloc> SendQueue_t;
			typedef TWlib::tw_safeFIFOmv<reqWrapper, netkitAlloc> ReplyQueue_t;  // replies come back
			typedef v8::Handle<v8::Object> v8obj;

		public:
			// need Buffer
			sockMsgReq(NetlinkSocket *s) : replies(0), recvBuffer(NULL),_backing(NULL), len(0), self(s) 
				{ work.data = this; }
			sockMsgReq(NetlinkSocket *s, v8obj handle) : sockMsgReq(s) { this->Wrap(handle); }
			void reqRef() {	this->Ref(); }
			void reqUnref() { this->Unref(); }
			~sockMsgReq() {	if(recvBuffer) free(recvBuffer); }

		private:
			sockMsgReq();

		public:
			SendQueue_t send_queue;
			ReplyQueue_t reply_queue;  // replies come back    // but their callbacks can only be called in the v8 thread
			static Persistent<Function> cstor;
			int replies; // if non-zero there was a reply (perhaps more than one)
			void *recvBuffer; // used to hold recv stuff before going back to v8 thread.
			uv_work_t work;
			uv_async_t async;
			_net::err_ev err; // the errno that happened sendmsg if an error occurred.
			v8::Persistent<Function> onSendCB;
			v8::Persistent<Function> onReplyCB;       // not using yet: This is for when we do a sendmsg and *don't* use NLM_F_ACK ...see do_sendmsg()
			v8::Persistent<Object> buffer; // Buffer object passed in
			char *_backing; // backing of the passed in Buffer
			int len;
			int first_seq; // sequence bounds  
			int last_seq;  // for this request
			NetlinkSocket *self;
	};

public:
	typedef NetlinkSocket::sockMsgReq Request_t;  
	typedef NetlinkTypes::SocketMode SocketMode;

protected:

	int fd;       // socket FD

	uint32_t seq; // sequence ID used when creating a netlink message header, incremented

	struct sockaddr_nl	addr_local;
	struct sockaddr_nl	addr_peer;

	_net::err_ev err;
	v8::Persistent<Function> onDataCB;
	static bool listening;
	static uv_poll_t handle;  // currently only one event loop supported  until we contextualize this

	static int do_recvmsg(Request_t *req, SocketMode mode);
	static void do_sendmsg(uv_work_t *req);
	static void post_recvmsg(uv_work_t *req, int status);
	static void on_recvmsg(uv_poll_t* handle, int status, int events);
};

#endif /* NODE_NETLINKSOCKET_H_ */
