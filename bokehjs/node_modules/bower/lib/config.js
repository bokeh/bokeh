var mout = require('mout');
var config = require('bower-config').read();
var cli = require('./util/cli');

// Delete the json attribute because it is no longer supported
// and conflicts with --json
delete config.json;

// Merge common CLI options into the config
mout.object.mixIn(config, cli.readOptions({
    force: { type: Boolean, shorthand: 'f' },
    offline: { type: Boolean, shorthand: 'o' },
    verbose: { type: Boolean, shorthand: 'V' },
    quiet: { type: Boolean, shorthand: 'q' },
    loglevel: { type: String, shorthand: 'l' },
    json: { type: Boolean, shorthand: 'j' },
    silent: { type: Boolean, shorthand: 's' }
}));

module.exports = config;
