/*
 * netlinksocket.cc
 *
 *  Created on: Dec 11, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */

#include "netlinksocket.h"

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
	TunInterface::constructor = Persistent<Function>::New(tpl->GetFunction());

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

	TunInterface* obj = NULL;

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
	    return scope.Close(constructor->NewInstance(argc, argv));
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
		instance = NetlinkSocket::constructor->NewInstance(n, argv);
	} else {
		instance = NetlinkSocket::constructor->NewInstance();
	}

	return scope.Close(instance);
}

Handle<Value> Bind(const Arguments& args) {
}

Handle<Value> Sendmsg(const Arguments& args) {
}


Handle<Value> OnRecv(const Arguments& args) {
}
Handle<Value> OnError(const Arguments& args) {
}

Handle<Value> Close(const Arguments& args) {

}

};
