var mout = require('mout');
var Logger = require('bower-logger');
var Project = require('../core/Project');
var open = require('open');
var endpointParser = require('bower-endpoint-parser');
var cli = require('../util/cli');
var createError = require('../util/createError');
var defaultConfig = require('../config');

function home(name, config) {
    var project;
    var promise;
    var decEndpoint;
    var logger = new Logger();

    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    // Get the package meta
    // If no name is specified, read the project json
    // If a name is specified, fetch from the package repository
    if (!name) {
        promise = project.hasJson()
        .then(function (json) {
            if (!json) {
                throw createError('You are not inside a package', 'ENOENT');
            }

            return project.getJson();
        });
    } else {
        decEndpoint = endpointParser.decompose(name);
        promise = project.getPackageRepository().fetch(decEndpoint)
        .spread(function (canonicalDir, pkgMeta) {
            return pkgMeta;
        });
    }

    // Get homepage and open it
    promise.then(function (pkgMeta) {
        var homepage = pkgMeta.homepage;

        if (!homepage) {
            throw createError('No homepage set for ' + pkgMeta.name, 'ENOHOME');
        }

        open(homepage);
        logger.emit('end', homepage);
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    return logger;
}

// -------------------

home.line = function (argv) {
    var options = home.options(argv);
    var name = options.argv.remain[1];

    return home(name);
};

home.options = function (argv) {
    return cli.readOptions(argv);
};

home.completion = function () {
    // TODO:
};

module.exports = home;
