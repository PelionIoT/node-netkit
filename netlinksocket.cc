/*
 * netlinksocket.cc
 *
 *  Created on: Dec 11, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */

#include "netlinksocket.h"
#include "error-common.h"

#include <sys/uio.h>

Persistent<Function> NetlinkSocket::cstor_sockMsgReq;
Persistent<Function> NetlinkSocket::cstor_socket;

void byte_dump(char *buf, int size) {
	int i;
	char* buf_str = (char*) malloc (2*size + 1);
	char* buf_ptr = buf_str;
	for (i = 0; i < size; i++)
	{
	    buf_ptr += sprintf(buf_ptr, "%02X", 0xFF & buf[i]);
	}
	sprintf(buf_ptr,"\n");
	*(buf_ptr + 1) = '\0';
	printf("DUMP: %s\n", buf_str);
	free(buf_str);
}

void NetlinkSocket::ExtendFrom(const Arguments& args) {
	Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
	tpl->SetClassName(String::NewSymbol("NetlinkSocket"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	tpl->PrototypeTemplate()->SetInternalFieldCount(2);

	if(args.Length() > 0) {        // merge in the fields we want to extend from...
		if(args[0]->IsObject()) {
			Local<Object> base = args[0]->ToObject();
			Local<Array> keys = base->GetPropertyNames();
			for(int n=0;n<keys->Length();n++) {
				Local<String> keyname = keys->Get(n)->ToString();
				tpl->InstanceTemplate()->Set(keyname, base->Get(keyname));
			}
		}
	}

	tpl->InstanceTemplate()->Set(String::NewSymbol("create"), FunctionTemplate::New(Create)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("close"), FunctionTemplate::New(Close)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("createMsgReq"), FunctionTemplate::New(CreateMsgReq)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("onError"), FunctionTemplate::New(OnError)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("onRecv"), FunctionTemplate::New(OnRecv)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("sendMsg"), FunctionTemplate::New(Sendmsg)->GetFunction());


//	tpl->InstanceTemplate()->Set(String::NewSymbol("isCreated"), FunctionTemplate::New(IsCreated)->GetFunction());
//	tpl->InstanceTemplate()->Set(String::NewSymbol("create"), FunctionTemplate::New(Create)->GetFunction());
//	tpl->InstanceTemplate()->SetAccessor(String::New("ifname"), GetIfName, SetIfName);
//	tpl->InstanceTemplate()->SetAccessor(String::New("fd"), GetIfFD, SetIfFD);
//	tpl->InstanceTemplate()->SetAccessor(String::New("flags"), GetIfFlags, SetIfFlags);
//	tpl->InstanceTemplate()->SetAccessor(String::New("lastError"), GetLastError, SetLastError);
//	tpl->InstanceTemplate()->SetAccessor(String::New("lastErrorStr"), GetLastErrorStr, SetLastErrorStr);
//
//	tpl->InstanceTemplate()->SetAccessor(String::New("_readChunkSize"), GetReadChunkSize, SetReadChunkSize);
//	tpl->InstanceTemplate()->Set(String::NewSymbol("_open"), FunctionTemplate::New(Open)->GetFunction());
//	tpl->InstanceTemplate()->Set(String::NewSymbol("_close"), FunctionTemplate::New(Close)->GetFunction());
//	tpl->InstanceTemplate()->Set(String::NewSymbol("_getData"), FunctionTemplate::New(GetData)->GetFunction());
//	tpl->InstanceTemplate()->Set(String::NewSymbol("_sendData"), FunctionTemplate::New(SendData)->GetFunction());


//	TunInterface::prototype = Persistent<ObjectTemplate>::New(tpl->PrototypeTemplate());
	NetlinkSocket::cstor_socket = Persistent<Function>::New(tpl->GetFunction());

	tpl = FunctionTemplate::New(New);
	tpl->SetClassName(String::NewSymbol("sockMsgReq"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);
	tpl->PrototypeTemplate()->SetInternalFieldCount(2);

	tpl->InstanceTemplate()->Set(String::NewSymbol("addMsg"), FunctionTemplate::New(AddMsgToReq)->GetFunction());

	NetlinkSocket::cstor_sockMsgReq = Persistent<Function>::New(tpl->GetFunction());
}

Handle<Value> NetlinkSocket::Init(const Arguments& args) {

	HandleScope scope;
	ExtendFrom(args);

	return scope.Close(Undefined());
}

/** netlinkSocket(opts)
 * opts {
 * }
 * @param args
 * @return
 **/
Handle<Value> NetlinkSocket::New(const Arguments& args) {
	HandleScope scope;

	NetlinkSocket* obj = NULL;

	if (args.IsConstructCall()) {
	    // Invoked as constructor: `new MyObject(...)`
//	    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
		if(args.Length() > 0) {
			if(!args[0]->IsObject()) {
				return ThrowException(Exception::TypeError(String::New("Improper first arg to TunInterface cstor. Must be an object.")));
			}

			obj = new NetlinkSocket();

		} else {
			obj = new NetlinkSocket();
		}

		obj->Wrap(args.This());
	    return args.This();
	} else {
	    // Invoked as plain function `MyObject(...)`, turn into construct call.
	    const int argc = 1;
	    Local<Value> argv[argc] = { args[0] };
	    return scope.Close(cstor_socket->NewInstance(argc, argv));
	}
}

Handle<Value> NetlinkSocket::NewInstance(const Arguments& args) {
	HandleScope scope;
	int n = args.Length();
	Local<Object> instance;

	if(args.Length() > 0) {
		Handle<Value> argv[n];
		for(int x=0;x<n;x++)
			argv[x] = args[x];
		instance = NetlinkSocket::cstor_socket->NewInstance(n, argv);
	} else {
		instance = NetlinkSocket::cstor_socket->NewInstance();
	}

	return scope.Close(instance);
}

Handle<Value> NetlinkSocket::Bind(const Arguments& args) {
}

/**
 * @method create
 * @param opts {object}
 * <pre>
 * opts = {
 * 	    type: netkit.SOCK_RAW | netkit.SOCK_CLOEXEC // default
 * }
 * </pre>
 * @param callback {function} func(err) {}
 * @return
 **/
Handle<Value> NetlinkSocket::Create(const Arguments& args) {
	HandleScope scope;

	Handle<Value> v8err;

	NetlinkSocket* obj = ObjectWrap::Unwrap<NetlinkSocket>(args.This());
	uint32_t subscription = 0;

	int type_flags = SOCK_RAW | SOCK_CLOEXEC;
	int netlink_class = NETLINK_ROUTE;
	if(args.Length() > 0 && args[0]->IsObject()) {
		Local<Object> o = args[0]->ToObject();
		Local<Value> js_flags = o->Get(String::New("type"));
		if(!js_flags->IsUndefined() && js_flags->IsInt32()) {
			type_flags = (int) js_flags->Int32Value();
		}
		Local<Value> js_netclass = o->Get(String::New("class"));
		if(!js_netclass->IsUndefined() && js_netclass->IsInt32()) {
			netlink_class = (int) js_netclass->Int32Value();
		}
		Local<Value> js_subs = o->Get(String::New("subscriptions"));  // not supported yet
		if(!js_subs->IsUndefined() && js_subs->IsNumber()) {
			subscription = (uint32_t) js_subs->IntegerValue();
		}

	}




	obj->err.clear();
	obj->fd = socket(AF_NETLINK, type_flags, netlink_class);
	if (obj->fd < 0) {
		obj->err.setError(errno);
		ERROR_OUT("Could not create AF_NETLINK socket\n");
	} else {
		// memset(&addr_local, 0, sizeof(addr_local)); // done in cstor
		obj->addr_local.nl_family = AF_NETLINK;
		obj->addr_local.nl_groups = subscription;

		if (bind(obj->fd, (struct sockaddr*)&obj->addr_local, sizeof(obj->addr_local)) < 0) {
			obj->err.setError(errno);
			ERROR_OUT("Could not bind() AF_NETLINK socket\n");
		} else {
			unsigned int addr_len = sizeof(addr_local);
			if (getsockname(obj->fd, (struct sockaddr*)&obj->addr_local, &addr_len) < 0) {
				obj->err.setError(errno);
				ERROR_OUT("getsockname() on AF_NETLINK socket");
			}
			if(!obj->err.hasErr() && addr_len != sizeof(obj->addr_local)) {
				obj->err.setError(EINVAL);
				ERROR_OUT("getsockname(): mismatch on size.");
			}
			if(!obj->err.hasErr() && obj->addr_local.nl_family != AF_NETLINK) {
				obj->err.setError(EINVAL);
				ERROR_OUT("getsockname(): mismatch on family.");
			}
		}

	}

	if(obj->err.hasErr()) {
		v8err = _net::err_ev_to_JS(obj->err, "socket()/bind(): ");
	}

	if(args.Length() > 1 && args[1]->IsFunction()) {
		const unsigned outargc = 1;
		Local<Value> outargv[outargc];
		Local<Function> cb = Local<Function>::Cast(args[1]);
		if(!v8err.IsEmpty()) {
			outargv[0] = v8err->ToObject();
			cb->Call(Context::GetCurrent()->Global(),1,outargv); // w/ error
		} else {
			cb->Call(Context::GetCurrent()->Global(),0,NULL);
		}
	}


//	if (setsockopt(rth->fd,SOL_SOCKET,SO_SNDBUF,&sndbuf,sizeof(sndbuf)) < 0) {
//		perror("SO_SNDBUF");
//		return -1;
//	}
//
//	if (setsockopt(rth->fd,SOL_SOCKET,SO_RCVBUF,&rcvbuf,sizeof(rcvbuf)) < 0) {
//		perror("SO_RCVBUF");
//		return -1;
//	}
//
//	addr_len = sizeof(rth->local);
//	if (getsockname(rth->fd, (struct sockaddr*)&rth->local, &addr_len) < 0) {
//		perror("Cannot getsockname");
//		return -1;
//	}


	return scope.Close(Undefined());
}

void NetlinkSocket::reqWrapper::free_req_callback_buffer(char *m,void *hint) {
	DBG_OUT("FREEING MEMORY.");
	free(m);
}


void NetlinkSocket::do_sendmsg(uv_work_t *req) {
	NetlinkSocket::sockMsgReq *S = (NetlinkSocket::sockMsgReq *) req->data;
	if(S->self->fd != 0) {

		int alloc_size = sizeof(struct iovec) * S->send_queue.remaining();
		struct iovec *iov_array = (struct iovec *) malloc(alloc_size);
		memset(iov_array,0,alloc_size);
		int x = 0;
		TWlib::tw_safeFIFOmv<reqWrapper, netkitAlloc>::iter iter;
		S->send_queue.startIter(iter);
		int first_seq = 0, last_seq;
		while(!iter.atEnd()) {
			void *buf =  iter.el().rawMemory;
			if(buf) {
				if(S->onReplyCB.IsEmpty())
					AS_GENERIC_NLM(buf)->hdr.nlmsg_flags |= NLM_F_ACK;
				AS_GENERIC_NLM(buf)->hdr.nlmsg_seq = S->self->seq;  // update sequence number
				// other fields are handled in node.js...
				if(!first_seq) first_seq = S->self->seq;
				last_seq = S->self->seq;
				S->self->seq++;
				iov_array[x].iov_base = buf;
				iov_array[x].iov_len = iter.el().len;
				IF_DBG( byte_dump((char *) buf,iter.el().len); );
			} else
				ERROR_OUT("Saw NULL req_generic. Something broke!\n");

			iter.next();
			x++;
		}
		S->send_queue.releaseIter(iter);

		if(x > 0) {

			struct msghdr msg;         // used by sendmsg / recvmsg
			struct sockaddr_nl nladdr; // NETLINK address

			memset(&msg,0,sizeof(msghdr));
			memset(&nladdr, 0, sizeof(nladdr));
			nladdr.nl_family = AF_NETLINK;
			nladdr.nl_pid = 0;
			nladdr.nl_groups = 0;

			msg.msg_name = &nladdr;
			msg.msg_namelen = sizeof(nladdr);
			msg.msg_iov = iov_array;
			msg.msg_iovlen = 1; // array length


			int ret = sendmsg(S->self->fd, &msg, 0);

			if(!S->recvBuffer) {
				S->recvBuffer = malloc(NODE_RTNETLINK_RECV_BUFFER);
				memset(S->recvBuffer,0,NODE_RTNETLINK_RECV_BUFFER);
				iov_array[0].iov_base = S->recvBuffer;
				iov_array[0].iov_len = NODE_RTNETLINK_RECV_BUFFER;
			}

			if (ret < 0) {
				ERROR_OUT("Error on sendmsg()\n");
				S->err.setError(errno);
			} else {
				// receive loop
				while(1) {
//					memset(iov_array,0,sizeof(struct iovec));

					msg.msg_name = &nladdr;
					msg.msg_namelen = sizeof(nladdr);
					msg.msg_iov = iov_array;
					msg.msg_iovlen = 1;

					ret = recvmsg(S->self->fd, &msg, 0);

					if(ret < 0) {
						if (errno == EINTR || errno == EAGAIN)
							continue;
						ERROR_OUT("Error on recvmsg()\n");
						S->err.setError(errno);
						break;
					} else if (ret < sizeof(struct nlmsghdr)){
						ERROR_OUT("Truncated recvmsg()\n");
						S->err.setError(_net::OTHER_ERROR,"Truncated recvmsg() on NETLINK socket.");
						break;
					} else {
						struct nlmsghdr *nlhdr = (struct nlmsghdr *) S->recvBuffer;
						// ignore stuff which does not belong to us, or is not something in reply
						// to what we sent
						// ok, we have at least a header... let's parse it.

						if (nladdr.nl_pid != 0 ||  nlhdr->nlmsg_seq < first_seq ||
								nlhdr->nlmsg_seq > last_seq ) {
							DBG_OUT("Warning. Ignore inbound NETLINK_ROUTE message.");
						} else {
							S->replies++; // mark this request as having replies, so we can do the correct
							              // action in the callback which will run in the v8 thread.
							if(nlhdr->nlmsg_type == NLMSG_ERROR) {
								struct nlmsgerr *nlerr = (struct nlmsgerr*)NLMSG_DATA(nlhdr);

								if (ret < sizeof(struct nlmsgerr)) {
									S->err.setError(_net::OTHER_ERROR,"Truncated ERROR from NETLINK.");
								} else {
//									if (!nlerr->error) {
										reqWrapper *replyBuf = S->reply_queue.addEmpty();
										replyBuf->iserr = true;
										replyBuf->malloc(nlhdr->nlmsg_len);
										memcpy(replyBuf->rawMemory,nlhdr,nlhdr->nlmsg_len);
										DBG_OUT("Got reply. len = %d",nlhdr->nlmsg_len);
										DBG_OUT("Got reply. NLMSG_ERROR Queuing... (%d)",S->reply_queue.remaining());
								}
							} else {
								reqWrapper *replyBuf = S->reply_queue.addEmpty();
								replyBuf->malloc(nlhdr->nlmsg_len);
								memcpy(replyBuf->rawMemory,nlhdr,nlhdr->nlmsg_len);
								DBG_OUT("Got reply. Queuing... (%d)",S->reply_queue.remaining());
							}
						}
						break;
					}
				}
			}
		} else {
			S->err.setError(_net::OTHER_ERROR,"do_sendmsg: Empty request list.");
		}
	} else {
		S->err.setError(_net::OTHER_ERROR,"Bad FD. Socket created?");
	}
}

void NetlinkSocket::post_sendmsg(uv_work_t *req, int status) {
	HandleScope scope;

	sockMsgReq *job = (sockMsgReq *) req->data;

	const unsigned argc = 2;
	Local<Value> argv[argc];
	argv[0] = Integer::New(job->len); // first param to call back is always amount of bytes written
	Handle<Value> v8err;

	job->self->Unref();

	Handle<Boolean> fals = Boolean::New(false);
	Handle<Boolean> tru = Boolean::New(true);

	// TODO: go through all of the FIFO, empty and DetachBuffer all items


	if(!job->err.hasErr()) {
		// ok - no error on job creation - now let's see if there was an error in using netlink...
		bool nlError = false;
		reqWrapper req;

		Handle<Object> retbufs = Object::New();
		int n = 0;
		while(job->replies && job->reply_queue.remove(req)) {
			if(req.iserr) nlError = true;
			if(req.hasBuffer()) {
				retbufs->Set(n,req.ExportBuffer());
			}
			n++; job->replies--;
		}
		retbufs->Set(String::New("length"),Integer::New(n));

		if(job->onReplyCB.IsEmpty() && !job->onSendCB.IsEmpty()) {
			// if we don't have a reply callback,
			if(!nlError) {
				argv[0] = fals->ToBoolean();
				argv[1] = Integer::New(job->len);
				job->onSendCB->Call(Context::GetCurrent()->Global(),2,argv);
			} else {
				argv[0] = _net::errno_to_JS(_net::OTHER_ERROR,"Error from netlink socket reply.")->ToObject();
				job->onSendCB->Call(Context::GetCurrent()->Global(),1,argv);
			}
		} else if (!job->onReplyCB.IsEmpty()) {
			if(!nlError) {
				argv[0] = tru->ToBoolean();
				argv[1] = retbufs->ToObject();
				job->onReplyCB->Call(Context::GetCurrent()->Global(),2,argv);
			} else {
				argv[0] = tru->ToBoolean();
				argv[1] = retbufs->ToObject();
				job->onReplyCB->Call(Context::GetCurrent()->Global(),2,argv);
			}
		}
	} else { // failure on job creation. we did not get to the point of sending a packet.
		if(!job->onSendCB.IsEmpty()) {
			argv[0] = _net::err_ev_to_JS(job->err,"Error in sendMsg(): ")->ToObject();
			job->onSendCB->Call(Context::GetCurrent()->Global(),1,argv);
		}
	}

	job->reqUnref(); // we are done with the request object, let the GC handle it
}

void NetlinkSocket::do_onrecv(uv_work_t *req) {
	HandleScope scope;

	sockMsgReq *job = (sockMsgReq *) req->data;


	// Signal data available for on_recv to send to the the user
    uv_async_send(&(job->async));
}

void NetlinkSocket::on_recv(uv_async_t *handle, int status) {
	// HandleScope scope;

	// sockMsgReq *job = (sockMsgReq *) req->data;


}

Handle<Value> NetlinkSocket::CreateMsgReq(const Arguments& args) {  // creates a sockMsgReq
	HandleScope scope;
	NetlinkSocket* sock = ObjectWrap::Unwrap<NetlinkSocket>(args.This());

	Handle<Object> v8req = NetlinkSocket::cstor_sockMsgReq->NewInstance();

	NetlinkSocket::sockMsgReq *req = new NetlinkSocket::sockMsgReq(sock,v8req);
	// ignore warning, this is fine. It's wrapped in the cstor of sockMsgReq

	return scope.Close(v8req);
}

Handle<Value> NetlinkSocket::AddMsgToReq(const Arguments& args) {   // adds a Buffer -> for adding a req_generic to the sockMsgReq
	HandleScope scope;

	if(args.Length() > 0 && args[0]->IsObject()) {

		NetlinkSocket::sockMsgReq *obj = ObjectWrap::Unwrap<NetlinkSocket::sockMsgReq>(args.This());

		if(!Buffer::HasInstance(args[0])) {
			return ThrowException(Exception::TypeError(String::New("send() -> passed in Buffer has no backing!")));
		}
		reqWrapper *req = obj->send_queue.addEmpty();
		req->AttachBuffer(args[0]->ToObject());  // keep the Buffer persistent until the write is done...

	} else {
		return ThrowException(Exception::TypeError(String::New("addMsg() -> bad parameters.")));
	}

	return scope.Close(Undefined());
}


/**
 * Send a message via the socket. If a reply callback is provided, it and only it will be called
 * if a reply is recieved n(error or no error). If no reply is recived or no reply callback is provided
 * then the sendcb, if provided will be called.
 * @method sendMsg
 * @param obj {Object} the object must be a sockMsgReq created from the socket.
 * @param sendcb  {Function} the callback, of the form: cb(err,bytes)
 * @param replycb {Function} the reply callback. cb(err,bufs)
 *
 */
Handle<Value> NetlinkSocket::Sendmsg(const Arguments& args) {
	// TODO queue with uv_work() stuff
	HandleScope scope;

	_net::err_ev err;

	NetlinkSocket *sock = ObjectWrap::Unwrap<NetlinkSocket>(args.This());

	if(args.Length() > 0 && args[0]->IsObject()) {
		Local <Object> v8req = args[0]->ToObject();
		if(v8req->GetConstructor()->StrictEquals(NetlinkSocket::cstor_sockMsgReq)) {
			NetlinkSocket::sockMsgReq *req =  ObjectWrap::Unwrap<NetlinkSocket::sockMsgReq>(v8req);

			sock->Ref();    // don't let the socket get garbage collected yet
			req->reqRef();  // nor the request object
			if(args.Length() > 0 && args[1]->IsFunction())
				req->onSendCB = Persistent<Function>::New(Local<Function>::Cast(args[1]));

			if(args.Length() > 1 && args[2]->IsFunction())
				req->onReplyCB = Persistent<Function>::New(Local<Function>::Cast(args[2]));

			uv_queue_work(uv_default_loop(), &(req->work), NetlinkSocket::do_sendmsg, NetlinkSocket::post_sendmsg);
		} else {
			return ThrowException(Exception::TypeError(String::New("sendMsg() -> bad parameters. Passed in Object is not sockMsgReq.")));
		}

	} else {

	}

	return scope.Close(Undefined());
}

/**
 * Listen for a message via the given socket. Reply callback will be called
 * if a reply is recieved(error or no error). Message listening will terminate 
 * when the calling scope is destroyed.
 * @method onRecv
 * @param obj {Object} the object must be a sockMsgReq created from the socket.
 * @param replycb {Function} the reply callback. cb(err,bufs)
 *
 */
Handle<Value> NetlinkSocket::OnRecv(const Arguments& args) {
	HandleScope scope;

	NetlinkSocket *sock = ObjectWrap::Unwrap<NetlinkSocket>(args.This());

	if(args.Length() > 1 && args[0]->IsObject()) {
		Local <Object> v8req = args[0]->ToObject();
		if(v8req->GetConstructor()->StrictEquals(NetlinkSocket::cstor_sockMsgReq)) {
			NetlinkSocket::sockMsgReq *req =  ObjectWrap::Unwrap<NetlinkSocket::sockMsgReq>(v8req);

			sock->Ref();
			req->reqRef();
			if(args.Length() > 0 && args[1]->IsFunction())
				req->onReplyCB = Persistent<Function>::New(Local<Function>::Cast(args[1]));

			// Setup the async notifiction events to get data from the worker thread 
		    uv_async_init(uv_default_loop(), &(req->async), NetlinkSocket::on_recv);

			// start the thread to monitor this socket for reads
			uv_queue_work(uv_default_loop(), &(req->work), NetlinkSocket::do_onrecv, NULL);
		} else {
			return ThrowException(Exception::TypeError(String::New("onRecv() -> bad parameters. Passed in Object is not sockMsgReq.")));
		}
	} else {
		return ThrowException(Exception::TypeError(String::New("onRecv() -> bad parameters. sockMsgReq Object and callback required.")));
	}	
	return scope.Close(Undefined());
}

Handle<Value> NetlinkSocket::OnError(const Arguments& args) {
}

Handle<Value> NetlinkSocket::Close(const Arguments& args) {
	HandleScope scope;

	NetlinkSocket *sock = ObjectWrap::Unwrap<NetlinkSocket>(args.This());

	if(sock->fd > 0) {
		close(sock->fd);
	}

	return scope.Close(Undefined());
}

// ------------------------------------------------------------------------------
//
//	requestWrapper definitiions
//
// ------------------------------------------------------------------------------
NetlinkSocket::reqWrapper::reqWrapper() 
	: buffer()
	, rawMemory(NULL)
	, ownMemory(false)
	, len(0)
	, iserr(false) 
{ }

NetlinkSocket::reqWrapper::~reqWrapper() {
	if(rawMemory && ownMemory) ::free(rawMemory);
	buffer.Dispose();
//			buffer.Clear(); // remove any Persistent references
}


NetlinkSocket::reqWrapper& NetlinkSocket::reqWrapper::operator=(reqWrapper &&o) {  
	this->buffer = o.buffer;                    
	o.buffer.Clear();
	if(this->rawMemory && this->ownMemory) free(this->rawMemory);
	this->rawMemory = o.rawMemory; o.rawMemory = NULL;
	this->ownMemory = o.ownMemory; o.ownMemory = false;
	this->iserr = o.iserr; o.iserr = false;
	this->len = o.len; o.len = 0;
	return *this;
}

void NetlinkSocket::reqWrapper::AttachBuffer(Local<Object> b) { 
	// must be called in v8 thread
	// keep the Buffer persistent until the write is done...
	buffer = Persistent<Object>::New(b); 
	if(rawMemory && ownMemory) free(rawMemory); rawMemory = NULL; ownMemory = false;
	rawMemory = node::Buffer::Data(b);
	len = node::Buffer::Length(b);
}

Handle<Object> NetlinkSocket::reqWrapper::ExportBuffer() {
	HandleScope scope;
	if(rawMemory && ownMemory) {
		// OK - this method currently does not work, because node::Buffer::New(rawMemory,len,free_req_callback_buffer,0) does
		// not seem to actually call it's 'free_callback'
		//				node::Buffer *buf = UNI_BUFFER_NEW_WRAP(rawMemory,len,free_req_callback_buffer,NULL);
		//				// once exported, this reqWrapper is empty:
		//				rawMemory = NULL; ownMemory = false; len = 0;
		//				buffer.Dispose(); buffer.Clear(); // in case - some how another Buffer was allocated.
		//				return scope.Close(UNI_BUFFER_FROM_CPOINTER(buf));
		// -----------------------------------------------------
		// so we will just copy it for now...
		DBG_OUT("len=%d",len);
		Handle<Object> buf = UNI_BUFFER_NEW(len);
		char *backing = node::Buffer::Data(buf);
		memcpy(backing,rawMemory,len);
		::free(rawMemory); rawMemory=NULL; ownMemory=false;
		return scope.Close(buf);
	} else {
		return scope.Close(Object::New());
	}
}

void NetlinkSocket::reqWrapper::malloc(int c) {
	buffer.Dispose(); buffer.Clear();
	if(rawMemory && ownMemory) ::free(rawMemory);
	rawMemory = (char *) ::malloc(c);
	ownMemory = true;
	this->len = c;
}

void NetlinkSocket::reqWrapper::DetachBuffer() {
	if(!buffer.IsEmpty()) buffer.Dispose();
	rawMemory = NULL; ownMemory = false; len = 0;
}


