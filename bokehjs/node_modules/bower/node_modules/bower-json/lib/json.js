var fs = require('graceful-fs');
var path = require('path');
var deepExtend = require('deep-extend');
var createError = require('./util/createError');

var possibleJsons = ['bower.json', 'component.json', '.bower.json'];

function read(file, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    // Check if file is a directory
    fs.stat(file, function (err, stat) {
        if (err) {
            return callback(err);
        }

        // It's a directory, so we find the json inside it
        if (stat.isDirectory()) {
            return find(file, function (err, file) {
                if (err) {
                    return callback(err);
                }

                read(file, options, callback);
            });
        }

        // Otherwise read it
        fs.readFile(file, function (err, contents) {
            var json;

            if (err) {
                return callback(err);
            }

            try {
                json = JSON.parse(contents.toString());
            } catch (err) {
                err.file = path.resolve(file);
                err.code = 'EMALFORMED';
                return callback(err);
            }

            // Parse it
            try {
                json = parse(json, options);
            } catch (err) {
                err.file = path.resolve(file);
                return callback(err);
            }

            callback(null, json, file);
        });
    });
}

function parse(json, options) {
    options = deepExtend({
        normalize: false,
        validate: true,
        clone: false
    }, options || {});

    // Clone
    if (options.clone) {
        json = deepExtend({}, json);
    }

    // Validate
    if (options.validate) {
        validate(json);
    }

    // Normalize
    if (options.normalize) {
        normalize(json);
    }

    return json;
}

function validate(json) {
    if (!json.name) {
        throw createError('No name property set', 'EINVALID');
    }

    // TODO

    return json;
}

function normalize(json) {
    if (typeof json.main === 'string') {
        json.main = json.main.split(',');
    }

    // TODO

    return json;
}

function find(folder, callback) {
    findRec(folder, possibleJsons, callback);
}

function findRec(folder, files, callback) {
    var err;
    var file;

    if (!files.length) {
        err = createError('None of ' + possibleJsons.join(', ') + ' were found in ' + folder, 'ENOENT');
        return callback(err);
    }

    file = path.resolve(path.join(folder, files[0]));
    fs.exists(file, function (exists) {
        if (exists) {
            return callback(null, file);
        }

        findRec(folder, files.slice(1), callback);
    });
}

module.exports = read;
module.exports.read = read;
module.exports.parse = parse;
module.exports.validate = validate;
module.exports.normalize = normalize;
module.exports.find = find;
