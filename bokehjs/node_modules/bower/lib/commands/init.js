var mout = require('mout');
var fs = require('graceful-fs');
var path = require('path');
var Q = require('q');
var inquirer = require('inquirer');
var Logger = require('bower-logger');
var endpointParser = require('bower-endpoint-parser');
var cli = require('../util/cli');
var Project = require('../core/Project');
var defaultConfig = require('../config');

function init(config) {
    var project;
    var logger = new Logger();

    config = mout.object.deepFillIn(config || {}, defaultConfig);
    project = new Project(config, logger);

    // Start with existing JSON details
    readJson(project, logger)
    // Fill in defaults
    .then(setDefaults.bind(null, config))
    // Now prompt user to make changes
    .then(promptUser)
    // Set ignore based on the response
    .spread(setIgnore)
    // Set dependencies based on the response
    .spread(setDependencies.bind(null, project))
    // All done!
    .spread(saveJson.bind(null, project))
    .then(function (json) {
        logger.emit('end', json);
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    return logger;
}

function readJson(project, logger) {
    return project.hasJson()
    .then(function (json) {
        if (json) {
            logger.warn('existing', 'The existing ' + path.basename(json) + ' file will be used and filled in');
        }

        return project.getJson();
    });
}

function saveJson(project, json) {
    // Cleanup empty props, including objects and arrays
    mout.object.forOwn(json, function (value, key) {
        if (mout.lang.isEmpty(value)) {
            delete json[key];
        }
    });

    // Save json (true forces file creation)
    return project.saveJson(true);
}

function setDefaults(config, json) {
    var name;

    // Name
    if (!json.name) {
        json.name = path.basename(config.cwd);
    }

    // Version
    if (!json.version) {
        json.version = '0.0.0';
    }

    // Main
    if (!json.main) {
        // Remove '.js' from the end of the package name if it is there
        name = path.basename(json.name, '.js');

        if (fs.existsSync(path.join(config.cwd, 'index.js'))) {
            json.main = 'index.js';
        } else if (fs.existsSync(path.join(config.cwd, name + '.js'))) {
            json.main = name + '.js';
        }
    }

    return json;
}

function promptUser(json) {
    var deferred = Q.defer();

    var questions = [
        {
            'name': 'name',
            'message': 'name',
            'default': json.name,
            'type': 'input'
        },
        {
            'name': 'version',
            'message': 'version',
            'default': json.version,
            'type': 'input'
        },
        {
            'name': 'main',
            'message': 'main file',
            'default': json.main,
            'type': 'input'
        },
        {
            'name': 'dependencies',
            'message': 'set currently installed components as dependencies?',
            'default': !mout.object.size(json.dependencies) && !mout.object.size(json.devDependencies),
            'type': 'confirm'
        },
        {
            'name': 'ignore',
            'message': 'add commonly ignored files to ignore list?',
            'default': true,
            'type': 'confirm'
        }
    ];

    inquirer.prompt(questions, function (answers) {
        json.name = answers.name;
        json.version = answers.version;
        json.main = answers.main;

        return deferred.resolve([json, answers]);
    });

    return deferred.promise;
}

function setIgnore(json, answers) {
    if (answers.ignore) {
        json.ignore = mout.array.combine(json.ignore || [], [
            '**/.*',
            'node_modules',
            'bower_components',
            'test',
            'tests'
        ]);
    }

    return [json, answers];
}

function setDependencies(project, json, answers) {
    if (answers.dependencies) {
        return project.getTree()
        .spread(function (tree, flattened, extraneous) {
            if (extraneous.length) {
                json.dependencies = {};

                // Add extraneous as dependencies
                // TODO: The final expanded source is used instead of the original source
                //       While this the most correct it might be confusing to users
                extraneous.forEach(function (extra) {
                    var jsonEndpoint;

                    // Skip linked packages
                    if (extra.linked) {
                        return;
                    }

                    jsonEndpoint = endpointParser.decomposed2json(extra.endpoint);
                    mout.object.mixIn(json.dependencies, jsonEndpoint);
                });
            }

            return [json, answers];
        });
    }

    return [json, answers];
}

// -------------------

init.line = function () {
    return init();
};

init.options = function (argv) {
    return cli.readOptions(argv);
};

init.completion = function () {
    // TODO:
};

module.exports = init;
