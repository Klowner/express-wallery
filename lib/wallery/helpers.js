var utils = require('./utils'),
	path = require('path'),
	_ = require('lodash');

function createHelpers (wallery) {
	var options = wallery.options;
	var helpers = {
		getWalleryItems: getWalleryItems.bind(undefined, wallery),
		getWalleryThumbURI: getWalleryThumbURI.bind(undefined, wallery),
		analyzeColors: analyzeColors.bind(undefined, wallery),
		getWalleryDownloads: getWalleryDownloads.bind(undefined, wallery)
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


function getWalleryDownloads (wallery, slug, formats) {
	var item = _.isString(slug) ? wallery.items[slug] : slug;

  return utils.getDownloads(
		wallery.options.items,
		item.sourcepath,
		formats || wallery.options.allowedDownloadFormats
	).then(function (downloads) {

    // add URLs
    for (i in downloads) {
      downloads[i].url = getWalleryDownloadURI(wallery, item.slug, downloads[i].filename);
    }

    return downloads;
  });
}
module.exports.getWalleryDownloads = getWalleryDownloads;


function getWalleryDownloadURI (wallery, slug, filename) {
	return '/wallery/' + slug + '/download/' + filename;
}
module.exports.getWalleryDownloadURI = getWalleryDownloadURI;


function getSimilarByTags (wallery, slug, count, exclude) {
	var item = _.isString(slug) ? wallery.items[slug] : slug,
		tags = exclude ? _.difference(item.tags, exclude) : item.tags,
	  	related;

	related = item._cacheSameTags = item._cacheSameTags || wallery.query().tag(tags).without(item).values();

	return _.shuffle(related)
		.slice(count ? 0 : undefined, count);
}
module.exports.getWallerySimilarByTags = getSimilarByTags;
