var utils = require('./utils'),
	_ = require('lodash');

function bindRoutes (wallery) {
	var app = wallery.app;
	//app.get('/wallery/thumb/:slug/:details', getThumbnailGenerator(wallery));

	app.get('/wallery/:slug/thumbnail/:thumb', getThumbnailGenerator(wallery));
}

function getThumbnailGenerator (wallery) {
	return function getThumbnail (req, res, next) {
		var params = _.extend({
			slug: req.param('slug')
		}, utils.parseThumbnailName(req.param('thumb')));

		var sizeDef = wallery.options.thumbnailSizes[params.size];
		// If this size is permitted and defined
		var source = utils.getThumbnailSource(
			'./_wallery/' + params.slug,
			wallery.options.thumbnailSourceFormats
		);

		source.then(function(result) {
			console.log('THUMB RESULT', result);
		});

		if (sizeDef) {
			res.send(sizeDef);
		}

		//res.send(params);
		next();
	}
}

exports.bindRoutes = bindRoutes;

