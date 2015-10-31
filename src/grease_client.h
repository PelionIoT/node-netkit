/*
 * grease_log.h
 *
 *  Created on: Apr 2, 2015
 *      Author: ed
 * (c) 2015, WigWag Inc.
 */
#ifndef GREASE_LOG_H_
#define GREASE_LOG_H_

#include <string.h>  // for memcmp memcpy
#include <stdint.h>

#ifndef GREASE_LOGGING_MAJOR
#define GREASE_LOGGING_MAJOR 0
#define GREASE_LOGGING_MINOR 1

#endif


#define THREAD_LOCAL __thread


#ifdef __cplusplus
extern "C" {
#endif

#define GREASE_MAX_MESSAGE_SIZE 65535  // we don't support a log entry larger than this
#define GREASE_MAX_PREFIX_HEADER 128   // this is maximum amount of chares which will prefix a log entry
#define SINK_LOG_PREAMBLE ((uint32_t)0xF00DFEED)
#define SINK_LOG_PING     ((uint32_t)0xF00DF00D)
#define SINK_LOG_PING_ACK ((uint32_t)0xF00DF11D)

#define SIZEOF_SINK_LOG_PREAMBLE (sizeof(uint32_t))
#define IS_SINK_PREAMBLE(p) (memcmp(p,&__grease_preamble,SIZEOF_SINK_LOG_PREAMBLE) == 0)
#define IS_SINK_PING(p) (memcmp(p,&__grease_sink_ping,SIZEOF_SINK_LOG_PREAMBLE) == 0)
#define IS_SINK_PING_ACK(p) (memcmp(p,&__grease_sink_ping_ack,SIZEOF_SINK_LOG_PREAMBLE) == 0)
#define GET_SIZE_FROM_PREAMBLE(p,d) (memcpy(&(d),((char *)(p))+(sizeof(uint32_t)),sizeof(uint32_t)))
#define SET_SIZE_IN_HEADER(p,d) (memcpy(((char *)(p))+(sizeof(uint32_t)),&(d),sizeof(uint32_t)))
#define GREASE_CLIENT_HEADER_SIZE (SIZEOF_SINK_LOG_PREAMBLE + sizeof(uint32_t))
#define GREASE_CLIENT_PING_SIZE (sizeof(uint32_t))
#define GREASE_CLIENT_PING_ACK_SIZE GREASE_CLIENT_PING_SIZE
#define GREASE_TOTAL_MSG_SIZE(len) (len + GREASE_CLIENT_HEADER_SIZE)
#define GREASE_RAWBUF_MIN_SIZE (sizeof(logMeta))
#define GREASE_SINK_ACK_TIMEOUT 500000   // in useconds
#define GREASE_LOG_SO_NAME "greaseLog.node"
#define GREASE_META_HASHLIST_CACHE_SIZE 4

#define GREASE_DEFAULT_TARGET_ID 0

// for internal debugging
#ifdef GREASE_DEBUG_MODE
#define _GREASE_DBG_PRINTF(s,...) fprintf(stderr,s, ##__VA_ARGS__)
#define _GREASE_ERROR_PRINTF(s,...) fprintf(stderr,s, ##__VA_ARGS__)
#else
#define _GREASE_DBG_PRINTF(s,...) {}
#define _GREASE_ERROR_PRINTF(s,...) fprintf(stderr,s, ##__VA_ARGS__)
#endif

#define SINK_MAX_ERRORS 10



typedef uint64_t FilterHash;   // format: [N1N2] where N1 is [Tag id] and N2 is [Origin Id]
typedef uint32_t FilterId;     // filter id is always > 0
typedef uint32_t TargetId;     // id is always > 0
typedef uint32_t SinkId;     // id is always > 0
typedef uint32_t OriginId;     // id is always > 0
typedef uint32_t TagId;        // id is always > 0
typedef uint32_t LevelMask;    // id is always > 0
typedef uint32_t RawLogLen;    // len of a raw log buffer into a sink

// the good ole container_of macro...
//#define grease_container_of(ptr, type, member) ({
//        const typeof(((type *)0)->member ) *__mptr = (ptr);
//        (type *)((char *)__mptr - offsetof(type,member) );})
// same as this: (http://www.widecodes.com/0QmVePUkeU/kernels-containerof-any-way-to-make-it-iso-conforming.html)
#define grease_container_of(ptr, type, member) \
                      ((type *) ((char *)(ptr) - offsetof(type, member)))


typedef struct logMeta_t {   // meta data for each log entry
	int32_t tag;    // 0 means no tag
	uint32_t level;  // 0 means no level
	int32_t origin; // 0 means no origin
	uint32_t target; // 0 means default target
	uint32_t extras; // if not zero, then the meta is wrapped by an extras container (extra_logMeta)
	// internal
	FilterHash _cached_hash[3]; // used internally - so we don't compute this so many times
	void *_cached_lists[GREASE_META_HASHLIST_CACHE_SIZE];
} logMeta;

#define MAX_IGNORE_LIST 10

typedef struct extra_logMeta_t {
	logMeta m;
	TargetId ignore_list[MAX_IGNORE_LIST+1]; // 0 terminated list of ignored targets
	// any other stuff later needed...
} extra_logMeta;


#define META_HAS_IGNORES(m) ( m.extras != 0 )
#define META_HAS_EXTRAS(m) ( m.extras != 0 )
#define META_IGNORE_LIST(s) grease_container_of(&s,struct extra_logMeta_t,m)->ignore_list
#define META_WITH_EXTRAS(s) grease_container_of(&s,struct extra_logMeta_t,m)

extern const logMeta __noMetaData;

//#define ZERO_LOGMETA(m) do { m.tag = 0; m.level = 0; m.origin = 0; m.target = 0; m._cached_hash = 0; m._cached_lists = { NULL, NULL, NULL } } while(0)
#define ZERO_LOGMETA(m) do { m = __noMetaData; } while(0)
#define META_HAS_CACHE(m) (m._cached_hash[0] != UINT64_C(0xFFFFFFFFFFFFFFFF))  // true if the cached hashes / list is being used
#define GREASE_SINK_FAILURE 5
#define GREASE_OVERFLOW 4
#define GREASE_INVALID_PARAMS 3
#define GREASE_NO_BUFFER 2
#define GREASE_FAILED 1
#define GREASE_OK 0

// Default Levels:
// these match up with greaseLog/index.js
#define GREASE_LEVEL_LOG     0x01
#define GREASE_LEVEL_ERROR   0x02
#define GREASE_LEVEL_WARN    0x04
#define GREASE_LEVEL_DEBUG   0x08
#define GREASE_LEVEL_DEBUG2  0x10
#define GREASE_LEVEL_DEBUG3  0x20
#define GREASE_LEVEL_USER1   0x40
#define GREASE_LEVEL_USER2   0x80
#define GREASE_LEVEL_SUCCESS 0x100
#define GREASE_LEVEL_INFO    0x0100
#define GREASE_LEVEL_TRACE   0x200

extern int (*grease_log)(const logMeta *f, const char *s, RawLogLen len);

extern const logMeta __noMetaData;
extern const uint32_t __grease_preamble;
extern const uint32_t __grease_sink_ping;
extern const uint32_t __grease_sink_ping_ack;


extern const logMeta __meta_logdefault;
extern const logMeta __meta_info;
extern const logMeta __meta_error;
extern const logMeta __meta_warn;
extern const logMeta __meta_debug;
extern const logMeta __meta_debug2;
extern const logMeta __meta_debug3;
extern const logMeta __meta_user1;
extern const logMeta __meta_user2;
extern const logMeta __meta_success;
extern const logMeta __meta_trace;

#define GREASE_C_MACRO_MAX_MESSAGE 250

#define GREASE_DEFAULT_SINK_PATH "/tmp/grease.socket"
#define GREASE_DEFAULT_CLIENT_PATH_TEMPLATE "/tmp/grease-client.XXXXXXXX";
#define GREASE_DEFAULT_PING_CLIENT "ping"

#define GREASE_VIA_SINK 3
#define GREASE_VIA_LOCAL 1
#define GREASE_NO_CONNECTION 0



#define GLOG(s,...) grease_printf(&__meta_logdefault, s, ##__VA_ARGS__ )
#define GLOG_INFO(s,...) grease_printf(&__meta_info, s, ##__VA_ARGS__ )
#define GLOG_ERROR(s,...) grease_printf(&__meta_error, s, ##__VA_ARGS__ )
#define GLOG_WARN(s,...) grease_printf(&__meta_warn, s, ##__VA_ARGS__ )
#define GLOG_DEBUG(s,...) grease_printf(&__meta_debug, s, ##__VA_ARGS__ )
#define GLOG_DEBUG2(s,...) grease_printf(&__meta_debug2, s, ##__VA_ARGS__ )
#define GLOG_DEBUG3(s,...) grease_printf(&__meta_debug3, s, ##__VA_ARGS__ )
#define GLOG_SUCCESS(s,...) grease_printf(&__meta_success, s, ##__VA_ARGS__ )
#define GLOG_TRACE(s,...) grease_printf(&__meta_trace, s, ##__VA_ARGS__ )
#define GLOG_USER1(s,...) grease_printf(&__meta_user1, s, ##__VA_ARGS__ )
#define GLOG_USER2(s,...) grease_printf(&__meta_user2, s, ##__VA_ARGS__ )

#define INIT_GLOG do { \
  int r = grease_initLogger(); \
  if(r != GREASE_OK) \
	  fprintf(stderr,"****** Failed to init grease logger (%d) ******\n",r); } while(0)
#define SHUTDOWN_GLOG grease_shutdown()

extern int grease_printf(const logMeta *m, const char *format, ... );
extern int _grease_logToRaw(const logMeta *f, const char *s, RawLogLen len, char *tobuf, RawLogLen *buflen);

/**
 * create a log entry for use across the network to Grease
 * @param f
 * @param s
 * @param len
 * @param tobuf A raw buffer to store the log output ready for processing
 * @param buflen A pointer to an int. This will be read to know the existing length of the buffer, and then set
 * the size of the buffer that should be sent
 * @return returns GREASE_OK if successful, or GREASE_NO_BUFFER if the buffer is too small. If parameters are
 * invalid returns GREASE_INVALID_PARAMS
 */
extern int grease_logToSink(const logMeta *f, const char *s, RawLogLen len);

/**
 * sets up the logger if using a local (in process) Grease server
 * @return GREASE_OK if successful, or GREASE_FAILED if not
 */
extern int grease_initLogger(void);


/**
 * sets up the logger if using a local (in process) Grease server.
 * This version does not try to ping the sink.
 * @return GREASE_OK if successful, or GREASE_FAILED if not
 */
extern int grease_fastInitLogger(void);

/**
 * shuts down the client
 */
extern void grease_shutdown(void);
/**
 * logs to local, in process Grease server. This is defined in logger.cc
 * @param f
 * @param s
 * @param len
 * @param tobuf
 * @param len
 */
extern int grease_logLocal(const logMeta *f, const char *s, RawLogLen len);

/**
 * Returns a value showing how the client is connected.
 * GREASE_VIA_SINK (a sink), GREASE_VIA_LOCAL (local methods - grease in proces),
 * or GREASE_NO_CONNECTION (in which case printfs are used)
 * @return int
 */
extern int grease_getConnectivityMethod();


#ifdef __cplusplus
};
#endif

#endif /* GREASE_LOG_H_ */
