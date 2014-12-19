/*
 * error-common.h
 *
 *  Created on: Oct 31, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc
 */
#ifndef ERROR_COMMON_H_
#define ERROR_COMMON_H_



#include <string.h>
#include <stdlib.h>

#include <v8.h>


#include <errno.h>
#if !defined(_MSC_VER)
#include <unistd.h>
#endif
#include <fcntl.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/stat.h>

// https://gcc.gnu.org/onlinedocs/cpp/Stringification.html
#define xstr(s) str(s)
#define str(s) #s

// concept from node.js src/node_constants.cc
#define _ERRCMN_DEFINE_CONSTANT(target, constant)                         \
  (target)->Set(v8::String::NewSymbol(#constant),                         \
                v8::Number::New(constant),                                \
                static_cast<v8::PropertyAttribute>(                       \
                    v8::ReadOnly|v8::DontDelete))

// our mode - this is the same thing, with a reverse lookup key also
#define _ERRCMN_DEFINE_CONSTANT_WREV(target, constant)                    \
  (target)->Set(v8::String::NewSymbol(#constant),                         \
                v8::Number::New(constant),                                \
                static_cast<v8::PropertyAttribute>(                       \
                    v8::ReadOnly|v8::DontDelete));                        \
  (target)->Set(v8::String::New( xstr(constant) ),                                \
                v8::String::New(#constant),                         \
                static_cast<v8::PropertyAttribute>(                       \
                    v8::ReadOnly|v8::DontDelete));                        \

// custom error codes should be above this value
#define _ERRCMD_CUSTOM_ERROR_CUTOFF  4000

namespace _errcmn {

	void DefineConstants(v8::Handle<v8::Object> target);

	char *get_error_str(int _errno);
	void free_error_str(char *b);
	v8::Local<v8::Object> errno_to_JS(int _errno, char *prefix);
}

// BUILDTYPE is a node-gyp-dev thing
#ifndef NO_ERROR_CMN_OUTPUT  // if define this, you must define these below yourself

#ifdef ERRCMN_DEBUG_BUILD
#pragma message "Build is Debug"
// confused? here: https://gcc.gnu.org/onlinedocs/cpp/Variadic-Macros.html
#define ERROR_OUT(s,...) fprintf(stderr, "**ERROR** " s, ##__VA_ARGS__ )
//#define ERROR_PERROR(s,...) fprintf(stderr, "*****ERROR***** " s, ##__VA_ARGS__ );
#define ERROR_PERROR(s,E,...) { char *__S=_err_common::get_error_str(E); fprintf(stderr, "**ERROR** [ %s ] " s, __S, ##__VA_ARGS__ ); _err_common::free_error_str(__S); }

#define DBG_OUT(s,...) fprintf(stderr, "**DEBUG** " s, ##__VA_ARGS__ )
#define IF_DBG( x ) { x }
#else
#define ERROR_OUT(s,...) fprintf(stderr, "**ERROR** " s, ##__VA_ARGS__ )//#define ERROR_PERROR(s,...) fprintf(stderr, "*****ERROR***** " s, ##__VA_ARGS__ );
#define ERROR_PERROR(s,E,...) { char *__S=_err_common::get_error_str(E); fprintf(stderr, "**ERROR** [ %s ] " s, __S, ##__VA_ARGS__ ); _err_common::free_error_str(__S); }
#define DBG_OUT(s,...) {}
#define IF_DBG( x ) {}
#endif

#else

#define ERROR_OUT(s,...) {} //#define ERROR_PERROR(s,...) fprintf(stderr, "*****ERROR***** " s, ##__VA_ARGS__ );
#define ERROR_PERROR(s,E,...) {}
#define DBG_OUT(s,...) {}
#define IF_DBG( x ) {}


#endif // NO_ERROR_CMN_OUTPUT



#endif /* ERROR_COMMON_H_ */
