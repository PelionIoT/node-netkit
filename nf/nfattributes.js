
var Attribute = require('./nfattr.js');
var cmn = require('../libs/common.js');
var nf = require('../nl/nfnetlink.js');

var bufferpack = cmn.bufferpack;
var debug = cmn.logger.debug;
var error = cmn.logger.error;


var NfAttributes = function(command_type, parameters) {
	this.command_type = null;
	this.attribute_array = [];
	// The object that has the attribute defines
	this.command_object = this.getCommandObject(command_type);

	// The command line attribute object passed in
	this.parameters = parameters;

	// Get the array of Attribute objects
	this.parseNfAttrs(this.parameters, this.command_object);
};

NfAttributes.prototype.updateNestHdrLen = function(a, nstart) {
	var size = 0;
	for(var i = nstart; i < this.attribute_array.length; i++) {
		var attr = this.attribute_array[i];
		size += attr.getBuffer().length;
	}

	a.incrementNestLength(size);
	debug("** nest end - " + a.key + " : " + size.toString(16) );
};

NfAttributes.prototype.getCommandObject = function(type){
	var command_object = nft['nft_' + type + '_attributes'];
	if(typeof command_object === 'undefined'){
		throw Error("command type " + type + " does not exist");
	}
	this.command_type = type;
	return command_object;
};

NfAttributes.prototype.writeAttributes = function(bufs) {
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

NfAttributes.prototype.logAttributeBuffers = function() {
	var that = this;
    var keys = Object.keys(this.attribute_array);
	keys.forEach(function(attr) {
		var bf = that.attribute_array[attr].buffer;
		if(bf) {
			debug("attr ---> " + bf.toString('hex'));
		}
	});
};

NfAttributes.prototype.generateNetfilterResponse = function(bufs) {
	//console.dir(bufs);

	var result_array = []; // array if this is a multipart message

	// parse all response messages
	for(var i = 0; i < bufs.length; i++) {
		var data = bufs[i];

		// is this the done message of a multi-part message?
		var type = data.readUInt16LE(4);// & 0x00FF;
		if(type === nl.NLMSG_DONE) {
			return result_array;
		} else if(type === nl.NLMSG_ERROR) {
			return {};
		}

		// get the generic netfiler generation
		var nfgenmsg = nf.unpackNfgenmsg(data, 16);

		// get the total message length and parse all the raw attributes
		var total_len = data.readUInt32LE(0);
		var cur_result = {};
		cur_result['genmsg'] = nfgenmsg;
		cur_result['payload'] = this.parseNfAttrsFromBuffer(data, type);

		// get the message flags
		var flags = data.readUInt16LE(6);
		if(flags & nl.NLM_F_MULTI) {
			// mutlipart message add to array result
			result_array[i] = cur_result;
		} else {
			// just one response message so return it
			return cur_result;
		}
	}
	return result_array;
};

NfAttributes.prototype.parseNfAttrsFromBuffer = function(buffer, type) {
	var ret = {};
	var type = buffer.readUInt16LE(4) & 0x00FF;
	//debug("buffer: " + buffer.toString('hex') );

	if(!buffer || !Buffer.isBuffer(buffer) || buffer.length < 16) {
		return ret;
	} else {
		var total_len = buffer.readUInt32LE(0);
		if(total_len != buffer.length) {
			return ret;
		}

		var index = 16; // start after the msghdr
		var name = "";
		var keys;
		if(nf.NFT_MSG_NEWTABLE <= type && type <= nf.NFT_MSG_DELTABLE) {
		    //debug('TABLE');
			keys = nft.nft_table_attributes
			name = 'table';
		} else if(nf.NFT_MSG_NEWCHAIN <= type && type <= nf.NFT_MSG_DELCHAIN) {
		    //debug('CHAIN');
			keys = nft.nft_chain_attributes
			name = 'chain';
		} else if(nf.NFT_MSG_NEWRULE <= type && type <= nf.NFT_MSG_DELRULE) {
		    //debug('RULE');
			keys = nft.nft_rule_attributes
			name = 'rule';
		} else if(nf.NFT_MSG_NEWSET <= type && type <= nf.NFT_MSG_DELSET) {
		    //debug('SET');
			name = 'set';
			throw new Error("set not implemented yet");
		} else if(nf.NFT_MSG_NEWSETELEM <= type && type <= nf.NFT_MSG_DELSETELEM) {
		    //debug('SETELEM');
			name = 'setelem';
			throw new Error("setelem not implemented yet");
		} else if(nf.NFT_MSG_NEWGEN <= type && type <= nf.NFT_MSG_DELGEN) {
		    //debug('GEN');
			name = 'gen';
			throw new Error("gen not implemented yet");
		}else {
			console.warn("WARNING: ** Received unsupported message type from netlink socket(type="
				+ type + ") **");
			return ret;
		}

		// skip the nfgenmsg header
		index += 4;

		// debug('start index = ' + index);
		var payload = this.parseAttrsBuffer(buffer, index, total_len, keys );
		//this.logAttributeBuffers();

		ret['operation'] = nf.getNfTypeName(type);
		ret[name] = payload;
	}
	return ret;
};

NfAttributes.prototype.parseNfAttrs = function(params, attrs, expr_name) {
	//debug("params");
	//console.dir(params);
	if(params == null) return;

    var that = this;
    var keys = Object.keys(params);
	keys.forEach(function(key) {

		var a = new Attribute(params,attrs,key);

		if(a.isNest) {
			// push a nest header attribute
			var nstart = that.attribute_array.push(a);

			// recurse over the nested params
			var nest_attrs = a.getNestedAttributes(that,params);
			that.parseNfAttrs(a.value, nest_attrs, a.value.name);

			that.updateNestHdrLen(a, nstart);
		} else if(a.isList){
			// push a normal attribute
			var lstart = that.attribute_array.push(a);

			// recurse over the list elements
			 var elems = Object.keys(a.value);
			 elems.forEach(function(elem){
			 	var elem_attrs = a.getNestedAttributes(that,params);
				that.parseNfAttrs(a.value[elem], elem_attrs);
			});

		 	that.updateNestHdrLen(a, lstart);

		} else if(a.isExpression){
			var estart = that.attribute_array.push(a);
			var expr_attrs = a.getNestedAttributes(that, expr_name);
			that.parseNfAttrs(a.value, expr_attrs);
			that.updateNestHdrLen(a, estart);
		} else if(a.isGeneric) {
			// push a normal attribute
			that.attribute_array.push(a);
		} else {
			// push a normal attribute
			that.attribute_array.push(a);
		}
	});
};

NfAttributes.prototype.parseAttrsBuffer = function(buffer, start, total_len, keys) {
	var ret = {};
	var index = start;
	var nested_attributes = [];
	var nested_indexes = [];
	var expression = "";
	var expression_count;
	var expression_ret = null;
	var element_ret = null;
	//console.dir(keys);

	while(index < total_len) {
		var len = buffer.readUInt16LE(index);
		var round_len = len + ((len % 4) ? 4 - (len % 4) : 0);
		var remaining = buffer.slice(index, index + round_len);
		//console.log('\n');
		//console.log('index = ' + index + ' round_len = ' + round_len);

		var attribute = new Attribute(keys, remaining);
		this.attribute_array.push(attribute);

		if (attribute.isNested){
			//console.log("nested");
			nested_attributes.push(attribute);
			nested_indexes.push(attribute.buffer_size + index);

			index += 4;

			if(attribute.isExpression) {
				keys = attribute.getNestedAttributes(this, expression );
			} else {
				keys = attribute.getNestedAttributes(this, keys);
			}

		} else {
			//console.log("normal");
			expression = attribute.value;
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

					l = nested_indexes[nested_indexes.length - 1];
				}
			}
		}

		if(typeof(attribute.value) != 'undefined') {
			if(element_ret !== null) {
				element_ret[element_ret_count++] = attribute.key + " = " + attribute.value;
			} else {
				ret[attribute.key] = attribute.value;
			}
		} else {
			if(attribute.key == 'expressions') {

				expression_ret = [];
				expression_count = 0;
				ret['expressions'] = expression_ret;

			} else if(attribute.key == 'elem'){

				element_ret = []; element_ret_count = 0;
				expression_ret[expression_count++] = element_ret;
			} //else {}
		}
	};

	return ret;
};


module.exports = NfAttributes;