var mout = require('mout');
var Q = require('q');
var Logger = require('bower-logger');
var RegistryClient = require('bower-registry-client');
var cli = require('../util/cli');
var defaultConfig = require('../config');

function lookup(name, config) {
    var registryClient;
    var logger = new Logger();

    config = mout.object.deepFillIn(config || {}, defaultConfig);
    config.cache = config.storage.registry;

    registryClient = new RegistryClient(config, logger);

    Q.nfcall(registryClient.lookup.bind(registryClient), name)
    .then(function (entry) {
        // TODO: Handle entry.type.. for now it's only 'alias'
        //       When we got published packages, this needs to be adjusted
        logger.emit('end', !entry ? null : {
            name: name,
            url: entry && entry.url
        });
    })
    .fail(function (error) {
        logger.emit('error', error);
    });

    return logger;
}

// -------------------

lookup.line = function (argv) {
    var options = lookup.options(argv);
    var name = options.argv.remain[1];

    if (!name) {
        return null;
    }

    return lookup(name);
};

lookup.options = function (argv) {
    return cli.readOptions(argv);
};

lookup.completion = function () {
    // TODO:
};

module.exports = lookup;
