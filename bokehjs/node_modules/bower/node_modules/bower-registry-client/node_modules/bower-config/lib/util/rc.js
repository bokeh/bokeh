var path = require('path');
var fs = require('graceful-fs');
var optimist = require('optimist');
var osenv = require('osenv');
var mout = require('mout');
var paths = require('./paths');

var win = process.platform === 'win32';
var home = osenv.home();

function rc(name, defaults, cwd, argv) {
    var argvConfig;

    defaults = defaults || {};
    cwd = cwd || process.cwd();
    argv = argv || optimist.argv;

    // Parse --config.foo=false
    argvConfig = mout.object.map(argv.config || {}, function (value) {
        return value === 'false' ? false : value;
    });

    return mout.object.deepMixIn.apply(null, [
        {},
        defaults,
        { cwd: cwd },
        win ? {} : json(path.join('/etc', name + 'rc')),
        !home ? {} : json(path.join(home, '.' + name + 'rc')),
        json(path.join(paths.config, name + 'rc')),
        json(find('.' + name + 'rc', cwd)),
        env(name + '_'),
        argvConfig
    ]);
}

function parse(content, file) {
    var error;

    if (!content.trim().length) {
        return {};
    }

    try {
        return JSON.parse(content);
    } catch (e) {
        if (file) {
            error = new Error('Unable to parse ' + file + ': ' + e.message);
        } else {
            error = new Error('Unable to parse rc config: ' + e.message);
        }

        error.details = content;
        error.code = 'EMALFORMED';
        throw error;
    }

    return null;
}

function json(file) {
    var content;

    try {
        content = fs.readFileSync(file).toString();
    } catch (err) {
        return null;
    }

    return parse(content, file);
}

function env(prefix) {
    var obj = {};
    var prefixLength = prefix.length;

    prefix = prefix.toLowerCase();

    mout.object.forOwn(process.env, function (value, key) {
        key = key.toLowerCase();

        if (mout.string.startsWith(key, prefix)) {
            var parsedKey = key
                           .substr(prefixLength)
                           .replace(/__/g, '.')   // __ is used for nesting
                           .replace(/_/g, '-');   // _ is used as a - separator
            mout.object.set(obj, parsedKey, value);
        }
    });

    return obj;
}

function find(filename, dir) {
    var walk = function (filename, dir) {
        var file = path.join(dir, filename);
        var parent = path.dirname(dir);

        try {
            fs.statSync(file);
            return file;
        } catch (err) {
            // Check if we hit the root
            if (parent === dir) {
                return null;
            }

            return walk(filename, parent);
        }
    };

    dir = dir || process.cwd();
    return walk(filename, dir);
}

module.exports = rc;
