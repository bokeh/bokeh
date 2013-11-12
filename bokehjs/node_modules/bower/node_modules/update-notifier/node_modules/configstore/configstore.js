'use strict';
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var os = require('os');
var osenv = require('osenv');
var EOL = os.EOL;
var _ = require('lodash');
var mkdirp = require('mkdirp');
var yaml = require('js-yaml');

var user = (osenv.user() || generateFakeUser()).replace(/\\/g, '-');
var tmpDir = path.join(os.tmpdir ? os.tmpdir() : os.tmpDir(), user);
var configDir = process.env.XDG_CONFIG_HOME || path.join(osenv.home() || tmpDir, '.config');

function generateFakeUser() {
    var uid = process.pid + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    return crypto.createHash('md5').update(uid).digest('hex');
}

function permissionError() {
	return 'You don\'t have access to this file.';
}

function Configstore(id, defaults) {
	this.path = path.join(configDir, 'configstore', id + '.yml');
	this.all = _.extend({}, defaults, this.all);
}

Configstore.prototype = Object.create(Object.prototype, {
	all: {
		get: function () {
			try {
				return yaml.safeLoad(fs.readFileSync(this.path, 'utf8'), {
					filename: this.path,
					schema: yaml.JSON_SCHEMA
				});
			} catch (err) {
				// create dir if it doesn't exist
				if (err.code === 'ENOENT') {
					mkdirp.sync(path.dirname(this.path));
					return;
				}

				// improve the message of permission errors
				if (err.code === 'EACCES') {
					err.message = err.message + EOL + permissionError() + EOL;
				}

				// empty the file if it encounters invalid YAML
				if (err.name === 'YAMLException') {
					fs.writeFileSync(this.path, '');
					return;
				}

				throw err;
			}
		},
		set: function (val) {
			try {
				// make sure the folder exists, it could have been
				// deleted meanwhile
				mkdirp.sync(path.dirname(this.path));
				fs.writeFileSync(this.path, yaml.safeDump(val, {
					skipInvalid: true,
					schema: yaml.JSON_SCHEMA
				}));
			} catch (err) {
				// improve the message of permission errors
				if (err.code === 'EACCES') {
					err.message = err.message + EOL + permissionError() + EOL;
				}

				throw err;
			}
		}
	},
	size: {
		get: function () {
			return _.size(this.all);
		}
	}
});

Configstore.prototype.get = function (key) {
	return this.all[key];
};

Configstore.prototype.set = function (key, val) {
	var config = this.all;
	config[key] = val;
	this.all = config;
};

Configstore.prototype.del = function (key) {
	var config = this.all;
	delete config[key];
	this.all = config;
};

module.exports = Configstore;
