/*
 * interface_funcs.cc
 *
 *  Created on: Dec 16, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */

#include <v8.h>
#include <node.h>


#include <net/if.h>
#include <errno.h>

#include "network-common.h"

using namespace v8;

// These are in their own file because net/if.h conflicts with kernel defintions.

Handle<Value> IfNameToIndex(const Arguments &args) {
	HandleScope scope;

	_net::err_ev err;

	int i = 0;
	if(args.Length() > 0 && args[0]->IsString()) {
		v8::String::Utf8Value ifname(args[0]->ToString());
		i = if_nametoindex(ifname.operator *());
		if(i == 0)
			err.setError(errno);
	} else {
		err.setError(_net::OTHER_ERROR,"Bad parameters");
	}

	if(err.hasErr())
		return scope.Close(_net::err_ev_to_JS(err,"ifNameToIndex: "));
	else
		return scope.Close(Int32::New(i));
};

Handle<Value> IfIndexToName(const Arguments &args) {
	HandleScope scope;

	_net::err_ev err;

	char s[IF_NAMESIZE];
	Local<String> ret;

	if(args.Length() > 0 && args[0]->IsInt32()) {
		char *r = if_indextoname((unsigned int) args[0]->ToInt32()->Int32Value(), s);
		if(!r)
			err.setError(errno);
		else {
			ret = String::New(s);
		}

	} else {
		err.setError(_net::OTHER_ERROR,"Bad parameters");
	}

	if(err.hasErr())
		return scope.Close(_net::err_ev_to_JS(err,"ifIndexToName: "));
	else
		return scope.Close(ret);
};
