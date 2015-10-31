var cmn = require('../libs/common.js');
var bufferpack = cmn.bufferpack;
var dbg = cmn.dbg;

var Attribute = function(params, attr, key) {
	 console.dir(params);
	 console.dir(attr);
	 console.dir(key);

	this.key = key;
	this.attributeType = Object.keys(attr)[0].split('_')[1];
	this.value = params[key];
	this.spec = this.getSpec(attr,key);
    this.buffer = this.setBuffer();
    this.isNest = (this.spec.type === 'r') ? true : false;
    this.isExpression = (this.spec.type === 'e') ? true : false;
    this.isList = (this.spec.type === 'l') ? true : false;
    this.isGeneric = (this.spec.type === 'g') ? true : false;
    this.isPayloadLen = this.spec.type === 'pl' ? true : false;
    this.isNested = this.isNest | this.isList | this.isExpression;

	var ns = this.isNested ? "(NEST)" : "";
	dbg("key = " + key + ns +
		" typeval = " + this.spec.typeval +
		" type = " + this.spec.type +
		" size = " + this.spec.size +
		" val = " + this.value );
	dbg("buf --> " + this.buffer.toString('hex'))
};

Attribute.prototype.getValue = function(attrObject, key) {
	// retrive the field specification string for that attribute subtype
	var param_name = key;
	var key_name = "NFTA_" + this.attributeType.toUpperCase() + "_" + param_name.toUpperCase();

	var key_value = attrObject[key_name];
	if(typeof key_value === 'undefined'){
		throw Error("key " + key_name +
			" does not exist in command object for type " + this.command_type);
	}
	return key_value;
};

Attribute.prototype.getSpec = function(attrObject,key){
	// retrive the field specification string for that attribute subtype
	var attr_subtype_specname = "NFTA_" + this.attributeType.toUpperCase() + "_SPEC";
	var spec_array = attrObject[attr_subtype_specname];
	if(typeof spec_array === 'undefined'){
		throw Error("command type " + this.attributeType + " does not exist");
	}

	var siz = -1;
	var typ = null;

	var keyval = this.getValue(attrObject, key);
	var spec = spec_array[keyval];
	var sl = spec.indexOf('/');
	if(sl > -1){
		typ = spec.slice(0,sl);
		siz = spec.slice(sl+1);
	} else {
		typ = spec;
	}

	return { typeval: keyval, type: typ, size: siz };
};

Attribute.prototype.getNestedAttributes = function(that,params) {
	var nest_attrs_type = null;
	if(this.isExpression) {  //expression
	 	nest_attrs_type =  params;
	} else if(this.isList) {
		nest_attrs_type = this.spec.size.split('_')[1];
	} else {
		nest_attrs_type = this.spec.size.split('_')[1];
	}
	var nest_attrs = that.getCommandObject(nest_attrs_type);
	return nest_attrs;
}

Attribute.prototype.incrementNestLength = function(size) {
	var len = this.buffer.readUInt16LE(0);
	var val = len + size;
	//console.log("curr_len = " + len + " size = " + size + " len = " + val);
	this.buffer.writeUInt16LE(size + len, 0 );
};

Attribute.prototype.getSize = function() {
	var len = this.buffer.readUInt16LE(0);
	return len;
};

Attribute.prototype.getBuffer = function(spec, value) {
	return this.buffer;
};

Attribute.prototype.setBuffer = function() {
	// console.dir(this)
	var buf = null;
	switch(this.spec.type) {
		case('s'): // string type attribute
			buf = this.getStringBuffer();
			break;
		case('n'): // number type attribute
		case('pl'):
			buf = this.getNumberBuffer();
			break;
		case('r'): // nested type attribute
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
	var buf = Buffer(this.value + '\0');
	var full_attribute = rt.buildRtattrBuf(this.spec.typeval, buf);
	return full_attribute;
};

Attribute.prototype.getGenericBuffer = function() {

	var len = 1;
	var val = 0;
	var strval = "";
	var hex = -1;

	try {
		strval = this.value.toLowerCase();
		hex = strval.indexOf('x');
		if(hex !== -1) {
			val = parseInt(strval,16);
			len = (strval.length - (hex + 1)) / 2; // two nibbles per byte
		} else {
			val = parseInt(strval,10);
			len = parseInt(strval,16).toString().length / 2;
		}
	} catch(err) {
		throw new Error("no way to parse: " + this.value);
	}
	if(val === NaN) throw new Error("no way to parse: " + this.value);

	var buf = Buffer(len);
	switch(len) {
		case 1:
			buf.writeUInt8(val,0,len);
			break;
		case 2:
			buf.writeUInt16BE(val,0,len);
			break;
		case 4:
			buf.writeUInt32BE(val,0,len);
			break;
		case 8:
			// TODO: verify the ordering of the 4 byte chunks
			buf.writeUInt32BE(val << 32,0,4 );
			buf.writeUInt32BE(val,4,len);
			break;
	}
	var full_attribute = rt.buildRtattrBuf(this.spec.typeval, buf);
	return full_attribute;
};

Attribute.prototype.getNumberBuffer = function() {
	var len = this.spec.size / 8;
	var buf = Buffer(len);
	switch(len) {
		case 1:
			buf.writeUInt8(this.value.valueOf(),0,len);
			break;
		case 2:
			buf.writeUInt16BE(this.value.valueOf(),0,len);
			break;
		case 4:
			buf.writeUInt32BE(this.value.valueOf(),0,len);
			break;
		case 8:
			// TODO: verify the ordering of the 4 byte chunks
			buf.writeUInt32BE(this.value.valueOf() << 32,0,4 );
			buf.writeUInt32BE(this.value.valueOf(),4,len);
			break;
	}
	var full_attribute = rt.buildRtattrBuf(this.spec.typeval, buf);
	return full_attribute;
};

Attribute.prototype.getNestedBuf = function() {
	var buf = Buffer([0,0,0,0]);
	buf.writeUInt16LE(4, 0);
	buf.writeUInt16LE(nf.flags.NLA_F_NESTED | this.spec.typeval, 2 );
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

module.exports = Attribute;