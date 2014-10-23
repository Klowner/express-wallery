var utils = require('./utils'),
	path = require('path'),
	_ = require('lodash');

function createHelpers (wallery) {
	var options = wallery.options;
	var helpers = {
		getWalleryItems: getWalleryItems.bind(undefined, wallery),
		getWalleryThumbURI: getWalleryThumbURI.bind(undefined, wallery),
		analyzeColors: analyzeColors.bind(undefined, wallery)
	};

	return helpers;
}
module.exports = createHelpers;


function getWalleryItems (wallery, sortBy) {
	var cache = 'items' + (sortBy ? '_' + sortBy : '');

	if (wallery.cache[cache])
		return wallery.cache[cache];

	var items = utils.sortItems(wallery.items, sortBy).filter(function (item) {
		if (!item.draft)
			return true;
	});

	if (sortBy && sortBy.charAt(0) === '-')
		items.reverse();

	return wallery.cache[cache] = items;
}

function getWalleryThumbURI (wallery, slug, size, format) {
	format = format || 'png';
	slug = _.isString(slug) ? slug : slug.slug;


	// this should probably be dynamic, bound with routes
	return '/wallery/' + slug + '/thumbnail/' + size + '.' + format;
}

module.exports.getWalleryThumbURI = getWalleryThumbURI;

function analyzeColors (wallery, slug, count) {
	var item = _.isString(slug) ? wallery.items[slug] : slug;

	return utils.analyzeColors(
		path.join(wallery.options.items, item.sourcepath),
		wallery.options.thumbnailSourceFormats,
		count);
}

module.exports.analyzeColors = analyzeColors;
