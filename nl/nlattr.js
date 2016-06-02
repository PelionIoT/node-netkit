'use strict';

var cmn = require('../libs/common.js');
var bufferpack = cmn.bufferpack;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var util = require('util');
var bignum = require('bignum');
var rt = require('./rtnetlink.js');
/*
* Attribute creator
* @params -
*
*/


/*
	Atribute spec definitions

	s  - string,  no size needed
	n  - number, size in bytes needed
	pl - payload length, used during byte string decode.
		 indicates payload lengths
	r  - recurse, or nested attribute by name only, no size
	i  - increment, no size.  used to indcate following
	     nested attribute array are all the same type with
	     incremeinting type vals
	g  - general, used to indicate a generic sized buffered number
	l  - list, a list of all the same type
	e  - expression, the nested type is specified by embedded name filed
	m  - mac address, decode as such, encode as such - currently ip4 only
*/

var Attribute = function(that) {
	this.netlink_type = that.netlink_type;
};

Attribute.prototype.makeFromKey = function(params, attr_object, key) {
	this.key = key;
	this.attribute_list = params;

	try {
		this.attributeType = Object.keys(attr_object)[0].split('_')[1];
	} catch(e) {
		throw Error("key [" + key_name + "] for attribute [" + this.attributeType +
			"] does not exist in command object: " + util.inspect(attrObject) );
	}

	this.value = params[key];
	this.spec = this.getSpec(attr_object,key);
    this.buffer = this.setBuffer();
	this.buffer_size = this.buffer.length;

	this.setIdentities();

	//Output some debug parsing info
	// var ns = this.isNested ? "(NEST)" : "";
	// debug("key = " + key + ns +
	// 	" typeval = " + this.spec.typeval +
	// 	" type = " + this.spec.type +
	// 	" size = " + this.spec.size +
	// 	" val = " + this.value );
	// debug("buf --> " + this.buffer.toString('hex'))
};

Attribute.prototype.makeFromBuffer =  function(attr_list, attr_buffer) {
	// debug('attr_list = ' + util.inspect(attr_list));
	// debug("attr --> " + attr_buffer.toString('hex') );

	this.attribute_list = attr_list;
	this.buffer = attr_buffer;
	this.buffer_size = attr_buffer.length;

	var index = attr_buffer.readUInt16LE(2); // & (~0x20);
	try {
		var remain = Object.keys(attr_list)[index].split('_');
		remain.shift();
		remain.shift();
		this.key = remain.join('_').toLowerCase();

	} catch(e) {
		throw Error("index [" + index + "] does not exist in object: " + util.inspect(attr_list) );
	}

	this.attributeType = Object.keys(attr_list)[0].split('_')[1];

	this.spec = this.getSpec(attr_list,this.key);
	this.value = this.getBufferAsValue(attr_buffer);

	this.setIdentities();
	if(this.isNested) {
		this.buffer = this.buffer.slice(0,4);
	}

//	 debug("buf --> " + this.buffer.toString('hex'))
	 // var ns = this.isNested ? "(NEST)" : "";
	 // debug("key = " +this.key + ns +
	 // 	" typeval = " + this.spec.typeval +
	 // 	" type = " + this.spec.type +
	 // 	" size = " + this.spec.size +
	 // 	" val = " + this.value );
};

Attribute.prototype.setIdentities = function() {
    this.isNest = (this.spec.type === 'r') ? true : false;
    this.isExpression = (this.spec.type === 'e') ? true : false;
    this.isList = (this.spec.type === 'l') ? true : false;
    this.isGeneric = (this.spec.type === 'g') ? true : false;
    this.isIndexed = (this.spec.type === 'i') ? true : false;
    this.isPayloadLen = this.spec.type === 'pl' ? true : false;
    this.isFunction = this.spec.type === 'f' ? true : false;
    this.isNested = this.isNest | this.isList | this.isExpression | this.isIndexed | this.isFunction;
};

Attribute.prototype.getValue = function(attrObject, key) {
	// retrive the field specification string for that attribute subtype
	var key_name = this.netlink_type.get_prefix() + this.attributeType.toUpperCase() + "_" + key.toUpperCase();
	var key_value = attrObject[key_name];
	// console.log("key_name = " + key_name);
	if(typeof key_value === 'undefined'){
		throw Error("key [" + key_name + "] for attribute [" + this.attributeType +
 			"] does not exist in command object: " + util.inspect(attrObject) );
	}
	return key_value;
};

Attribute.prototype.getSpec = function(attrObject,key){
	// retrive the field specification string for that attribute subtype
	var attr_subtype_specname = this.netlink_type.get_prefix() + this.attributeType.toUpperCase() + "_SPEC";
	var spec_array = attrObject[attr_subtype_specname];

	if(typeof spec_array === 'undefined'){
		throw Error("command " +attr_subtype_specname + " does not exist in object: " + util.inspect(attrObject));
	}
	var siz = -1;
	var typ = null;

	var speckeyval = this.getValue(attrObject, key);
	var spec = spec_array[speckeyval];

	// console.log("speckeyval = " + speckeyval);
	// console.log("spec = " + spec);

	if(typeof spec === 'undefined') {
		throw Error("spec ["+ speckeyval + "] not found  in " + attr_subtype_specname + " : " + util.inspect(spec_array));
	}

	var sl = spec.indexOf('/');
	if(sl > -1){
		typ = spec.slice(0,sl);
		siz = spec.slice(sl+1);
	} else {
		typ = spec;
	}

	return { typeval: speckeyval, type: typ, size: siz };
};

Attribute.prototype.getNestedAttributes = function(that,params,funcval) {
	var get_attr_type = this.netlink_type.getAttrType ||
		function(spec) { return spec.split('_')[1]; };

	var nest_attrs_type = null;
	if(this.isExpression) {  //expression
	 	nest_attrs_type =  params;
	} else if(this.isFunction) {

        var func = params[this.spec.size];
        if(typeof func === 'function') {
            nest_attrs_type = func(funcval);
        } else {
            throw new Error("no function found by name '" + this.spec.size + "' in object " + util.inspect(params));
        }
	} else {
		nest_attrs_type = get_attr_type(this.spec.size);
	}

	var nest_attrs = this.netlink_type.getCommandObject(nest_attrs_type);
	return nest_attrs;
}

Attribute.prototype.incrementNestLength = function(size) {
	var len = this.buffer.readUInt16LE(0);
	this.buffer.writeUInt16LE(size + len, 0 );
};

Attribute.prototype.getSize = function() {
	var len = this.buffer.readUInt16LE(0);
	return len;
};

Attribute.prototype.getBuffer = function() {
	return this.buffer;
};

Attribute.prototype.setBuffer = function() {
	// console.dir(this)
	//debug('this.spec.type = ' + this.spec.type);
	var buf = null;
	switch(this.spec.type) {
		case('s'): // string type attribute
			buf = this.getStringBuffer();
			break;
		case('n'): // number type attribute
		case('pl'):
			buf = this.getNumberBuffer();
			break;
		case('m'): // mac address element
			buf = new Buffer(this.value,'hex');
			break;
		case('r'): // nested type attribute
		case('i'): // indexed type attribute
		case('f'): // function type attribute
			buf = this.getNestedBuf();
			break;
		case('g'): // nested type attribute
			buf = this.getGenericBuffer();
			break;
		case('l'): // nested type attribute
			buf = this.getListBuf();
			break;
		case('e'): // nested element type attribute
			buf = this.getElementBuf();
			break;
		default:
			throw new Error("undefined attribute spec type: " + this.spec.type);
	}
	return buf;
};

Attribute.prototype.getStringBuffer = function() {
	var buf = Buffer(this.value); // + '\0');
	var full_attribute = rt.buildRtattrBuf(this.spec.typeval, buf);
	return full_attribute;
};

Attribute.prototype.getGenericBuffer = function() {

	var len = 1;
	var val = 0;
	var strval = "";
	var hex = -1;
	var buf;

	try {
		strval = this.value.toLowerCase();
		hex = strval.indexOf('x');
		var isLetters = cmn.isASCIILetters(strval);

		if(hex !== -1) {
			len = (strval.length - (hex + 1)) >> 1; // two nibbles per byte
		} else {
			if(isLetters) {
				len = strval.length;
			} else {
				len = parseInt(strval,16).toString().length / 2;
			}
		}

		if(!isLetters) {
			if(len < 1 || len > 8) throw new Error("attribute length not within 1 - 8 bytes in length: " + this.value);
			if(hex !== -1) {
				val = bignum(strval.slice(hex + 1),16);
			} else {
				val = bignum(strval,10);
			}

		if(isNaN(val)) throw new Error("no way to parse: " + this.value);
			buf = val.toBuffer({endian:'big', size:len});

		} else {
			buf = new Buffer(len);
			buf.fill(0);
			buf.write(strval);
		}

		var full_attribute = rt.buildRtattrBuf(this.spec.typeval, buf);
		return full_attribute;

	} catch(err) {
		throw new Error("no way to parse: " + this.value);
	}
};

Attribute.prototype.getNumberBuffer = function() {
	var len = this.spec.size / 8;
	var buf = Buffer(len);
	switch(len) {
		case 1:
			buf.writeUInt8(this.value.valueOf(),0,len);
			break;
		case 2:
			this.netlink_type.writeUInt16(buf, this.value.valueOf(),0,len);
			break;
		case 4:
			this.netlink_type.writeUInt32(buf,this.value.valueOf(),0,len);
			break;
		case 8:
			if(this.value.startsWith("0x")) {
				this.value = this.value.slice(2);
				this.value = bignum(this.value, 16);
			} else {
				this.value = bignum(this.value, 10);
			}
			buf = this.value.toBuffer({endian:'big',size:8});
			break;
	}
	var full_attribute = rt.buildRtattrBuf(this.spec.typeval, buf);
	return full_attribute;
};

Attribute.prototype.getNestedBuf = function() {
	var buf = Buffer([0,0,0,0]);
	buf.writeUInt16LE(4, 0);
	buf.writeUInt16LE(/*nf.flags.NLA_F_NESTED |*/ this.spec.typeval, 2 );
	return buf;
};

Attribute.prototype.getListBuf = function() {
	var buf = Buffer([0,0,0,0]);
	buf.writeUInt16LE(4, 0);
	buf.writeUInt16LE(nf.flags.NLA_F_NESTED | this.spec.typeval, 2 );
	return buf;
};

Attribute.prototype.getElementBuf = function() {
	var buf = Buffer([0,0,0,0]);
	buf.writeUInt16LE(4, 0);
	buf.writeUInt16LE(nf.flags.NLA_F_NESTED | this.spec.typeval, 2 );
	return buf;
};

Attribute.prototype.getBufferAsValue = function(buffer) {
	switch(this.spec.type) {
		case('s'): // string type attribute
			return this.getBufferAsString(buffer);
		case('n'): // number type attribute
		case('pl'):
			return this.getBufferAsNumber(buffer);
		case('r'): // nested type attribute
		case('i'): // nested type attribute
			break;
		case('g'): // nested type attribute
			return this.getBufferAsGeneric(buffer);
		case('l'): // nested type attribute
			break;
		case('e'): // nested element type attribute
			break;
		case('m'): // mac address type attribute
			return cmn.bufferAsMacAddress(buffer.slice(4,10));
	}
	return;
};

Attribute.prototype.getBufferAsString = function(buffer) {
	var attr_length = buffer.readUInt16LE(0);
	var str_len = buffer.indexOf('\0', 4);

	// if(str_len > attr_len)
	// 	throw new Error('Attributes string temintator not found within attribute length');

	return buffer.toString('ascii', 4, str_len );
};

Attribute.prototype.getBufferAsNumber = function(buffer) {
	// debug('this.spec.size = ' + this.spec.size);
	// debug("buf --> " + buffer.toString('hex'))
	var val = 0;
	switch (this.spec.size) {
		case '8':
			val = buffer.readUInt8(4);
			break;
		case '16':
			val = this.netlink_type.readUInt16(buffer, 4);
			break;
		case '32':
			val = this.netlink_type.readUInt32(buffer,4);
			break;
		case '64':
			// TODO: verify the ordering of the 4 byte chunks
			val = this.netlink_type.readUInt32(buffer,4);
			val |= this.netlink_type.readUInt32(buffer,8) << 32;
			break;
		default:
			throw new Error("bad number field size: " + this.spec.size);
	}
	return val;
};

Attribute.prototype.getBufferAsGeneric = function(buffer) {
	//debug("buf --> " + buffer.toString('hex'))
	var len = buffer.readUInt16LE(0) - 4; // take away attribute header len
	var buf = buffer.slice(4,4 + len);
	var val;
	switch (len) {
		case 1:
			val = buf.readUInt8(0);
			break;
		case 2:
			val = this.netlink_type.readUInt16(buf,0);
			break;
		case 4:
			val = this.netlink_type.readUInt32(buf,0);
			break;
		case 8:
			// TODO: verify the ordering of the 4 byte chunks
			val = this.netlink_type.readUInt32(buf,0);
			val |= this.netlink_type.readUInt32(buf,4) << 32;
			break;
		default:
			//throw new Error("bad generic number field size: " + this.spec.size);
			// var end = 0;
			// for(var pair of buf.entries()) {
			// 	if(pair[1] === 0) break;
			// 	end++;
			// }
			return buf.slice(0,len);//.toString('ascii');
			break;
	}
	return '0x' + Number(val).toString(16);
};

module.exports = Attribute;