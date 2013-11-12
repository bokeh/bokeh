var fs = require('graceful-fs');
var path = require('path');
var mout = require('mout');
var Q = require('q');
var rimraf = require('rimraf');
var Logger = require('bower-logger');
var PackageRepository = require('../../core/PackageRepository');
var cli = require('../../util/cli');
var defaultConfig = require('../../config');

function clean(packages, options, config) {
    var logger = new Logger();
    var names;

    options = options || {};
    config = mout.object.deepFillIn(config || {}, defaultConfig);

    // If packages wasn't provided or is an empty array, null them
    if (!packages || !packages.length) {
        packages = names = null;
    // Otherwise parse them
    } else {
        packages = packages.map(function (pkg) {
            var split = pkg.split('#');
            return {
                name: split[0],
                version: split[1]
            };
        });
        names = packages.map(function (pkg) {
            return pkg.name;
        });
    }

    Q.all([
        clearPackages(packages, config, logger),
        clearLinks(names, config, logger),
        !names ? clearCompletion(config, logger) : null
    ])
    .spread(function (entries) {
        logger.emit('end', entries);
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    return logger;
}

function clearPackages(packages, config, logger) {
    var repository =  new PackageRepository(config, logger);

    return repository.list()
    .then(function (entries) {
        var promises;

        // Filter entries according to the specified packages
        if (packages) {
            entries = entries.filter(function (entry) {
                return !!mout.array.find(packages, function (pkg) {
                    var entryPkgMeta = entry.pkgMeta;

                    // Check if names are different
                    if  (pkg.name !== entryPkgMeta.name) {
                        return false;
                    }

                    // If version was specified, check if they are different
                    if (pkg.version) {
                        return pkg.version === entryPkgMeta.version ||
                               pkg.version === entryPkgMeta._target ||
                               pkg.version === entryPkgMeta._release;
                    }

                    return true;
                });
            });
        }

        promises = entries.map(function (entry) {
            return repository.eliminate(entry.pkgMeta)
            .then(function () {
                logger.info('deleted', 'Cached package ' + entry.pkgMeta.name + ': ' + entry.canonicalDir, {
                    file: entry.canonicalDir
                });
            });
        });

        return Q.all(promises)
        .then(function () {
            if (!packages) {
                // Ensure that everything is cleaned,
                // even invalid packages in the cache
                return repository.clear();
            }
        })
        .then(function () {
            return entries;
        });
    });
}

function clearLinks(names, config, logger) {
    var promise;
    var dir = config.storage.links;

    // If no names are passed, grab all links
    if (!names) {
        promise = Q.nfcall(fs.readdir, dir)
        .fail(function (err) {
            if (err.code === 'ENOENT') {
                return [];
            }

            throw err;
        });
    // Otherwise use passed ones
    } else {
        promise = Q.resolve(names);
    }

    return promise
    .then(function (names) {
        var promises;
        var linksToRemove = [];

        // Decide which links to delete
        promises = names.map(function (name) {
            var link = path.join(config.storage.links, name);

            return Q.nfcall(fs.readlink, link)
            .then(function (linkTarget) {
                // Link exists, check if it points to a folder
                // that still exists
                return Q.nfcall(fs.stat, linkTarget)
                .then(function (stat) {
                    // Target is not a folder..
                    if (!stat.isDirectory()) {
                        linksToRemove.push(link);
                    }
                })
                // Error occurred reading the link
                .fail(function () {
                    linksToRemove.push(link);
                });
            // Ignore if link does not exist
            }, function (err) {
                if (err.code !== 'ENOENT') {
                    linksToRemove.push(link);
                }
            });
        });

        return Q.all(promises)
        .then(function () {
            var promises;

            // Remove each link that was declared as invalid
            promises = linksToRemove.map(function (link) {
                return Q.nfcall(rimraf, link)
                .then(function () {
                    logger.info('deleted', 'Invalid link: ' + link, {
                        file: link
                    });
                });
            });

            return Q.all(promises);
        });
    });
}

function clearCompletion(config, logger) {
    var dir = config.storage.completion;

    return Q.nfcall(fs.stat, dir)
    .then(function () {
        return Q.nfcall(rimraf, dir)
        .then(function () {
            logger.info('deleted', 'Completion cache', {
                file: dir
            });
        });
    }, function (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    });
}

// -------------------

clean.line = function (argv) {
    var options = clean.options(argv);
    return clean(options.argv.remain.slice(2), options);
};

clean.options = function (argv) {
    return cli.readOptions(argv);
};

clean.completion = function () {
    // TODO:
};

module.exports = clean;
