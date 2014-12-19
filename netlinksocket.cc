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

Persistent<Function> NetlinkSocket::cstor_sendMsgReq;
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
	tpl->SetClassName(String::NewSymbol("sendMsgReq"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);
	tpl->PrototypeTemplate()->SetInternalFieldCount(2);

	tpl->InstanceTemplate()->Set(String::NewSymbol("addMsg"), FunctionTemplate::New(AddMsgToReq)->GetFunction());

	NetlinkSocket::cstor_sendMsgReq = Persistent<Function>::New(tpl->GetFunction());
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
			netlink_class = (int) js_flags->Int32Value();
		}
	}

	obj->err.clear();
	obj->fd = socket(AF_NETLINK, type_flags, netlink_class);
	if (obj->fd < 0) {
		obj->err.setError(errno);
		ERROR_OUT("Could not create NETLINK_ROUTE socket\n");
	}

	if(obj->err.hasErr()) {
		v8err = _net::err_ev_to_JS(obj->err, "assignAddress: ");
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

	return scope.Close(Undefined());
}

void NetlinkSocket::reqWrapper::free_req_callback_buffer(char *m,void *hint) {
	free(m);
}


void NetlinkSocket::do_sendmsg(uv_work_t *req) {
	NetlinkSocket::sendMsgReq *S = (NetlinkSocket::sendMsgReq *) req->data;
	if(S->self->fd != 0) {

//		struct iovec iov;
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
				if(!first_seq) first_seq = S->self->seq;
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
		last_seq = S->self->seq-1;
		if(x > 0) {
//			iov.iov_base = (void *) iov_array;
//			iov.iov_len = x;

			struct msghdr msg;         // used by sendmsg / recvmsg
			struct sockaddr_nl nladdr; // NETLINK address

			memset(&msg,0,sizeof(msghdr));
			memset(&nladdr, 0, sizeof(nladdr));
			nladdr.nl_family = AF_NETLINK;
			nladdr.nl_pid = getpid();
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
						if (nladdr.nl_pid != getpid() ||  nlhdr->nlmsg_seq < first_seq ||
								nlhdr->nlmsg_seq > last_seq ) {
							DBG_OUT("Warning. Ignore inbound NETLINK_ROUTE message.");
						} else {
							if(nlhdr->nlmsg_type == NLMSG_ERROR) {
								struct nlmsgerr *nlerr = (struct nlmsgerr*)NLMSG_DATA(nlhdr);

								if (ret < sizeof(struct nlmsgerr)) {
									S->err.setError(_net::OTHER_ERROR,"Truncated ERROR from NETLINK.");
								} else {
									if (!nlerr->error) {
										reqWrapper *replyBuf = S->reply_queue.addEmpty();
										replyBuf->Malloc(nlhdr->nlmsg_len);
										memcpy(replyBuf->rawMemory,nlhdr,nlhdr->nlmsg_len);
										DBG_OUT("Got reply. NLMSG_ERROR Queuing... (%d)",S->reply_queue.remaining());
									} else {
										DBG_OUT("Got reply w/ error.");
									}
								}
							} else {
								reqWrapper *replyBuf = S->reply_queue.addEmpty();
								replyBuf->Malloc(nlhdr->nlmsg_len);
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
	sendMsgReq *job = (sendMsgReq *) req->data;

	const unsigned argc = 2;
	Local<Value> argv[argc];
	argv[0] = Integer::New(job->len); // first param to call back is always amount of bytes written
	Handle<Value> v8err;

	job->self->Unref();

	Handle<Boolean> fals = Boolean::New(false);
	// TODO: go through all of the FIFO, empty and DetachBuffer all items

	if(!job->err.hasErr()) {
//		Buffer* rawbuffer = ObjectWrap<Buffer>(job->buffer);www
		if(!job->onSendCB.IsEmpty()) {
			argv[0] = fals->ToBoolean();
			argv[1] = Integer::New(job->len);
			job->onSendCB->Call(Context::GetCurrent()->Global(),2,argv);
		}
	} else { // failure
		if(!job->onSendCB.IsEmpty()) {
			argv[0] = _net::err_ev_to_JS(job->err,"Error in sendMsg(): ")->ToObject();
			job->onSendCB->Call(Context::GetCurrent()->Global(),1,argv);
		}
	}

	job->reqUnref(); // we are done with the request object, let the GC handle it
}


Handle<Value> NetlinkSocket::CreateMsgReq(const Arguments& args) {  // creates a sendMsgReq
	HandleScope scope;
	NetlinkSocket* sock = ObjectWrap::Unwrap<NetlinkSocket>(args.This());

	Handle<Object> v8req = NetlinkSocket::cstor_sendMsgReq->NewInstance();

	NetlinkSocket::sendMsgReq *req = new NetlinkSocket::sendMsgReq(sock,v8req);
	// ignore warning, this is fine. It's wrapped in the cstor of sendMsgReq

	return scope.Close(v8req);
}

Handle<Value> NetlinkSocket::AddMsgToReq(const Arguments& args) {   // adds a Buffer -> for adding a req_generic to the sendMsgReq
	HandleScope scope;

	if(args.Length() > 0 && args[0]->IsObject()) {

		NetlinkSocket::sendMsgReq *obj = ObjectWrap::Unwrap<NetlinkSocket::sendMsgReq>(args.This());

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
 * Send a message via the socket. The
 * @param obj {Object} the object must be a sendMsgReq created from the socket.
 * @param cb  {Function} the callback, of the form: cb(err,bytes)
 *
 */
Handle<Value> NetlinkSocket::Sendmsg(const Arguments& args) {
	// TODO queue with uv_work() stuff
	HandleScope scope;

	_net::err_ev err;

	NetlinkSocket *sock = ObjectWrap::Unwrap<NetlinkSocket>(args.This());

	if(args.Length() > 0 && args[0]->IsObject()) {
		Local <Object> v8req = args[0]->ToObject();
		if(v8req->GetConstructor()->StrictEquals(NetlinkSocket::cstor_sendMsgReq)) {
			NetlinkSocket::sendMsgReq *req =  ObjectWrap::Unwrap<NetlinkSocket::sendMsgReq>(v8req);

			sock->Ref();    // don't let the socket get garbage collected yet
			req->reqRef();  // nor the request object
			if(args.Length() > 0 && args[1]->IsFunction())
				req->onSendCB = Persistent<Function>::New(Local<Function>::Cast(args[1]));

			uv_queue_work(uv_default_loop(), &(req->work), NetlinkSocket::do_sendmsg, NetlinkSocket::post_sendmsg);
		} else {
			return ThrowException(Exception::TypeError(String::New("sendMsg() -> bad parameters. Passed in Object is not sendMsgReq.")));
		}

	} else {

	}

	return scope.Close(Undefined());
}

Handle<Value> NetlinkSocket::OnRecv(const Arguments& args) {
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
