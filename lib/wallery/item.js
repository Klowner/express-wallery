var _ = require('lodash'),
	helpers = require('./helpers');


// Generate an item and wrap it in a helpful prototype
function itemFactoryGenerator (wallery) {
	var proto = {
		thumbnail: function (size, format) {
			return helpers.getWalleryThumbURI(wallery, this, size, format);
		}
	};

	return function itemFactory (params) {
		var f = function () { _.extend(this, params); };
		f.prototype = proto;
		return new f(params);
	}
}

module.exports.itemFactoryGenerator = itemFactoryGenerator;
