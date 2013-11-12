var path = require('path');
var fs = require('graceful-fs');
var Logger = require('bower-logger');
var cli = require('../util/cli');
var createError = require('../util/createError');

function help(name) {
    var json;
    var logger = new Logger();

    if (name) {
        json = path.resolve(__dirname, '../../templates/json/help-' + name.replace(/\s+/g, '/') + '.json');
    } else {
        json = path.resolve(__dirname, '../../templates/json/help.json');
    }

    fs.exists(json, function (exists) {
        if (!exists) {
            return logger.emit('error', createError('Unknown command: ' + name, 'EUNKOWNCMD', {
                command: name
            }));
        }

        try {
            json = require(json);
        } catch (error) {
            return logger.emit('error', error);
        }

        logger.emit('end', json);
    });

    return logger;
}

// -------------------

help.line = function (argv) {
    var options = help.options(argv);

    return help(options.argv.remain.slice(1).join(' '));
};

help.options = function (argv) {
    return cli.readOptions(argv);
};

help.completion = function () {
    // TODO
};

module.exports = help;
