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
#include "nan.h"

using namespace v8;

// These are in their own file because net/if.h conflicts with kernel defintions.

NAN_METHOD(IfNameToIndex) {
	_net::err_ev err;

	int i = 0;
	if(info.Length() > 0 && info[0]->IsString()) {
		v8::String::Utf8Value ifname(info[0]->ToString());
		i = if_nametoindex(ifname.operator *());
		if(i == 0)
			err.setError(errno);
	} else {
		err.setError(_net::OTHER_ERROR,"Bad parameters");
	}

	if(err.hasErr())
		info.GetReturnValue().Set(_net::err_ev_to_JS(err,"ifNameToIndex: "));
	else
		info.GetReturnValue().Set(Nan::New(i));
};

NAN_METHOD(IfIndexToName) {
	_net::err_ev err;

	char s[IF_NAMESIZE];
	Local<String> ret;

	if(info.Length() > 0 && info[0]->IsInt32()) {
		char *r = if_indextoname((unsigned int) info[0]->ToInt32()->Int32Value(), s);
		if(!r)
			err.setError(errno);
		else {
		  ret = Nan::New(s).ToLocalChecked();
		}

	} else {
		err.setError(_net::OTHER_ERROR,"Bad parameters");
	}

	if(err.hasErr())
		info.GetReturnValue().Set(_net::err_ev_to_JS(err,"ifIndexToName: "));
	else
		info.GetReturnValue().Set(ret);
};
