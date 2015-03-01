var nk = require('../index.js');

nk.onProcessChange(function(err, buf){
	if(err) {
		console.error(err);
	} else {
		console.dir(buf);
	}
});
