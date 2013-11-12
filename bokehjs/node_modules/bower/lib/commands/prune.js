var mout = require('mout');
var Logger = require('bower-logger');
var Project = require('../core/Project');
var cli = require('../util/cli');
var defaultConfig = require('../config');

function prune(config) {
    var project;
    var logger = new Logger();

    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    clean(project)
    .then(function (removed) {
        logger.emit('end', removed);
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    return logger;
}

function clean(project, removed) {
    removed = removed || {};

    // Continually call clean until there is no more extraneous
    // dependencies to remove
    return project.getTree()
    .spread(function (tree, flattened, extraneous) {
        var names = extraneous.map(function (extra) {
            return extra.endpoint.name;
        });

        // Uninstall extraneous
        project.uninstall(names)
        .then(function (uninstalled) {
            // Are we done?
            if (!mout.object.size(uninstalled)) {
                return removed;
            }

            // Not yet, recurse!
            mout.object.mixIn(removed, uninstalled);
            return clean(project, removed);
        });
    });
}

// -------------------

prune.line = function () {
    return prune();
};

prune.options = function (argv) {
    return cli.readOptions(argv);
};

prune.completion = function () {
    // TODO:
};

module.exports = prune;
