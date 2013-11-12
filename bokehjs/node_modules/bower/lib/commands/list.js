var path = require('path');
var mout = require('mout');
var semver = require('semver');
var Q = require('q');
var Logger = require('bower-logger');
var Project = require('../core/Project');
var cli = require('../util/cli');
var defaultConfig = require('../config');

function list(options, config) {
    var project;
    var logger = new Logger();

    options = options || {};
    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    project.getTree()
    .spread(function (tree, flattened) {
        if (options.paths) {
            return logger.emit('end', paths(flattened));
        }

        if (config.offline) {
            return logger.emit('end', tree);
        }

        return checkVersions(project, tree, logger)
        .then(function () {
            logger.emit('end', tree);
        });
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    logger.json = !!options.paths;

    return logger;
}

function checkVersions(project, tree, logger) {
    var promises;
    var nodes = [];
    var repository = project.getPackageRepository();

    // Gather all nodes
    project.walkTree(tree, function (node) {
        nodes.push(node);
    }, true);

    if (nodes.length) {
        logger.info('check-new', 'Checking for new versions of the project dependencies..');
    }

    // Check for new versions for each node
    promises = nodes.map(function (node) {
        var target = node.endpoint.target;

        return repository.versions(node.endpoint.source)
        .then(function (versions) {
            node.versions = versions;

            // Do not check if node's target is not a valid semver one
            if (versions.length && semver.validRange(target)) {
                node.update = {
                    target: semver.maxSatisfying(versions, target),
                    latest: semver.maxSatisfying(versions, '*')
                };
            }
        });
    });

    // Set the versions also for the root node
    tree.versions = [];

    return Q.all(promises);
}

function paths(flattened) {
    var ret = {};

    mout.object.forOwn(flattened, function (pkg, name) {
        var main;

        if (pkg.missing) {
            return;
        }

        main = pkg.pkgMeta.main;

        if (!main) {
            ret[name] = pkg.canonicalDir;
            return;
        }

        // Normalize main
        if (typeof main === 'string') {
            main = main.split(',');
        }

        // Concatenate each main entry with the canonical dir
        main = main.map(function (part) {
            return path.join(pkg.canonicalDir, part).trim();
        }).join(',');

        ret[name] = main;
    });

    return ret;
}

// -------------------

list.line = function (argv) {
    var options = list.options(argv);
    return list(options);
};

list.options = function (argv) {
    return cli.readOptions({
        'paths': { type: Boolean, shorthand: 'p' }
    }, argv);
};

list.completion = function () {
    // TODO:
};

module.exports = list;
