/*
 * tuninterface.cc
 *
 *  Created on: Aug 27, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */


#include "tuninterface.h"

#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <stdlib.h>

int TunInterface::tun_create() {

  struct ifreq ifr;
  int _err;
  const char *clonedev = "/dev/net/tun";

  /* Arguments taken by the function:
   *
   * char *dev: the name of an interface (or '\0'). MUST have enough
   *   space to hold the interface name if '\0' is passed
   * int flags: interface flags (eg, IFF_TUN etc.)
   */



   /* open the clone device */
   if( (_if_fd = open(clonedev, O_RDWR)) < 0 ) {
	   _if_fd = 0;
   	   setErrno(errno, "open(): ");
	   return 0;
   }

   /* preparation of the struct ifr, of type "struct ifreq" */
   memset(&ifr, 0, sizeof(ifr));

   ifr.ifr_flags = _if_flags;   /* IFF_TUN or IFF_TAP, plus maybe IFF_NO_PI */

   if (*_if_name) {
     /* if a device name was specified, put it in the structure; otherwise,
      * the kernel will try to allocate the "next" device of the
      * specified type */
	   strncpy(ifr.ifr_name, _if_name, IFNAMSIZ);
   }

   /* try to create the device */
   if( (_err = ioctl(_if_fd, TUNSETIFF, (void *) &ifr)) < 0 ) {
	   _if_fd = 0;
   	   setErrno(errno);
		ERROR_PERROR( "ioctl() TUNSETIFF: \n",errno);
   	   close(_if_fd);
   	   return 0;
   }

  /* if the operation was successful, write back the name of the
   * interface to the variable "dev", so the caller can know
   * it. Note that the caller MUST reserve space in *dev (see calling
   * code below) */
  strcpy(_if_name, ifr.ifr_name);

  /* this is the special file descriptor that the caller will use to talk
   * with the virtual interface */
  return _if_fd;
}

Nan::Persistent<Function> TunInterface::constructor;

//Nan::Persistent<ObjectTemplate> TunInterface::prototype;

NAN_METHOD(TunInterface::Init) {
	INIT_GLOG;

	Local<FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);

	tpl->SetClassName(Nan::New("TunInterface").ToLocalChecked());
	tpl->InstanceTemplate()->SetInternalFieldCount(1);
	tpl->PrototypeTemplate()->SetInternalFieldCount(2);


	Nan::MaybeLocal<Object> Mobj = info[0]->ToObject();
	if(!Mobj.IsEmpty()) {
		Local<Object> base = Mobj.ToLocalChecked();
		Local<Array> keys = base->GetPropertyNames();
		for(unsigned int n=0;n<keys->Length();n++) {
			Local<String> keyname = keys->Get(n)->ToString();
			String::Utf8Value utf8_keyname(keyname);
			Nan::SetInstanceTemplate(tpl, (char*)*utf8_keyname, base->Get(keyname));
		}
	}

	Nan::SetPrototypeMethod(tpl,"isCreated",IsCreated);
	Nan::SetPrototypeMethod(tpl,"create",Create);
	Nan::SetPrototypeMethod(tpl,"_open",Open);
	Nan::SetPrototypeMethod(tpl,"_close",Close);
	Nan::SetPrototypeMethod(tpl,"_getData",GetData);
	Nan::SetPrototypeMethod(tpl,"_sendData",SendData);

	Local<ObjectTemplate> otpl = Nan::New<v8::ObjectTemplate>();
	Nan::SetAccessor(otpl, Nan::New("ifname").ToLocalChecked(), GetIfName, SetIfName);
	Nan::SetAccessor(otpl, Nan::New("fd").ToLocalChecked(), GetIfFD, SetIfFD);
	Nan::SetAccessor(otpl, Nan::New("flags").ToLocalChecked(), GetIfFlags, SetIfFlags);
	Nan::SetAccessor(otpl, Nan::New("lastError").ToLocalChecked(), GetLastError, SetLastError);
	Nan::SetAccessor(otpl, Nan::New("_readChunkSize").ToLocalChecked(), GetReadChunkSize, SetReadChunkSize);

	TunInterface::constructor.Reset(tpl->GetFunction());
	info.GetReturnValue().Set(tpl->GetFunction());
}

/** TunInterface(opts)
 * opts {
 * 	    ifname: "tun77"
 * }
 * @param info
 * @return
 **/
NAN_METHOD(TunInterface::New) {
	TunInterface* obj = NULL;
	GLOG("TunInterface::New");

	if (info.IsConstructCall()) {
	    // Invoked as constructor: `new MyObject(...)`
//	    double value = info[0]->IsUndefined() ? 0 : info[0]->NumberValue();
		GLOG("IsConstructCall - info.Length() = %d", info.Length());
		if(info.Length() > 0  && info[0]->IsObject()) {
			Nan::MaybeLocal<Value> Mval;
			Local<Object> o = info[0]->ToObject();

			Local<Value> doTap;
			Mval = Nan::Get(info[0]->ToObject(), Nan::New("tap").ToLocalChecked());

			if(Mval.ToLocal<Value>(&doTap) && !doTap->IsUndefined() && !doTap->IsNull()) {
				GLOG("TAP TAP TAP");
				obj = TunInterface::createTapInterface();
			} else {
				obj = new TunInterface();
			}

			Local<Value> ifname;
			Mval = Nan::Get(o, Nan::New("ifname").ToLocalChecked());

			if(Mval.ToLocal<Value>(&ifname) && !ifname->IsUndefined()) {
				v8::String::Utf8Value v8str(ifname);
				obj->setIfName(v8str.operator *(),v8str.length());
			}
		} else {
			obj = new TunInterface();
		}

		obj->Wrap(info.This());
	    info.GetReturnValue().Set(info.This());
	} else {
	    // Invoked as plain function `MyObject(...)`, turn into construct call.
	    const int argc = 1;
	    Local<Value> argv[argc] = { info[0] };
	    v8::Local<v8::Function> cons = Nan::New<v8::Function>(constructor);
	    info.GetReturnValue().Set(cons->NewInstance(argc, argv));
	  }

}

NAN_SETTER(TunInterface::SetIfName) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());

	if(value->IsString()) {
		v8::String::Utf8Value v8str(value);
		obj->setIfName(v8str.operator *(),v8str.length());
	} else {
		ERROR_OUT( "Invalid assignment to TunInterface object->ifname\n");
	}
//	obj->SetIfName()
}

NAN_GETTER(TunInterface::GetIfName) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(obj->_if_name)
	  info.GetReturnValue().Set(Nan::New(obj->_if_name, strlen(obj->_if_name)).ToLocalChecked());
}

NAN_SETTER(TunInterface::SetIfFD) {
	// does nothing - read only
}

NAN_GETTER(TunInterface::GetIfFD) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(obj->_if_fd) // 0 is default which is nothing (no device created)
		info.GetReturnValue().Set(Nan::New(obj->_if_fd));
}

NAN_SETTER(TunInterface::SetReadChunkSize) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(value->IsInt32()) {
		obj->read_chunk_size = (int) value->Int32Value();
	} else {
		ERROR_OUT("Assignment to ->read_chunk_size with non Int32 type.");
	}

}

NAN_GETTER(TunInterface::GetReadChunkSize) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	info.GetReturnValue().Set(Nan::New(obj->read_chunk_size));
}


NAN_SETTER(TunInterface::SetLastError) {
	// does nothing - read only
}

NAN_GETTER(TunInterface::GetLastError) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(obj->err.hasErr()) {
	       info.GetReturnValue().Set(_net::err_ev_to_JS(obj->err, "TunInterface: "));
	}
}

NAN_SETTER(TunInterface::SetIfFlags) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(value->IsInt32()) {
		obj->_if_flags = (int) value->ToInt32()->Int32Value();
	} else {
		ERROR_OUT("Assignment to ->_if_flags with non Int32 type.");
	}
}

NAN_GETTER(TunInterface::GetIfFlags) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	info.GetReturnValue().Set(Nan::New(obj->_if_flags));
}


NAN_METHOD(TunInterface::IsCreated) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(obj->_if_fd) // 0 is default which is nothing (no device created)
		info.GetReturnValue().Set(Nan::True());
	else
		info.GetReturnValue().Set(Nan::False());
}


/**
 * Assigns a callback to be called when data arrives from the TUN interface. If data is already available, then
 * this function calls the callback immediately. The callback will *not* be called again once it is called once.
 * @param
 * func(callback, size)
 * size is 'advisory' -->  http://nodejs.org/api/stream.html#stream_readable_read_size_1
 * callback = function(Buffer,amountread,error) {}
 */
NAN_METHOD(TunInterface::GetData) {
	if(info.Length() > 0 && info[0]->IsFunction()) {
		int sizereq = 0;
		if(info.Length() > 1 && info[1]->IsInt32())
			sizereq = (int) info[1]->Int32Value();
		TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());

		TunInterface::readReq *req = new TunInterface::readReq(obj);
		if(sizereq < obj->read_chunk_size) sizereq = obj->read_chunk_size; // read at least the MTU, regardless of req read size

		// make new Buffer object. Make it Persistent to keep it around after the HandleScope closes.
		// we will do the read in a different thread. We don't want to call v8 in another thread, so just do the unwrapping here before we do the work..
		// in the work we will just copy stuff to the _backing store.
		req->_backing = (char *) ::malloc(sizereq);
		Nan::MaybeLocal<v8::Object> buf = Nan::NewBuffer(req->_backing, sizereq);
		req->buffer.Reset(buf.ToLocalChecked());

//		buf->Ref();
		req->len = sizereq;
		req->completeCB = new Nan::Callback(Local<Function>::Cast(info[0]));
		// queue up read job...
		GLOG_DEBUG3("Queuing work for read()\n");
		uv_queue_work(uv_default_loop(), &(req->work), TunInterface::do_read, TunInterface::post_read);
	} else {
	        Nan::ThrowTypeError("send() -> Need at least two params: getData([int32], [function])");
	}
}


void TunInterface::do_read(uv_work_t *req) {
	readReq *job = (readReq *) req->data;
	GLOG_DEBUG3("do_read()\n");

	if(job->self->_if_fd) {
		int ret = read(job->self->_if_fd,job->_backing,job->len);

		GLOG_DEBUG3("job->_backing = %p", job->_backing);
		GLOG_DEBUG3("ret = %d\n", ret);
		if(ret < 0) {
			job->_errno = errno;  // an error occurred, so record error info
			job->len = 0;
		} else {
			job->len = ret; // record number of bytes read
		}
	}
}

void TunInterface::post_read(uv_work_t *req, int status) {
	readReq *job = (readReq *) req->data;

	const unsigned argc = 3;
	Local<Value> argv[argc];
	argv[0] = Nan::New(job->buffer);
	argv[1] = Nan::New(job->len);

	if(job->_errno == 0) {

		if(!job->completeCB->IsEmpty()) {
			GLOG_DEBUG3("Returning buffer");
			job->completeCB->Call(Nan::GetCurrentContext()->Global(),2,argv);
		}
	} else { // failure
		if(!job->completeCB->IsEmpty()) {
		        argv[2] = _net::errno_to_JS(job->_errno,"Error in read(): ");
			job->completeCB->Call(Nan::GetCurrentContext()->Global(),3,argv);
		}
	}

	delete job; // should delete Persistent Handles and allow the Buffer object to be GC'ed
}

/**
 * Sends data to the TUN interface:
 * send(Buffer, CallbackSuccess, CallbackError) { }
 */
NAN_METHOD(TunInterface::SendData) {
	if(info.Length() > 2 && info[1]->IsFunction() && info[0]->IsObject()) {
		TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());

		TunInterface::writeReq *req = new TunInterface::writeReq(obj);
		req->buffer.Reset(info[0]->ToObject()); // keep the Buffer persistent until the write is done...
		if(!Buffer::HasInstance(info[0])) {
			return Nan::ThrowTypeError("send() -> passed in Buffer has no backing!");
		}

		req->_backing = node::Buffer::Data(info[0]->ToObject());
		req->len = node::Buffer::Length(info[0]->ToObject());
		req->onSendSuccessCB = new Nan::Callback(Local<Function>::Cast(info[1]));
		if(info.Length() > 2 && info[2]->IsFunction()) {
			req->onSendFailureCB = new Nan::Callback(Local<Function>::Cast(info[2]));
		} else {
			req->onSendFailureCB = new Nan::Callback();
		}


		// queue up read job...
		uv_queue_work(uv_default_loop(), &(req->work), TunInterface::do_write, TunInterface::post_write);

	} else {
		return Nan::ThrowTypeError("send() -> Need at least two params: send(Buffer, successCallback)");
	}
}

void TunInterface::do_write(uv_work_t *req) {
	writeReq *job = (writeReq *) req->data;

	int ret = 0;
	int written = 0;
	char *buf = job->_backing;
	job->_errno = 0;
	if(job->self->_if_fd) {
		while (ret >= 0 && written < job->len) {
			int ret = write(job->self->_if_fd,buf,job->len - written);
			if(ret < 0) {
				job->_errno = errno;  // an error occurred, so record error info
				break;
			} else {
				written += ret; // record number of bytes written
			}
			buf += written;
		}
		job->len = written;
	}
	// TODO do read
}

void TunInterface::post_write(uv_work_t *req, int status) {
	writeReq *job = (writeReq *) req->data;

	const unsigned argc = 2;
	Local<Value> argv[argc];
	argv[0] =Nan::New(job->len); // first param to call back is always amount of bytes written

	if(job->_errno == 0) {
//		Buffer* rawbuffer = ObjectWrap<Buffer>(job->buffer);
		if(!job->onSendSuccessCB->IsEmpty()) {
			job->onSendSuccessCB->Call(Nan::GetCurrentContext()->Global(),1,argv);
		}
	} else { // failure
		if(!job->onSendFailureCB->IsEmpty()) {
			argv[1] = _net::errno_to_JS(job->_errno,"Error in write(): ");
			job->onSendFailureCB->Call(Nan::GetCurrentContext()->Global(),2,argv);
		}
	}

	delete job;
}



NAN_METHOD(TunInterface::Open) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());

	// FIXME - this only uses the fd created by Create() - we later should try to reopen a closed TUN device.

	if(obj->_if_fd > 0) {
		info.GetReturnValue().Set(Nan::True());
	} else
		info.GetReturnValue().Set(Nan::False());

}

NAN_METHOD(TunInterface::Close) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());

	if(obj->_if_fd > 0) {
		if(close(obj->_if_fd) < 0) {
			info.GetReturnValue().Set(Nan::False());
		} else
			info.GetReturnValue().Set(Nan::True());
	} else {
		obj->err.setError(_net::OTHER_ERROR, "not open!");
		info.GetReturnValue().Set(Nan::False());
	}
}



/**
 * Creates the TUN interface.
 */
NAN_METHOD(TunInterface::Create) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());

	obj->err.clear();
	obj->tun_create();

	if(!obj->err.hasErr())
		info.GetReturnValue().Set(Nan::True());
	else {
		info.GetReturnValue().Set(Nan::False());
	}
}














///**
// * Bring the interface up
// */
//Handle<Value> TunInterface::IfUp(const Arguments& info) {
//	HandleScope scope;
//	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
//
//	char if_tmp_buf[255];
//
//	char *errstr = NULL;
//
//
//	int err = 0;
//	obj->_if_error = 0;
//	obj->tun_create();
//
//	if(!obj->_if_error)
//		return scope.Close(Boolean::New(true));
//	else {
//		return scope.Close(Boolean::New(false));
//	}
//}
//
///**
// * Bring the interface down
// */
//Handle<Value> TunInterface::IfDown(const Arguments& info) {
//	HandleScope scope;
//	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
//
//	char if_tmp_buf[255];
//
//	char *errstr = NULL;
//
//
//	int err = 0;
//	obj->_if_error = 0;
//	obj->tun_create();
//
//	if(!obj->_if_error)
//		return scope.Close(Boolean::New(true));
//	else {
//		return scope.Close(Boolean::New(false));
//	}
//}
//
