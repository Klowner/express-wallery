var utils = require('./utils');

function createHelpers (wallery) {
	var options = wallery.options;
	var helpers = {
		getWalleryItems: getWalleryItems.bind(undefined, wallery),
		pootCat: function () { return "POOT POOT"; }
	};

	return helpers;
}
module.exports = createHelpers;


function getWalleryItems (wallery, sortBy) {
	var cache = 'items' + sortBy ? '_' + sortBy : '';

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

