var mout = require('mout');
var Logger = require('bower-logger');
var Project = require('../core/Project');
var cli = require('../util/cli');
var defaultConfig = require('../config');

function install(endpoints, options, config) {
    var project;
    var logger = new Logger();

    options = options || {};
    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    // If endpoints is an empty array, null them
    if (endpoints && !endpoints.length) {
        endpoints = null;
    }

    project.install(endpoints, options)
    .then(function (installed) {
        logger.emit('end', installed);
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    return logger;
}

// -------------------

install.line = function (argv) {
    var options = install.options(argv);
    return install(options.argv.remain.slice(1), options);
};

install.options = function (argv) {
    return cli.readOptions({
        'force-latest': { type: Boolean, shorthand: 'F'},
        'production': { type: Boolean, shorthand: 'p' },
        'save': { type: Boolean, shorthand: 'S' },
        'save-dev': { type: Boolean, shorthand: 'D' }
    }, argv);
};

install.completion = function () {
    // TODO:
};

module.exports = install;
