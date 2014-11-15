var utils = require('./utils'),
	_ = require('lodash');

function bindRoutes (wallery) {
	var app = wallery.app;
	//app.get('/wallery/thumb/:slug/:details', getThumbnailGenerator(wallery));

	app.get('/wallery/:slug/thumbnail/:thumb', getThumbnailGenerator(wallery));
	app.get('/wallery/:slug/download/:filename', getDownloadGenerator(wallery));
}

function getThumbnailGenerator (wallery) {
	return function getThumbnail (req, res, next) {
		var params = _.extend({
			slug: req.param('slug')
		}, utils.parseThumbnailName(req.param('thumb')));

		var sizeDef = wallery.options.thumbnailSizes[params.size];

		return wallery.getThumbnail(params.slug, params.size, params.format)
			.then(function (filename) {
				return res.sendFile(filename, {root: wallery.options.root});
			}, function () {
				console.log("Couldn't find a thumbnail for", params.slug);
				next();
			}, function (err) {
				console.log(err);
			});
	}
}

function getDownloadGenerator (wallery) {
	return function getDownload (req, res, next) {
		var filename = wallery.getDownloadPath(req.param('slug'), req.param('filename'))
		return res.sendFile(filename, {root: wallery.options.root});
	}
}

exports.bindRoutes = bindRoutes;



