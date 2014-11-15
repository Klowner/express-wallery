var _ = require('lodash'),
	helpers = require('./helpers');


// Generate an item and wrap it in a helpful prototype
function itemFactoryGenerator (wallery) {
	var proto = {
		thumbnail: function (size, format) {
			return helpers.getWalleryThumbURI(wallery, this, size, format);
		},

		analyzeColors: function (count) {
			var self = this;
			if (this.colors && this.colors.length === count) { return this.colors; }

			return helpers.analyzeColors(wallery, this, count)
				.then(function (colors) {
					return (self.colors = colors);
				});
		},

		getDownloads: function (formats) {
			var self = this;

			if (this.downloads) {
				return this.downloads;
			}


			return helpers.getWalleryDownloads(wallery, this, formats)
				.then(function (downloads) {
					return (self.downloads = downloads);
				});
		},

		getSimilarByTags: function (count, exclude) {
		  return helpers.getWallerySimilarByTags(wallery, this, count, exclude);
		}
	};

	return function itemFactory (params) {
		var f = function () { _.extend(this, params); };
		f.prototype = proto;
		return new f(params);
	};
}

module.exports.itemFactoryGenerator = itemFactoryGenerator;
