var mout = require('mout');
var Logger = require('bower-logger');
var Q = require('q');
var Project = require('../core/Project');
var cli = require('../util/cli');
var defaultConfig = require('../config');

function uninstall(names, options, config) {
    var project;
    var logger = new Logger();

    options = options || {};
    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    project.getTree()
    .spread(function (tree, flattened) {
        // Uninstall nodes
        return project.uninstall(names, options)
        // Clean out non-shared uninstalled dependencies
        .then(function (uninstalled) {
            var names = Object.keys(uninstalled);
            var children = [];

            // Grab the dependencies of packages that were uninstalled
            mout.object.forOwn(flattened, function (node) {
                if (names.indexOf(node.endpoint.name) !== -1) {
                    children.push.apply(children, mout.object.keys(node.dependencies));
                }
            });

            // Clean them!
            return clean(project, children, uninstalled);
        });
    })
    .then(function (uninstalled) {
        logger.emit('end', uninstalled);
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    return logger;
}

function clean(project, names, removed) {
    removed = removed || {};

    return project.getTree()
    .spread(function (tree, flattened) {
        var nodes = [];

        // Grab the nodes of each specified name
        mout.object.forOwn(flattened, function (node) {
            if (names.indexOf(node.endpoint.name) !== -1) {
                nodes.push(node);
            }
        });

        // Filter out those that have dependants
        nodes = nodes.filter(function (node) {
            return !node.nrDependants;
        });

        // Are we done?
        if (!nodes.length) {
            return Q.resolve(removed);
        }

        // Grab the nodes after filtering
        names = nodes.map(function (node) {
            return node.endpoint.name;
        });

        // Uninstall them
        return project.uninstall(names)
        // Clean out non-shared uninstalled dependencies
        .then(function (uninstalled) {
            var children;

            mout.object.mixIn(removed, uninstalled);

            // Grab the dependencies of packages that were uninstalled
            children = [];
            nodes.forEach(function (node) {
                children.push.apply(children, mout.object.keys(node.dependencies));
            });

            // Recurse!
            return clean(project, children, removed);
        });
    });
}

// -------------------

uninstall.line = function (argv) {
    var options = uninstall.options(argv);
    var names = options.argv.remain.slice(1);

    if (!names.length) {
        return null;
    }

    return uninstall(names, options);
};

uninstall.options = function (argv) {
    return cli.readOptions({
        'save': { type: Boolean, shorthand: 'S' },
        'save-dev': { type: Boolean, shorthand: 'D' }
    }, argv);
};

uninstall.completion = function () {
    // TODO:
};

module.exports = uninstall;
