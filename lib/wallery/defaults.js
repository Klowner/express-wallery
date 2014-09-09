var
	_ = require('lodash'),
	path = require('path');

function createDefaults () {
	return {
		root: '',
		items: './_wallery/',
		metaFormat: 'yaml',
		routes: {
			'/wallpaper/:wallpaper': 'show',
			'/wallpaper/thumb/:wallpaper/:details': 'thumbnail'
		},
		thumbnailSizes: {
			'tiny': {
				width: 50
			},
			'small': {
				width: 200,
				height: 100
			},
			'tall': {
				height: 500,
				width: 100
			},
			'400w': {
				width: 400
			},
			'huge': {
				width: 1024
			}
		},
		// only matching formats will be used for fallback
		// image sources. These are used in preferred order
		// as provided.
		thumbnailSourceFormats: ['png', 'jpg', 'svg'],
		thumbnailDirectory: './_wallery/_thumbs/'
	};
}

module.exports = createDefaults;
