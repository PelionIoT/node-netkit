
var Attribute = require('../nl/nlattr.js');
var cmn = require('../libs/common.js');
var nf = require('../nl/nfnetlink.js');
var util = require('util');

var bufferpack = cmn.bufferpack;
var debug = cmn.logger.debug;
var error = cmn.logger.error;


var NlAttributes = function(command_type, parameters, netlink_type) {
	this.command_type = null;
	this.attribute_array = [];
	this.netlink_type = netlink_type;

	// The object that has the attribute defines
	this.command_object = this.netlink_type.getCommandObject(command_type);

	// The command line attribute object passed in
	this.parameters = parameters;

	// Get the array of Attribute objects
	this.parseNlAttrs(this.parameters, this.command_object);
};

NlAttributes.prototype.updateNestHdrLen = function(a, nstart) {
	var size = 0;
	for(var i = nstart; i < this.attribute_array.length; i++) {
		var attr = this.attribute_array[i];
		size += attr.getBuffer().length;
	}

	a.incrementNestLength(size);
	//debug("** nest end - " + a.key + " : " + size.toString(16) );
};

NlAttributes.prototype.writeAttributes = function(bufs) {
	var that = this;
    var keys = Object.keys(this.attribute_array);
	keys.forEach(function(attr) {
		var bf = that.attribute_array[attr].getBuffer();
		if(bf) {
			debug("attr ---> " + bf.toString('hex'));
			bufs.push(bf);
		}
	});
};

NlAttributes.prototype.logAttributeBuffers = function() {
	var that = this;
    var keys = Object.keys(this.attribute_array);
	keys.forEach(function(attr) {
		var bf = that.attribute_array[attr].buffer;
		if(bf) {
			debug("attr ---> " + bf.toString('hex'));
		}
	});
};

NlAttributes.prototype.generateNetlinkResponse = function(bufs, transform) {
	//console.dir(bufs);

	var result_array = []; // array if this is a multipart message

	// parse all response messages
	for(var i = 0; i < bufs.length; i++) {
		var data = bufs[i];

		// is this the done message of a multi-part message?
		var type = this.netlink_type.getTypeFromBuffer(bufs[i]);
		if(type === nl.NLMSG_DONE) {
			return result_array;
		} else if(type === nl.NLMSG_ERROR) {
			return {};
		}

		// get the total message length and parse all the raw attributes
		var total_len = data.readUInt32LE(0);
		var cur_result = {};

		// get the generic netfiler generation
		var genmsg = this.netlink_type.parseGenmsg(data);

		if(typeof genmsg !== 'undefined') cur_result['genmsg'] = genmsg;
		cur_result['payload'] = this.parseNlAttrsFromBuffer(data, type);

		// get the message flags
		var flags = data.readUInt16LE(6);
		if(flags & nl.NLM_F_MULTI) {

			// determine if this should be filtered based on the  parameters of the command
			var filter = false;
			var op = cur_result.payload.operation;
			if(op.startsWith('new')) {
				var that = this;
				var entity = cur_result.payload[op.substring(3)];
				if(typeof this.parameters === 'object') {

					Object.keys(this.parameters).forEach(function(key){
						if(!entity.hasOwnProperty(key) ||  entity[key] !== that.parameters[key])
							filter = true;
					});
				}
			}
			// mutlipart message add to array result
			if(!filter){
				if(typeof transform != 'undefined') {
					cur_result['payload'] = transform(cur_result);
				}
				result_array[i] = cur_result;
			}

		} else {
			// just one response message so return it
			if(typeof transform != 'undefined') {
				cur_result['payload'] = transform(cur_result);
			}
			return cur_result;
		}
	}
	return result_array;
};

NlAttributes.prototype.parseNlAttrs = function(params, attrs, expr_name) {
	// debug("================= attrs ==================");
	// console.dir(attrs);

	var prior_value;
	if(params == null) return;

    var that = this;
    var keys = Object.keys(params);
	keys.forEach(function(key) {

		var a = new Attribute(that)
		a.makeFromKey(params,attrs,key);

		if(a.isNest || a.isFunction) {

			// push a nest header attribute
			var nstart = that.attribute_array.push(a);

			// recurse over the nested params
			var nest_attrs;
			if(a.isFunction) {
				nest_attrs = a.getNestedAttributes(that, attrs, prior_value);
			} else {
				nest_attrs = a.getNestedAttributes(that, params);
			}

			that.parseNlAttrs(a.value, nest_attrs, a.value.name);
			that.updateNestHdrLen(a, nstart);


		} else if(a.isList){

			// push a normal attribute
			var lstart = that.attribute_array.push(a);

			// recurse over the list elements
			 var elems = Object.keys(a.value);
			 elems.forEach(function(elem){
			 	var elem_attrs = a.getNestedAttributes(that, params);
				that.parseNlAttrs(a.value[elem], elem_attrs);
			});

		 	that.updateNestHdrLen(a, lstart);

		} else if(a.isExpression){

			var estart = that.attribute_array.push(a);
			var expr_attrs = a.getNestedAttributes(that, expr_name);
			that.parseNlAttrs(a.value, expr_attrs);
			that.updateNestHdrLen(a, estart);

		} else if(a.isGeneric) {
			// push a normal attribute
			that.attribute_array.push(a);
		} else {
			// push a normal attribute
			that.attribute_array.push(a);
		}
		prior_value = a.value;
	});
};

NlAttributes.prototype.parseAttrsBuffer = function(buffer, start, total_len, keys) {
	var ret = {};
	var index = start;
	var nested_attributes = [];
	var nested_indexes = [];
	var parent_value = "";
	var expression_count;
	var expression_ret = null;
	var element_ret = null;
	var inIndex = false;
	//console.dir(keys);

	while(index < total_len) {
		var len = buffer.readUInt16LE(index);
		var round_len = len + ((len % 4) ? 4 - (len % 4) : 0);
		var remaining = buffer.slice(index, index + round_len);
		//console.log('\n');
		//console.log('index = ' + index + ' round_len = ' + round_len);

		var attribute = new Attribute(this);

		if(!inIndex) {
			attribute.makeFromBuffer(keys, remaining);
			this.attribute_array.push(attribute);
		}

		if(attribute.isIndexed) {
			inIndex = true; // don't care about indexed recursions like TID STATS for now
		}

		if(attribute.isNested){
			//console.log("nested");
			nested_attributes.push(attribute);
			nested_indexes.push(attribute.buffer_size + index);

			index += 4;

			if(attribute.isExpression) {
				keys = attribute.getNestedAttributes(this, parent_value );
			} else if(attribute.isFunction) {
				keys = attribute.getNestedAttributes(this, keys, parent_value );
			} else {
				keys = attribute.getNestedAttributes(this, keys);
			}

		} else {
			parent_value = attribute.value;
			index += round_len;

			// Are we parsing inside a nested attribute
			if(nested_attributes.length > 0) {
				// Have we reached the end of the current nest?
				var l = nested_indexes[nested_indexes.length - 1];
				while(index >= l) {
					// Yes, so get the attribute list of what we were parsing before
					nested_indexes.pop();
					var attr = nested_attributes.pop();
					keys = attr.attribute_list;

					if(attr.isIndexed) {
						inIndex = false;
					}

					l = nested_indexes[nested_indexes.length - 1];
				}
			}
		}

		// debug('attribute.value -> ' + attribute.value);
		// debug('attribute.key -> ' + attribute.key);
		// debug('element_ret -> ' + element_ret);

		if(typeof(attribute.value) !== 'undefined') {
			if(element_ret !== null) {
				element_ret[element_ret_count++] = attribute.key + " = " + attribute.value;
			} else if(expression_ret !== null) {
				expression_ret[expression_count++] = attribute.key + " = " + attribute.value;
			} else {
				ret[attribute.key] = attribute.value;
			}
		} else {
			if(attribute.key ==='expressions' || attribute.key === 'linkinfo') {

				expression_ret = [];
				expression_count = 0;
				ret[attribute.key] = expression_ret;

			} else if(attribute.key === 'elem' || attribute.key === 'infodata') {

				element_ret = []; element_ret_count = 0;
				expression_ret[expression_count++] = element_ret;
			} //else {}
		}

	};

	return ret;
};

NlAttributes.prototype.parseNlAttrsFromBuffer = function(buffer, type) {
	//debug("msghdr: " + buffer.slice(0,16).toString('hex') );

	var ret = {};

	if(!buffer || !Buffer.isBuffer(buffer) || buffer.length < 16) {
		return ret;
	} else {
		var total_len = buffer.readUInt32LE(0);
		if(total_len != buffer.length) {
			return ret;
		}

		var index = 16; // start after the msghdr

		var attribute_map = this.netlink_type.getAttributeMap(type);
		var name = attribute_map.name;
		var keys = attribute_map.keys;

		// skip the header,header payload padding that rounds the message up to multiple of 16
		if(this.netlink_type.getPayloadSize) {
			index += this.netlink_type.getPayloadSize(type);
		} else {
			index += 4;
		}

		//debug('start index = ' + index);
		//debug("buffer: " + buffer.slice(index).toString('hex') );
		var payload = this.parseAttrsBuffer(buffer, index, total_len, keys );
		//this.logAttributeBuffers();

		ret['operation'] = this.netlink_type.getNlTypeName(type);
		ret[name] = payload;
	}
	return ret;
};


module.exports = NlAttributes;