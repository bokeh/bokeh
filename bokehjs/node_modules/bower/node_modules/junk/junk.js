'use strict';

exports.rules = [
	// OS X
	/^\.DS_Store/,        // stores custom folder attributes
	/^\.AppleDouble$/,    // stores additional file resources
	/^\.LSOverride$/,     // contains the absolute path to the app to be used
	/^Icon[\r\?]?/,       // custom Finder icon
	/^\._.*/,             // thumbnail
	/^.Spotlight-V100$/,  // file that might appear on external disk
	/\.Trashes/,          // file that might appear on external disk
	/^__MACOSX$/,         // resource fork
	// Linux
	/~$/,                 // backup file
	// Windows
	/^Thumbs\.db$/,       // image file cache
	/^ehthumbs\.db$/,     // folder config file
	/^Desktop\.ini$/       // stores custom folder attributes
];

exports.is = function (filename) {
	return exports.rules.some(function (rule) {
		return rule.test(filename);
	});
};

exports.isnt = function (filename) {
	return !exports.is(filename);
};
