var util = require('util');
var rimraf = require('rimraf');
var IgnoreReader = require('fstream-ignore');
var Q = require('q');

// Special reader class that only emits entries
// for files that were ignored, instead of the opposite
var IgnoreMatcher = function () {
    return IgnoreReader.apply(this, arguments);
};

util.inherits(IgnoreMatcher, IgnoreReader);

// --------

IgnoreMatcher.prototype.applyIgnores = function () {
    return !IgnoreReader.prototype.applyIgnores.apply(this, arguments);
};

// --------

function removeIgnores(dir, ignore) {
    var reader;
    var deferred = Q.defer();
    var files = [];

    reader = new IgnoreMatcher({
        path: dir,
        type: 'Directory'
    });

    reader.addIgnoreRules(ignore);

    reader
    .on('entry', function (entry) {
        files.push(entry.path);
    })
    .on('error', deferred.reject)
    .on('end', function () {
        var promises = files.map(function (file) {
            return Q.nfcall(rimraf, file);
        });

        return Q.all(promises)
        .then(deferred.resolve, deferred.reject);
    });

    return deferred.promise;
}

module.exports = removeIgnores;
