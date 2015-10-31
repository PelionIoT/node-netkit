/*
 * network-common.h
 *
 *  Created on: Sep 2, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc
 */
#ifndef NETWORK_COMMON_H_
#define NETWORK_COMMON_H_



#include "node.h"
#include "node_buffer.h"
#include "node_version.h"
#include "v8.h"
#include "nan.h"

#include <stdlib.h>
#include <string.h>

#include "netkit_err.h"
#include "error-common.h"
#include "grease_client.h"

namespace _net {
    /** NOTE: you should always pass in a string with this when using setError() */
	const int OTHER_ERROR = NETKIT_OTHER_ERROR;
	char *get_error_str(int _errno);
	void free_error_str(char *b);
	v8::Local<v8::Value> errno_to_JS(int _errno, const char *prefix);
	struct err_ev {
		char *errstr;
		int _errno;
		err_ev(void) : errstr(NULL), _errno(0) {};
		void setError(int e,const char *m=NULL);
		err_ev(int e) : err_ev() {
			setError(e);
		}
		err_ev(const err_ev &o) = delete;
		inline err_ev &operator=(const err_ev &o) = delete;
		inline err_ev &operator=(err_ev &&o) {
			this->errstr = o.errstr;  // transfer string to other guy...
			this->_errno = o._errno;
			o.errstr = NULL; o._errno = 0;
			return *this;
		}
		inline void clear() {
			if(errstr) ::free(errstr); errstr = NULL;
			_errno = 0;
		}
		~err_ev() {
			if(errstr) ::free(errstr);
		}
		bool hasErr() { return (_errno != 0); }
	};
	v8::Handle<v8::Value> err_ev_to_JS(err_ev &e, const char *prefix);
}

#define ERR_EV_PRINTF_SETERROR( errev , s , ...) {\
	char b[255];\
		snprintf(b,255,s,##__VA_ARGS__);\
	errev.setError(_net::OTHER_ERROR,b);\
}


#define _ERRCMD_CUSTOM_ERROR_CUTOFF 4000   // arbitrary - needs to be higher than any normal errno number

#endif /* NETWORK_COMMON_H_ */
