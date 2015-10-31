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

class NetlinkSocket : public Nan::ObjectWrap {
public:
    static Nan::Persistent<v8::Function> cstor_socket;
    static Nan::Persistent<v8::Function> cstor_sockMsgReq;

public:
	NetlinkSocket()
		: Nan::ObjectWrap()
		, fd(0)
		, seq(0)
		, err()
		, onDataCB(NULL)
		, listening(false)
		, listenReq(nullptr)
	{
		seq = time(NULL); // yes. I did the same thing as iproute2 guys. See: iproute2/lib/libnetlink.c:~80
		                  // my guess is this number just needs to be unique.
		memset(&addr_local,0,sizeof(sockaddr_nl));
		memset(&addr_peer,0,sizeof(sockaddr_nl));

		// malloc_info(0, stderr);
		// fprintf(stderr,"======================================================\n" );
	}

	static NAN_METHOD(Init);


    static NAN_METHOD(New);
    static NAN_METHOD(NewInstance);

    static NAN_METHOD(Create);


    static NAN_METHOD(Bind);

    static NAN_METHOD(Sendmsg);
    static NAN_METHOD(OnRecv);
    static NAN_METHOD(StopRecv);
    static NAN_METHOD(OnError);

    static NAN_METHOD(Close);

	// create + add messages to sockMsgReq from JS
    static NAN_METHOD(CreateMsgReq);  // creates a sockMsgReq
    static NAN_METHOD(AddMsgToReq);   // adds a Buffer -> for adding a req_generic to the sockMsgReq

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
			Nan::Persistent<v8::Object> buffer; // Buffer object passed in. we make this Persistent until the req is fulfilled
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
	class sockMsgReq : public Nan::ObjectWrap {
		// Follows the same pattern as TunInterface's write, except that we support
		// scatter / gather style sendmsg semantics, so we need to have a list of reqWrappers
		public:
			typedef TWlib::tw_safeFIFOmv<reqWrapper, netkitAlloc> SendQueue_t;
			typedef TWlib::tw_safeFIFOmv<reqWrapper, netkitAlloc> ReplyQueue_t;  // replies come back
			typedef v8::Local<v8::Object> v8obj;

		public:
			// need Buffer
			sockMsgReq(NetlinkSocket *s) : replies(0), recvBuffer(NULL),_backing(NULL), len(0), self(s)
				{ work.data = this; first_seq = last_seq = s->seq; }
			sockMsgReq(NetlinkSocket *s, v8obj handle) : sockMsgReq(s) { this->Wrap(handle); }
			void reqRef() {	this->Ref(); }
			void reqUnref() { this->Unref(); }
			~sockMsgReq() {	if(recvBuffer) free(recvBuffer); }

		private:
			sockMsgReq();

		public:
			SendQueue_t send_queue;
			ReplyQueue_t reply_queue;  // replies come back    // but their callbacks can only be called in the v8 thread
			Nan::Persistent<v8::Function> cstor;
			int replies; // if non-zero there was a reply (perhaps more than one)
			void *recvBuffer; // used to hold recv stuff before going back to v8 thread.
			uv_work_t work;
			uv_async_t async;
			_net::err_ev err; // the errno that happened sendmsg if an error occurred.
			Nan::Callback* onSendCB;
			Nan::Callback* onReplyCB;       // This is for when we do a sendmsg and *don't* use NLM_F_ACK ...see do_sendmsg()
			Nan::Persistent<v8::Function> buffer; // Buffer object passed in
			char *_backing; // backing of the passed in Buffer
			int len;
			unsigned int first_seq; // sequence bounds
			unsigned int last_seq;  // for this request
			NetlinkSocket *self;
	};

public:
	typedef NetlinkSocket::sockMsgReq Request_t;
	typedef NetlinkTypes::SocketMode SocketMode;
	void saveReqRef(Request_t* r) { listenReq = r; }

protected:

	int fd;       // socket FD

	uint32_t seq; // sequence ID used when creating a netlink message header, incremented

	struct sockaddr_nl	addr_local;
	struct sockaddr_nl	addr_peer;

	_net::err_ev err;
	Nan::Callback* onDataCB;
	bool listening;
	Request_t* listenReq;
	uv_poll_t handle;  // currently only one event loop supported  until we contextualize this

	static int do_recvmsg(Request_t *req, SocketMode mode);
	static void do_sendmsg(uv_work_t *work);
	static void post_recvmsg(uv_work_t *work, int status);
	static void on_recvmsg(uv_poll_t* handle, int status, int events);
};

#endif /* NODE_NETLINKSOCKET_H_ */
