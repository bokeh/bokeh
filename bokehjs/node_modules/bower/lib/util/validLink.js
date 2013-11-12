var Q = require('q');
var fs = require('graceful-fs');

function validLink(file) {
    // Filter only those that are valid links
    return Q.nfcall(fs.lstat, file)
    .then(function (stat) {
        if (!stat.isSymbolicLink()) {
            return [false, null];
        }

        return Q.nfcall(fs.stat, file)
        .then(function () {
            return [true, null];
        });
    })
    .fail(function (err) {
        return [false, err];
    });
}

module.exports = validLink;

