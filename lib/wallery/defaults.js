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
			'tiny': '100_0',
			'small': {
				width: 200,
				height: 100
			},
			'medium': '720_0'
		},
		// only matching formats will be used for fallback
		// image sources. These are used in preferred order
		// as provided.
		thumbnailSourceFormats: ['png', 'jpg', 'svg'],
		thumbnailDirectory: './_wallery/_thumbs/'
	};
}

module.exports = createDefaults;
