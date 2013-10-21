// Load all of the modules in a directory and any sub-directories. Used to
// implement `index.js` in the `locales` directory and the `zones` directory and
// sub-directories.
var fs = require("fs");
var _path = require("path");
var include, exclude;

function glob (exports, directory, include, exclude) {
  require("fs").readdirSync(directory).forEach(function (file) {
    var skip, path, stat;
    skip = skip || /^(index.js|rfc822.js|slurp.js|synopsis.js|timezone.js|zones.js|loaded.js|README)$/.test(file);
    skip = skip || /^[._]/.test(file);
    skip = skip || (exclude && exclude.test(file));
    skip = skip || include && ! include.test(file);
    if (! skip) {
      path = _path.join(directory, file);
      stat = fs.statSync(path);
      if (stat.isDirectory()) {
        glob(exports, path);
      } else if (/\.js$/.test(file)) {
        exports.push(require(path));
      }
    }
  });
}

var $;
if (($ = /(.)zones.js$/.exec(__filename)) && _path.sep == $[1]) {
  include = /./;
  exclude = /^\w{2}_\w{2}.js$/;
} else if (($ = /(.)locales.js$/.exec(__filename)) && _path.sep == $[1]) {
  include = /^\w{2}_\w{2}.js$/;
}

glob(module.exports = [], __dirname, include, exclude);
