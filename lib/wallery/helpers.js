var utils = require('./utils'),
	_ = require('lodash');

function createHelpers (wallery) {
	var options = wallery.options;
	var helpers = {
		getWalleryItems: getWalleryItems.bind(undefined, wallery),
		getWalleryThumbURI: getWalleryThumbURI.bind(undefined, wallery)
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

	console.log(wallery.items);
	return wallery.cache[cache] = items;
}

function getWalleryThumbURI (wallery, slug, size, format) {
	format = format || 'png';
	slug = _.isString(slug) ? slug : slug.slug;


	// this should probably be dynamic, bound with routes
	return '/wallery/' + slug + '/thumbnail/' + size + '.' + format;
}

module.exports.getWalleryThumbURI = getWalleryThumbURI;



