
var Attribute = require('./nfattr.js');
var cmn = require('../libs/common.js');
var bufferpack = cmn.bufferpack;
var dbg = cmn.dbg;


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
	dbg("** nest end - " + a.key + " : " + size.toString(16) );
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
			dbg("attr ---> " + bf.toString('hex'));
			bufs.push(bf);
		}
	});
};

NfAttributes.prototype.parseNfAttrs = function(params, attrs, expr_name) {
	//console.log("params");
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

module.exports = NfAttributes;