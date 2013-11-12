var Logger = require('bower-logger');
var cli = require('../util/cli');

function completion(config) {
    var logger = new Logger();

    process.nextTick(function () {
        logger.emit('end');
    });

    return logger;
}

// -------------------

completion.line = function (argv) {
    var options = completion.options(argv);
    var name = options.argv.remain[1];

    return completion(name);
};

completion.options = function (argv) {
    return cli.readOptions(argv);
};

completion.completion = function () {
    // TODO:
};

module.exports = completion;
