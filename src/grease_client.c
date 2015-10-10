/*
 * grease_log.c
 *
 *  Created on: Apr 2, 2015
 *      Author: ed
 * (c) 2015, WigWag Inc.
 */
#include <stdio.h>
#include <stdint.h>
#include <stdarg.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <errno.h>
#include <sys/syscall.h>
#include <sys/time.h>

#include "grease_client.h"


#ifdef __cplusplus
extern "C" {
#endif

#if (GREASE_LOGGING_MAJOR > 0 || GREASE_LOGGING_MINOR > 1)
#error "Mismatched grease log client files"
#endif


#define __DEFAULT_LOG_META_PRIVATE ._cached_hash = { UINT64_C(0xFFFFFFFFFFFFFFFF), 0, 0 }, \
		._cached_lists = { NULL, NULL, NULL, NULL }

//static uint32_t grease_PREAMBLE = SINK_LOG_PREAMBLE;
const logMeta __noMetaData = {
		.tag = 0,
		.level = 0,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };

const logMeta __meta_logdefault = {
		.tag = 0,
		.level = GREASE_LEVEL_LOG,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };

const logMeta __meta_info = {
		.tag = 0,
		.level = GREASE_LEVEL_INFO,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const logMeta __meta_error = {
		.tag = 0,
		.level = GREASE_LEVEL_ERROR,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const logMeta __meta_warn = {
		.tag = 0,
		.level = GREASE_LEVEL_WARN,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const logMeta __meta_debug = {
		.tag = 0,
		.level = GREASE_LEVEL_DEBUG,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const logMeta __meta_debug2 = {
		.tag = 0,
		.level = GREASE_LEVEL_DEBUG2,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const logMeta __meta_debug3 = {
		.tag = 0,
		.level = GREASE_LEVEL_DEBUG3,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const logMeta __meta_user1 = {
		.tag = 0,
		.level = GREASE_LEVEL_USER1,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const logMeta __meta_user2 = {
		.tag = 0,
		.level = GREASE_LEVEL_USER2,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };

const logMeta __meta_success = {
		.tag = 0,
		.level = GREASE_LEVEL_SUCCESS,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };

const logMeta __meta_trace = {
		.tag = 0,
		.level = GREASE_LEVEL_TRACE,
		.origin = 0,
		.target = 0,
		.extras = 0,
		__DEFAULT_LOG_META_PRIVATE };


const uint32_t __grease_preamble = SINK_LOG_PREAMBLE;
const uint32_t __grease_sink_ping = SINK_LOG_PING;
const uint32_t __grease_sink_ping_ack = SINK_LOG_PING_ACK;


#define MODULE_SEARCH_NOT_RAN -1
static int found_module = MODULE_SEARCH_NOT_RAN;

//__attribute__((visibility ("hidden"))) - note: gcc automatically does not export static vars
static void *local_log;

// the grease_log pointer is used to point to the logging method this client code uses:
// 1) If the greaseLog.node module is loaded into the executable, then it will use the local_log pointer
// which points to grease_logLocal() which is defined in logger.cc - and is not in the client code
// 2) otherwise, if this module is not loaded by the executable, then it will use grease_logToSink()
// ...so this pointer below - we don't want to export it. It's only for use in the local code in grease_client.c
__attribute__((visibility ("hidden"))) int (*grease_log)(const logMeta *f, const char *s, RawLogLen len) = NULL;


static __thread char _grease_logstr_buffer[GREASE_C_MACRO_MAX_MESSAGE];

#ifdef __cplusplus
}
#endif

int grease_printf(const logMeta *m, const char *format, ... ) {
	va_list args;
	va_start (args, format);
	RawLogLen len = (RawLogLen) vsnprintf (_grease_logstr_buffer,GREASE_C_MACRO_MAX_MESSAGE,format, args);
	va_end (args);
#ifndef GREASE_DISABLE
	if(grease_log != NULL) {
		if(grease_log(m,_grease_logstr_buffer, len) == GREASE_OK) {
			return GREASE_OK;
		}
	}
#endif
	vfprintf(stderr, _grease_logstr_buffer, args );
	fprintf(stderr, "\n" );
	return GREASE_OK;
}

/**
 * create a log entry for use across the network to Grease.
 * Memory layout: [PREAMBLE][Length (type RawLogLen)][logMeta][logdata - string - no null termination]
 * @param f a pointer to a meta data for logging. If NULL, it will be empty meta data
 * @param s string to log
 * @param len length of the passed in string
 * @param tobuf A raw buffer to store the log output ready for processing
 * @param len A pointer to an int. This will be read to know the existing length of the buffer, and then set
 * the size of the buffer that should be sent
 * @return returns GREASE_OK if successful, or GREASE_NO_BUFFER if the buffer is too small. If parameters are
 * invalid returns GREASE_INVALID_PARAMS
 */
int _grease_logToRaw(const logMeta *f, const char *s, RawLogLen len, char *tobuf, RawLogLen *buflen) {
	if(!tobuf || *buflen < (GREASE_RAWBUF_MIN_SIZE + len))  // sanity check
		return GREASE_NO_BUFFER;
	int w = 0;

	memcpy(tobuf,&__grease_preamble,SIZEOF_SINK_LOG_PREAMBLE);
	w += SIZEOF_SINK_LOG_PREAMBLE;
	int __len = len+sizeof(RawLogLen)+SIZEOF_SINK_LOG_PREAMBLE;
	memcpy(tobuf+w,&__len,sizeof(RawLogLen));
	w += sizeof(RawLogLen);
	if(f)
		memcpy(tobuf+w,f,sizeof(logMeta));
	else
		memcpy(tobuf+w,&__noMetaData,sizeof(logMeta));
	w += sizeof(logMeta);
	if(s && len > 0) {
		memcpy(tobuf+w,s,len);
	}
	*buflen = len;
	return GREASE_OK;
}


// these throw warning saying 'already defined'
// but without them dlopen() does not compile right
#define _GNU_SOURCE
#define __USE_GNU

#include <elf.h>
#include <dlfcn.h>
#include <link.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>



//      static int
//      callback(struct dl_phdr_info *info, size_t size, void *data)
//      {
//          int j;
//
//
//
//          printf("name=%s (%d segments)\n", info->dlpi_name,
//              info->dlpi_phnum);
//
//          for (j = 0; j < info->dlpi_phnum; j++)
//               printf("\t\t header %2d: address=%10p\n", j,
//                   (void *) (info->dlpi_addr + info->dlpi_phdr[j].p_vaddr));
//          return 0;
//      }
//
//
//
//void iterate_plhdr() {
//	found_module = 0;
//	dl_iterate_phdr(callback, NULL);
//}
#define SINK_BUFFERS_N 3
#define SINK_BUFFER_HEADER 0
#define SINK_BUFFER_META 1
#define SINK_BUFFER_STRING 2



const char *default_path = GREASE_DEFAULT_SINK_PATH;
//THREAD_LOCAL char *raw_buffer[SINK_BUFFERS_N];
THREAD_LOCAL struct iovec iov[SINK_BUFFERS_N];
THREAD_LOCAL struct msghdr message;
THREAD_LOCAL struct sockaddr_un sink_dgram_addr;
THREAD_LOCAL int sink_fd;
THREAD_LOCAL int send_buf_size;
THREAD_LOCAL int err_cnt;
THREAD_LOCAL char header_buffer[GREASE_CLIENT_HEADER_SIZE];
THREAD_LOCAL char meta_buffer[sizeof(logMeta)];

int grease_logToSink(const logMeta *f, const char *s, RawLogLen len) {
	uint32_t _len = len + sizeof(logMeta);
	SET_SIZE_IN_HEADER(header_buffer,_len);
//	memcpy(meta_buffer,f,sizeof(logMeta));   // why do we need to do this? just use the pointer...
	// everything is already setup setup_sink_dgram_socket()
#ifdef __cplusplus
	iov[SINK_BUFFER_META].iov_base = const_cast<void *>(f);
#else
	iov[SINK_BUFFER_META].iov_base = (void *) (f);
#endif
	iov[SINK_BUFFER_STRING].iov_base = (void *) s;
	iov[SINK_BUFFER_STRING].iov_len = len;
	int sent_cnt = 0;
	if((sent_cnt = sendmsg(sink_fd, &message, 0)) < 0) {
		perror("UnixDgramSink: Error on sendmsg() \n");
		err_cnt++;
		if(err_cnt > SINK_MAX_ERRORS) {
			grease_log = NULL;
			_GREASE_ERROR_PRINTF("Grease: disabling sink use. Too many errors.\n");
		}
		return GREASE_SINK_FAILURE;
	} else {
		_GREASE_DBG_PRINTF("Sent %d bytes --> Sink\n", sent_cnt);
		return GREASE_OK;
	}

}




static int
grease_plhdr_callback(struct dl_phdr_info *info, size_t size, void *data)
{
    char *found = NULL;
    found = strstr(info->dlpi_name,GREASE_LOG_SO_NAME);
//    printf("so: %s\n", info->dlpi_name);
    if(found) {
    	_GREASE_DBG_PRINTF("Found greaseLog.node in running process\n");
    	// we know the path of the grease node module .so file, so
    	// open it for our own use...
    	void *lib = dlopen(info->dlpi_name, RTLD_LAZY);
    	if(lib) {
        	void *r = dlsym(lib,"grease_logLocal");
            if(r) {
            	_GREASE_DBG_PRINTF("Found symbol for grease_logLocal\n");
            	local_log = r;
            	found_module = 1;
            } else {
            	local_log = NULL;
            }
    	}
    }

//    printf("name=%s (%d segments)\n", info->dlpi_name,
//        info->dlpi_phnum);
//
//    for (j = 0; j < info->dlpi_phnum; j++)
//         printf("\t\t header %2d: address=%10p\n", j,
//             (void *) (info->dlpi_addr + info->dlpi_phdr[j].p_vaddr));
    return 0;
}



int check_grease_symbols() {
	found_module = 0;
	dl_iterate_phdr(grease_plhdr_callback, NULL);
	return found_module;
}

int ping_sink() {
	char temp_buf[GREASE_CLIENT_PING_SIZE];


	int sink_fd_client = socket(AF_UNIX, SOCK_DGRAM, 0);
	if(sink_fd_client < 0) {
		perror("UnixDgramSink: Failed to create SOCK_DGRAM socket (for ping).\n");
		return 1;
	}

	char template[] = GREASE_DEFAULT_CLIENT_PATH_TEMPLATE;
	char *dir = mkdtemp(template);
	char clientpath[100];

	if(dir) {
		int ret = 0;
		struct sockaddr_un client_dgram_addr;
		struct timeval tv;
		tv.tv_sec = 0;
		tv.tv_usec = GREASE_SINK_ACK_TIMEOUT;
		// make the socket timeout in reasonable amount of time
		setsockopt(sink_fd_client, SOL_SOCKET, SO_RCVTIMEO,&tv,sizeof(tv));
		socklen_t socklen = sizeof(struct sockaddr_un);

		strcpy(clientpath,dir);
		strcat(clientpath,"/");
		strcat(clientpath,GREASE_DEFAULT_PING_CLIENT);

		memset(&client_dgram_addr,0,sizeof(client_dgram_addr));
		client_dgram_addr.sun_family = AF_UNIX;
		strcpy(client_dgram_addr.sun_path,clientpath);

		unlink(clientpath); // get rid of it if it already exists
		if(bind(sink_fd_client, (const struct sockaddr *) &client_dgram_addr, sizeof(client_dgram_addr)) < 0) {
			perror("UnixDgramSink: Failed to bind() SOCK_DGRAM socket. (ping)\n");
			close(sink_fd_client);
			ret = 1;
		}

		int r = 0;

		if(!ret && ( r = sendto(sink_fd_client, &__grease_sink_ping, GREASE_CLIENT_PING_SIZE, 0, (struct sockaddr *)&sink_dgram_addr, sizeof(struct sockaddr_un))) < 0) {
			if(r == ECONNREFUSED) {
				perror("UnixDgramSink (ping): connection refused. \n");
			} else
			if(r == ETIMEDOUT) {
				_GREASE_ERROR_PRINTF("UnixDgramSink: ETIMEDOUT - logger probably down.");
			} else
				perror("UnixDgramSink: Error on ping send.");
			ret = 1;
		}

		if(!ret && ( r = recvfrom(sink_fd_client, temp_buf, GREASE_CLIENT_PING_ACK_SIZE, 0, (struct sockaddr *)&sink_dgram_addr,
				&socklen)) < 0) {
			if(r == ECONNREFUSED) {
				perror("UnixDgramSink (ping wait): connection refused. \n");
			} else
			if(r == ETIMEDOUT) {
				_GREASE_ERROR_PRINTF("UnixDgramSink (ping ack): ETIMEDOUT - logger probably down.");
			} else
				perror("UnixDgramSink: Error on wait for ping.");
			ret = 1;
		}
		if(!ret && !IS_SINK_PING_ACK(&temp_buf)) {
			_GREASE_ERROR_PRINTF("UnixDgramSink (ping ack): Bad ping. Does not look like a logger.");
			ret = 1;
		}


		unlink(clientpath); // get rid of it if it already exists
		close(sink_fd_client);
		rmdir(dir);

		return ret;

	} else {
		_GREASE_ERROR_PRINTF("Grease: trouble creating temp dir.");
		return 1;
	}

}

#define SINK_NO_PING 0x0001

THREAD_LOCAL pid_t my_tid;

int setup_sink_dgram_socket(const char *path, int opts) {

	pid_t tid;
	#ifdef SYS_gettid
	tid = syscall(SYS_gettid);
	#else
	tid = (pid_t) 98181; // some random number - probably will break some... :(
	#endif
	err_cnt = 0;

	if(my_tid != tid) { // this is a test, to see if we have called this in this
		                // thread before. Why do this? b/c TLS variables can't be
		                // statically initialized
                        // http://stackoverflow.com/questions/12075349/how-to-initialize-thread-local-variable-in-c

		socklen_t optsize;
		send_buf_size = GREASE_MAX_MESSAGE_SIZE;
		sink_fd = socket(AF_UNIX, SOCK_DGRAM, 0);
		if(sink_fd < 0) {
			perror("UnixDgramSink: Failed to create SOCK_DGRAM socket.\n");
		} else {
			memset(&sink_dgram_addr,0,sizeof(sink_dgram_addr));
			sink_dgram_addr.sun_family = AF_UNIX;
			if(path)
				strcpy(sink_dgram_addr.sun_path,path);
			else
				strcpy(sink_dgram_addr.sun_path,default_path);
		}

		// discover socket max recieve size (this will be the max for a non-fragmented log message
		setsockopt(sink_fd, SOL_SOCKET, SO_RCVBUF, &send_buf_size, sizeof(int));

		getsockopt(sink_fd, SOL_SOCKET, SO_RCVBUF, &send_buf_size, &optsize);
		// http://stackoverflow.com/questions/10063497/why-changing-value-of-so-rcvbuf-doesnt-work
		if(send_buf_size < 100) {
			_GREASE_ERROR_PRINTF("UnixDgramSink: Failed to start reader thread - SO_RCVBUF too small\n");
			return 1;
		} else {
			_GREASE_DBG_PRINTF("UnixDgramSink: SO_RCVBUF is %d\n", send_buf_size);

			message.msg_name=&sink_dgram_addr;
			message.msg_namelen=sizeof(struct sockaddr_un);
			message.msg_iov=iov;

			message.msg_iovlen=SINK_BUFFERS_N;
			message.msg_control=NULL;
			message.msg_controllen=0;
			message.msg_flags = 0;

			memcpy(header_buffer,&__grease_preamble,SIZEOF_SINK_LOG_PREAMBLE);
			iov[0].iov_base = header_buffer;
			iov[0].iov_len = GREASE_CLIENT_HEADER_SIZE;

			iov[1].iov_base = meta_buffer;
			iov[1].iov_len = sizeof(logMeta);

			iov[2].iov_base = NULL;
			iov[2].iov_len = 0;


			// check for alive logger on socket...
			if(opts & SINK_NO_PING) {
				my_tid = tid; // mark as being ran on this thread...
				return 0;
			} else {
				if(!ping_sink()) {
					my_tid = tid; // mark as being ran on this thread...
					return 0;
				} else
					return 1;
			}
		}
	} else {
		return 0;
	}
}


int grease_getConnectivityMethod() {
	if(grease_log == grease_logToSink)
		return GREASE_VIA_SINK;
	if(grease_log == NULL)
		return GREASE_NO_CONNECTION;
	if(grease_log == local_log)
		return GREASE_VIA_LOCAL;
	return 999;
}


int grease_initLogger() {
	// NOTE: found_module is not a TLS variable, the rest of these are...
	if(found_module != MODULE_SEARCH_NOT_RAN) {
		if(found_module) {
			grease_log = local_log;
			return GREASE_OK;
		}
	} else if(check_grease_symbols()) {
		_GREASE_DBG_PRINTF("------- Found symbols.\n");
		grease_log = local_log;
		return GREASE_OK;
	}
	// else, try the sink... (since these are all TLS vars, there be a connection per thread)
	if(!setup_sink_dgram_socket(NULL,0)) {
		grease_log = grease_logToSink;
	} else {
	// fail and use printf
		grease_log = NULL;
		return GREASE_FAILED;
	}
	return GREASE_OK;
}

int grease_fastInitLogger() {
	if(check_grease_symbols()) {
		_GREASE_DBG_PRINTF("------- Found symbols.\n");
		grease_log = local_log;
		return GREASE_OK;
	} else {
		// TODO setup Sink connection
//		grease_log = grease_logToSink;
//		grease_log = NULL;
		if(!setup_sink_dgram_socket(NULL,SINK_NO_PING)) {
			grease_log = grease_logToSink;
		} else {
			grease_log = NULL;
			return GREASE_FAILED;
		}
	}
	return GREASE_OK;
}

// not the end of the world if this is not called...
void grease_shutdown() {
	if(grease_log == grease_logToSink) {
		close(sink_fd);
	}
}

/**
 *
 * BUILD HOW TO
 *
 * 1) Just add this source file
 *
 * 2) Optional:
 * You may need the C compiler options: -std=c99
 * You may also need the linker option: -ldl
 *
 */


