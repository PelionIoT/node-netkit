
var netkit = require('../index.js');

var bufferpack = require('../libs/bufferpack.js');
var rtnetlink = require('../rtnetlink.js');

var util = require('util');

var values = [1, 2, 0x123abc, 'atest', 'somethingelse'];

var format = '<B(first)b(second)xxL(third)5s(other)xxxS(something)'; // the 'x''s are needed for C/C++ byte alignment. 
// http://www.c-faq.com/struct/align.html

var packed = bufferpack.pack(format, values);

console.dir(packed);

netkit.packTest(packed);

// also test our little additions to bufferpack

var obj = bufferpack.metaObject(format);

console.dir(obj);

obj.first = 1;
obj.second = 2;
obj.third = 0x123abc;
obj.other = 'atest';
obj.something = 'somethingelse';

var packed2 = bufferpack.pack(format,obj.toValArray());

netkit.packTest(packed2);

//var packed3 = bufferpack.pack(obj);
var packed3 = obj.pack();

var obj = rtnetlink.buildHdr();
//var netlinkhdr = 
console.dir(obj);
obj._seq = 0xabcd0123;  // test endianess
obj._pid = 0x67899876;  // test endianess
console.dir(obj.pack());


netkit.packTest(packed3, obj.pack());

console.log('---------');

var ret = netkit.util.bufferifyMacString('AA:bb:cC:d0:00:90');

console.log("result: " + util.inspect(ret));

