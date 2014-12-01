/*
 * tuninterface.cc
 *
 *  Created on: Aug 27, 2014
 *      Author: ed
 * (c) 2014, Framez Inc
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
   	   _if_error = errno;
   	   setErrStr("open(): ", strerror(errno));
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
   	   _if_error = errno;
   	   setErrStr("ioctl(): ", strerror(errno));
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

Persistent<Function> TunInterface::constructor;

//Persistent<ObjectTemplate> TunInterface::prototype;

Handle<Value> TunInterface::Init(const Arguments& args) {

	HandleScope scope;
//	uv_mutex_init(&(ClonedPackage::workIdMutex));
	// Prepare constructor template

//	tpl->SetCallHandler()
	// Prototype
//	tpl->PrototypeTemplate()->Set(String::NewSymbol("connect"), FunctionTemplate::New(Connect)->GetFunction());

//	tpl->InstanceTemplate()->Set(String::NewSymbol("cloneRemote"), FunctionTemplate::New(CloneRemote)->GetFunction());
//	tpl->InstanceTemplate()->Set(String::NewSymbol("checkoutRev"), FunctionTemplate::New(CheckoutRev)->GetFunction());

	// .repo = null
//	tpl->InstanceTemplate()->Set(String::NewSymbol("repo"), Local<Value>::New(Null()));
//	NODE_SET_PROTOTYPE_METHOD

	ExtendFrom(args);

	return scope.Close(Undefined());

//  target->Set(NanNew<String>("Checkout"), object);
}


void TunInterface::ExtendFrom(const Arguments& args) {
	Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
	tpl->SetClassName(String::NewSymbol("TunInterface"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	tpl->PrototypeTemplate()->SetInternalFieldCount(2);

	if(args.Length() > 0) {
		if(args[0]->IsObject()) {
			Local<Object> base = args[0]->ToObject();
			Local<Array> keys = base->GetPropertyNames();
			for(int n=0;n<keys->Length();n++) {
				Local<String> keyname = keys->Get(n)->ToString();
				tpl->InstanceTemplate()->Set(keyname, base->Get(keyname));
			}
		}
	}


	tpl->InstanceTemplate()->Set(String::NewSymbol("isCreated"), FunctionTemplate::New(IsCreated)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("create"), FunctionTemplate::New(Create)->GetFunction());
	tpl->InstanceTemplate()->SetAccessor(String::New("ifname"), GetIfName, SetIfName);
	tpl->InstanceTemplate()->SetAccessor(String::New("fd"), GetIfFD, SetIfFD);
	tpl->InstanceTemplate()->SetAccessor(String::New("flags"), GetIfFlags, SetIfFlags);
	tpl->InstanceTemplate()->SetAccessor(String::New("lastError"), GetLastError, SetLastError);
	tpl->InstanceTemplate()->SetAccessor(String::New("lastErrorStr"), GetLastErrorStr, SetLastErrorStr);

	tpl->InstanceTemplate()->SetAccessor(String::New("_readChunkSize"), GetReadChunkSize, SetReadChunkSize);
	tpl->InstanceTemplate()->Set(String::NewSymbol("_open"), FunctionTemplate::New(Open)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("_close"), FunctionTemplate::New(Close)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("_getData"), FunctionTemplate::New(GetData)->GetFunction());
	tpl->InstanceTemplate()->Set(String::NewSymbol("_sendData"), FunctionTemplate::New(SendData)->GetFunction());


//	TunInterface::prototype = Persistent<ObjectTemplate>::New(tpl->PrototypeTemplate());
	TunInterface::constructor = Persistent<Function>::New(tpl->GetFunction());

}


/** TunInterface(opts)
 * opts {
 * 	    ifname: "tun77"
 * }
 * @param args
 * @return
 **/
Handle<Value> TunInterface::New(const Arguments& args) {
	HandleScope scope;

	TunInterface* obj = NULL;

	if (args.IsConstructCall()) {
	    // Invoked as constructor: `new MyObject(...)`
//	    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
		if(args.Length() > 0) {
			if(!args[0]->IsObject()) {
				return ThrowException(Exception::TypeError(String::New("Improper first arg to TunInterface cstor. Must be an object.")));
			}
			Local<Value> ifname = args[0]->ToObject()->Get(String::New("ifname"));

			obj = new TunInterface();

			if(!ifname->IsUndefined()) {
				v8::String::Utf8Value v8str(ifname);
				obj->setIfName(v8str.operator *(),v8str.length());
			}
		} else {
			obj = new TunInterface();
		}

		obj->Wrap(args.This());
	    return args.This();
	} else {
	    // Invoked as plain function `MyObject(...)`, turn into construct call.
	    const int argc = 1;
	    Local<Value> argv[argc] = { args[0] };
	    return scope.Close(constructor->NewInstance(argc, argv));
	  }

}

Handle<Value> TunInterface::NewInstance(const Arguments& args) {
	HandleScope scope;
	int n = args.Length();
	Local<Object> instance;

	if(args.Length() > 0) {
		Handle<Value> argv[n];
		for(int x=0;x<n;x++)
			argv[n] = args[n];
		instance = TunInterface::constructor->NewInstance(n, argv);
	} else {
		instance = TunInterface::constructor->NewInstance();
	}

	return scope.Close(instance);
}


void TunInterface::SetIfName(Local<String> property, Local<Value> val, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());

	if(val->IsString()) {
		v8::String::Utf8Value v8str(val);
		obj->setIfName(v8str.operator *(),v8str.length());
	} else {
		ERROR_OUT( "Invalid assignment to TunInterface object->ifname\n");
	}
//	obj->SetIfName()
}

Handle<Value> TunInterface::GetIfName(Local<String> property, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(obj->_if_name)
		return scope.Close(String::New(obj->_if_name, strlen(obj->_if_name)));
	else
		return scope.Close(Undefined());
}

void TunInterface::SetIfFD(Local<String> property, Local<Value> val, const AccessorInfo &info) {
	// does nothing - read only
}

Handle<Value> TunInterface::GetIfFD(Local<String> property, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(obj->_if_fd) // 0 is default which is nothing (no device created)
		return scope.Close(Integer::New(obj->_if_fd));
	else
		return scope.Close(Undefined());
}

void TunInterface::SetReadChunkSize(Local<String> property, Local<Value> val, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(val->IsInt32()) {
		obj->read_chunk_size = (int) val->Int32Value();
	} else {
		ERROR_OUT("Assignment to ->read_chunk_size with non Int32 type.");
	}

}

Handle<Value> TunInterface::GetReadChunkSize(Local<String> property, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	return scope.Close(Integer::New(obj->read_chunk_size));
}


void TunInterface::SetLastError(Local<String> property, Local<Value> val, const AccessorInfo &info) {
	// does nothing - read only
}

Handle<Value> TunInterface::GetLastError(Local<String> property, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	return scope.Close(Integer::New(obj->_if_error));
}

void TunInterface::SetLastErrorStr(Local<String> property, Local<Value> val, const AccessorInfo &info) {
	// does nothing - read only
}

Handle<Value> TunInterface::GetLastErrorStr(Local<String> property, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(obj->_err_str)
		return scope.Close(String::New(obj->_err_str, strlen(obj->_err_str)));
	else
		return scope.Close(Undefined());
}

void TunInterface::SetIfFlags(Local<String> property, Local<Value> val, const AccessorInfo &info) {
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	if(val->IsInt32()) {
		obj->_if_flags = (int) val->ToInt32()->Int32Value();
	} else {
		ERROR_OUT("Assignment to ->_if_flags with non Int32 type.");
	}
}

Handle<Value> TunInterface::GetIfFlags(Local<String> property, const AccessorInfo &info) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(info.This());
	return scope.Close(Integer::New(obj->_if_flags));
}


Handle<Value> TunInterface::IsCreated(const Arguments &args) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());
	if(obj->_if_fd) // 0 is default which is nothing (no device created)
		return scope.Close(Boolean::New(true));
	else
		return scope.Close(Boolean::New(false));
}


/**
 * Assigns a callback to be called when data arrives from the TUN interface. If data is already available, then
 * this function calls the callback immediately. The callback will *not* be called again once it is called once.
 * @param
 * func(callback, size)
 * size is 'advisory' -->  http://nodejs.org/api/stream.html#stream_readable_read_size_1
 * callback = function(Buffer,amountread,error) {}
 */
Handle<Value> TunInterface::GetData(const Arguments& args) {
	HandleScope scope;
	if(args.Length() > 0 && args[0]->IsFunction()) {
		int sizereq = 0;
		if(args.Length() > 1 && args[1]->IsInt32())
			sizereq = (int) args[1]->Int32Value();
		TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());

		TunInterface::readReq *req = new TunInterface::readReq(obj);
		if(sizereq < obj->read_chunk_size) sizereq = obj->read_chunk_size; // read at least the MTU, regardless of req read size
		// FIXME for node 0.12 this will change. Take note.
		Handle<Object> buf = UNI_BUFFER_NEW(sizereq);
		// make new Buffer object. Make it Persistent to keep it around after the HandleScope closes.
		// we will do the read in a different thread. We don't want to call v8 in another thread, so just do the unwrapping here before we do the work..
		// in the work we will just copy stuff to the _backing store.
		req->buffer = Persistent<Object>::New(buf);

//		buf->Ref();
		req->_backing = node::Buffer::Data(buf);
		req->len = sizereq;
		req->completeCB = Persistent<Function>::New(Local<Function>::Cast(args[0]));
		// queue up read job...
		DBG_OUT("Queuing work for read()\n");
		uv_queue_work(uv_default_loop(), &(req->work), TunInterface::do_read, TunInterface::post_read);

		return scope.Close(Undefined());
	} else {
		return ThrowException(Exception::TypeError(String::New("send() -> Need at least two params: getData([int32], [function])")));
	}
}


void TunInterface::do_read(uv_work_t *req) {
	readReq *job = (readReq *) req->data;
	DBG_OUT("do_read()\n");

	if(job->self->_if_fd) {
		int ret = read(job->self->_if_fd,job->_backing,job->len);
		DBG_OUT("ret = %d\n", ret);
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
	if(job->buffer->IsUndefined()) {
		ERROR_OUT("**** Failure on read: Why is buffer not defined??\n");
	} else
		argv[0] = job->buffer->ToObject();
	argv[1] = Integer::New(job->len);

	if(job->_errno == 0) {
//		Buffer* rawbuffer = ObjectWrap<Buffer>(job->buffer);

		if(!job->completeCB->IsUndefined()) {
			job->completeCB->Call(Context::GetCurrent()->Global(),2,argv);
		}
	} else { // failure
		if(!job->completeCB->IsUndefined()) {
			argv[2] = _net::errno_to_JS(job->_errno,"Error in read(): ");
			job->completeCB->Call(Context::GetCurrent()->Global(),3,argv);
		}
	}

	delete job; // should delete Persistent Handles and allow the Buffer object to be GC'ed
}

/**
 * Sends data to the TUN interface:
 * send(Buffer, CallbackSuccess, CallbackError) { }
 */
Handle<Value> TunInterface::SendData(const Arguments& args) {
	HandleScope scope;
	if(args.Length() > 2 && args[1]->IsFunction() && args[0]->IsObject()) {
		TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());

		TunInterface::writeReq *req = new TunInterface::writeReq(obj);
		req->buffer = Persistent<Object>::New(args[0]->ToObject()); // keep the Buffer persistent until the write is done...
		if(!Buffer::HasInstance(args[0])) {
			return ThrowException(Exception::TypeError(String::New("send() -> passed in Buffer has no backing!")));
		}

		req->_backing = node::Buffer::Data(args[0]->ToObject());
		req->len = node::Buffer::Length(args[0]->ToObject());
		req->onSendSuccessCB = Persistent<Function>::New(Local<Function>::Cast(args[1]));
		if(args.Length() > 2 && args[2]->IsFunction()) {
			req->onSendFailureCB = Persistent<Function>::New(Local<Function>::Cast(args[2]));
		}
		// queue up read job...
		uv_queue_work(uv_default_loop(), &(req->work), TunInterface::do_write, TunInterface::post_write);

		return scope.Close(Undefined());
	} else {
		return ThrowException(Exception::TypeError(String::New("send() -> Need at least two params: send(Buffer, successCallback)")));
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
	argv[0] = Integer::New(job->len); // first param to call back is always amount of bytes written

	if(job->_errno == 0) {
//		Buffer* rawbuffer = ObjectWrap<Buffer>(job->buffer);
		if(!job->onSendSuccessCB->IsUndefined()) {
			job->onSendSuccessCB->Call(Context::GetCurrent()->Global(),1,argv);
		}
	} else { // failure
		if(!job->onSendFailureCB->IsUndefined()) {
			argv[1] = _net::errno_to_JS(job->_errno,"Error in write(): ");
			job->onSendFailureCB->Call(Context::GetCurrent()->Global(),2,argv);
		}
	}

	delete job;
}



Handle<Value> TunInterface::Open(const Arguments& args) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());

	// FIXME - this only uses the fd created by Create() - we later should try to reopen a closed TUN device.

	if(obj->_if_fd > 0) {
		return scope.Close(Boolean::New(true));
	} else
		return scope.Close(Boolean::New(false));

}

Handle<Value> TunInterface::Close(const Arguments& args) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());

	if(obj->_if_fd > 0) {
		if(close(obj->_if_fd) < 0) {
			obj->_if_error = errno;  // an error occurred, so record error info
			obj->setErrStr("ioctl(): ", strerror(errno));
			return scope.Close(Boolean::New(false));
		} else
			return scope.Close(Boolean::New(true));
	} else {
		obj->setErrStr("not open!","");
		return scope.Close(Boolean::New(false));
	}
}



/**
 * Creates the TUN interface.
 */
Handle<Value> TunInterface::Create(const Arguments& args) {
	HandleScope scope;
	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());

	obj->_if_error = 0;
	obj->tun_create();

	if(!obj->_if_error)
		return scope.Close(Boolean::New(true));
	else {
		return scope.Close(Boolean::New(false));
	}
}














///**
// * Bring the interface up
// */
//Handle<Value> TunInterface::IfUp(const Arguments& args) {
//	HandleScope scope;
//	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());
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
//Handle<Value> TunInterface::IfDown(const Arguments& args) {
//	HandleScope scope;
//	TunInterface* obj = ObjectWrap::Unwrap<TunInterface>(args.This());
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
