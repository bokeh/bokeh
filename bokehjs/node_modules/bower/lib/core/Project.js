var glob = require('glob');
var path = require('path');
var fs = require('graceful-fs');
var Q = require('q');
var semver = require('semver');
var mout = require('mout');
var rimraf = require('rimraf');
var promptly = require('promptly');
var endpointParser = require('bower-endpoint-parser');
var Logger = require('bower-logger');
var Manager = require('./Manager');
var defaultConfig = require('../config');
var md5 = require('../util/md5');
var createError = require('../util/createError');
var readJson = require('../util/readJson');
var validLink = require('../util/validLink');

function Project(config, logger) {
    // This is the only architecture component that ensures defaults
    // on config and logger
    // The reason behind it is that users can likely use this component
    // directly if commands do not fulfil their needs
    this._config = config || defaultConfig;
    this._logger = logger || new Logger();
    this._manager = new Manager(this._config, this._logger);

    this._options = {};
}

// -----------------

Project.prototype.install = function (endpoints, options) {
    var decEndpoints;
    var that = this;
    var targets = [];
    var resolved = {};
    var incompatibles = [];

    // If already working, error out
    if (this._working) {
        return Q.reject(createError('Already working', 'EWORKING'));
    }

    this._options = options || {};
    this._working = true;

    // Analyse the project
    return this._analyse()
    .spread(function (json, tree) {
        // Recover tree
        that.walkTree(tree, function (node, name) {
            if (node.missing) {
                targets.push(node);
            } else if (node.incompatible) {
                incompatibles.push(node);
            } else {
                resolved[name] = node;
            }

            // Ignore linked dependencies because it's too complex to parse them
            // Note that this might change in the future: #673
            if (node.linked) {
                return false;
            }
        });

        // Add endpoints as targets
        if (endpoints) {
            decEndpoints = endpoints.map(function (endpoint) {
                var decEndpoint = endpointParser.decompose(endpoint);

                // Mark as new so that a conflict for this target
                // always require a choice
                // Also allows for the target to be converted in case
                // of being *
                decEndpoint.newly = true;
                targets.push(decEndpoint);

                return decEndpoint;
            });
        } else {
            decEndpoints = [];
        }

        // Bootstrap the process
        return that._bootstrap(targets, resolved, incompatibles);
    })
    .then(function (installed) {
        // Handle save and saveDev options
        if (that._options.save || that._options.saveDev) {
            // Cycle through the specified endpoints
            decEndpoints.forEach(function (decEndpoint) {
                var jsonEndpoint;

                jsonEndpoint = endpointParser.decomposed2json(decEndpoint);

                if (that._options.save) {
                    that._json.dependencies = mout.object.mixIn(that._json.dependencies || {}, jsonEndpoint);
                }

                if (that._options.saveDev) {
                    that._json.devDependencies = mout.object.mixIn(that._json.devDependencies || {}, jsonEndpoint);
                }
            });
        }

        // Save JSON, might contain changes to dependencies and resolutions
        return that.saveJson()
        .then(function () {
            return installed;
        });
    })
    .fin(function () {
        that._installed = null;
        that._working = false;
    });
};

Project.prototype.update = function (names, options) {
    var that = this;
    var targets = [];
    var resolved = {};
    var incompatibles = [];

    // If already working, error out
    if (this._working) {
        return Q.reject(createError('Already working', 'EWORKING'));
    }

    this._options = options || {};
    this._working = true;

    // Analyse the project
    return this._analyse()
    .spread(function (json, tree, flattened) {
        // If no names were specified, update every package
        if (!names) {
            // Mark each root dependency as targets
            that.walkTree(tree, function (node) {
                // Ignore linked extraneous because
                // we don't know their real sources
                if (node.extraneous && node.linked) {
                    return false;
                }

                targets.push(node);
                return false;
            }, true);
        // Otherwise, selectively update the specified ones
        } else {
            // Error out if some of the specified names
            // are not installed
            names.forEach(function (name) {
                if (!flattened[name]) {
                    throw createError('Package ' + name + ' is not installed', 'ENOTINS', {
                        name: name
                    });
                }
            });

            // Add packages whose names are specified to be updated
            that.walkTree(tree, function (node, name) {
                // Ignore linked extraneous because
                // we don't know their real source
                if (node.extraneous && node.linked) {
                    return false;
                }

                if (names.indexOf(name) !== -1) {
                    targets.push(node);
                    return false;
                }
            }, true);

            // Recover tree
            that.walkTree(tree, function (node, name) {
                if (node.missing) {
                    targets.push(node);
                } else if (node.incompatible) {
                    incompatibles.push(node);
                } else {
                    resolved[name] = node;
                }

                // Ignore linked dependencies because it's too complex to parse them
                // Note that this might change in the future: #673
                if (node.linked) {
                    return false;
                }
            }, true);
        }

        // Bootstrap the process
        return that._bootstrap(targets, resolved, incompatibles)
        .then(function (installed) {
            // Save JSON, might contain changes to resolutions
            return that.saveJson()
            .then(function () {
                return installed;
            });
        });
    })
    .fin(function () {
        that._installed = null;
        that._working = false;
    });
};

Project.prototype.uninstall = function (names, options) {
    var that = this;
    var packages = {};

    // If already working, error out
    if (this._working) {
        return Q.reject(createError('Already working', 'EWORKING'));
    }

    this._options = options || {};
    this._working = true;

    // Analyse the project
    return this._analyse()
    // Fill in the packages to be uninstalled
    .spread(function (json, tree, flattened) {
        var promise = Q.resolve();

        names.forEach(function (name) {
            var decEndpoint = flattened[name];

            // Check if it is not installed
            if (!decEndpoint || decEndpoint.missing) {
                packages[name] = null;
                return;
            }

            promise = promise
            .then(function () {
                var message;
                var data;
                var dependantsNames;
                var dependants = [];

                // Walk the down the tree, gathering dependants of the package
                that.walkTree(tree, function (node, nodeName) {
                    if (name === nodeName) {
                        dependants.push.apply(dependants, mout.object.values(node.dependants));
                    }
                }, true);

                // Remove duplicates
                dependants = mout.array.unique(dependants);

                // Note that the root is filtered from the dependants
                // as well as other dependants marked to be uninstalled
                dependants = dependants.filter(function (dependant) {
                    return !dependant.root && names.indexOf(dependant.name) === -1;
                });

                // If the package has no dependants or the force config is enabled,
                // mark it to be removed
                if (!dependants.length || that._config.force) {
                    packages[name] = decEndpoint.canonicalDir;
                    return;
                }

                // Otherwise we need to figure it out if the user really wants to remove it,
                // even with dependants
                // As such we need to prompt the user with a meaningful message
                dependantsNames = dependants
                .map(function (dep) {
                    return dep.name;
                })
                .sort(function (name1, name2) {
                    return name1.localeCompare(name2);
                });

                dependantsNames = mout.array.unique(dependantsNames);
                message = dependantsNames.join(', ') + ' depends on ' + decEndpoint.name;
                data = {
                    name: decEndpoint.name,
                    dependants: dependants
                };

                // If interactive is disabled, error out
                if (!that._config.interactive) {
                    throw createError(message, 'ECONFLICT', {
                        data: data
                    });
                }

                that._logger.conflict('mutual', message, data);

                // Question the user
                return Q.nfcall(promptly.confirm, 'Continue anyway? (y/n)')
                .then(function (confirmed) {
                    // If the user decided to skip it, remove from the array so that it won't
                    // influence subsequent dependants
                    if (!confirmed) {
                        mout.array.remove(names, name);
                    } else {
                        packages[name] = decEndpoint.canonicalDir;
                    }
                });
            });
        });

        return promise;
    })
    // Remove packages
    .then(function () {
        return that._removePackages(packages);
    })
    .fin(function () {
        that._installed = null;
        that._working = false;
    });
};

Project.prototype.getTree = function () {
    return this._analyse()
    .spread(function (json, tree, flattened) {
        var extraneous = [];
        var additionalKeys = ['missing', 'extraneous', 'linked'];

        // Convert tree
        tree = this._manager.toData(tree, additionalKeys);

        // Mark incompatibles
        this.walkTree(tree, function (node) {
            var version;
            var target = node.endpoint.target;

            if (node.pkgMeta && semver.validRange(target)) {
                version = node.pkgMeta.version;

                // Ignore if target is '*' and resolved to a non-semver release
                if (!version && target === '*') {
                    return;
                }

                if (!version || !semver.satisfies(version, target)) {
                    node.incompatible = true;
                }
            }
        }, true);

        // Convert extraneous
        mout.object.forOwn(flattened, function (pkg) {
            if (pkg.extraneous) {
                extraneous.push(this._manager.toData(pkg, additionalKeys));
            }
        }, this);

        // Convert flattened
        flattened = mout.object.map(flattened, function (node) {
            return this._manager.toData(node);
        }, this);

        return [tree, flattened, extraneous];
    }.bind(this));
};

Project.prototype.walkTree = function (node, fn, onlyOnce) {
    var result;
    var dependencies;
    var queue = mout.object.values(node.dependencies);

    if (onlyOnce === true) {
        onlyOnce = [];
    }

    while (queue.length) {
        node = queue.shift();
        result = fn(node, node.name);

        // Abort traversal if result is false
        if (result === false) {
            continue;
        }

        // Add dependencies to the queue
        dependencies = mout.object.values(node.dependencies);

        // If onlyOnce was true, do not add if already traversed
        if (onlyOnce) {
            dependencies = dependencies.filter(function (dependency) {
                return !mout.array.find(onlyOnce, function (stacked) {
                    if (dependency.endpoint) {
                        return mout.object.equals(dependency.endpoint, stacked.endpoint);
                    }

                    return dependency.name === stacked.name &&
                           dependency.source === stacked.source &&
                           dependency.target === stacked.target;
                });
            });

            onlyOnce.push.apply(onlyOnce, dependencies);
        }

        queue.unshift.apply(queue, dependencies);
    }
};

Project.prototype.saveJson = function (forceCreate) {
    var file;
    var jsonStr = JSON.stringify(this._json, null, '  ') + '\n';
    var jsonHash = md5(jsonStr);

    // Save only if there's something different
    if (jsonHash === this._jsonHash) {
        return Q.resolve();
    }

    // Error out if the json file does not exist, unless force create
    // is true
    if (!this._jsonFile && !forceCreate) {
        this._logger.warn('no-json', 'No bower.json file to save to, use bower init to create one');
        return Q.resolve();
    }

    file = this._jsonFile || path.join(this._config.cwd, 'bower.json');
    return Q.nfcall(fs.writeFile, file, jsonStr)
    .then(function () {
        this._jsonHash = jsonHash;
        this._jsonFile = file;
        return this._json;
    }.bind(this));
};

Project.prototype.hasJson = function () {
    return this._readJson()
    .then(function (json) {
        return json ? this._jsonFile : false;
    }.bind(this));
};

Project.prototype.getJson = function () {
    return this._readJson();
};

Project.prototype.getManager = function () {
    return this._manager;
};

Project.prototype.getPackageRepository = function () {
    return this._manager.getPackageRepository();
};

// -----------------

Project.prototype._analyse = function () {
    return Q.all([
        this._readJson(),
        this._readInstalled(),
        this._readLinks()
    ])
    .spread(function (json, installed, links) {
        var root;
        var jsonCopy = mout.lang.deepClone(json);
        var flattened = mout.object.mixIn({}, installed, links);

        root = {
            name: json.name,
            source: this._config.cwd,
            target: json.version || '*',
            pkgMeta: jsonCopy,
            canonicalDir: this._config.cwd,
            root: true
        };

        // Mix direct extraneous as dependencies
        // (dependencies installed without --save/--save-dev)
        jsonCopy.dependencies = jsonCopy.dependencies || {};
        mout.object.forOwn(installed, function (decEndpoint, key) {
            var pkgMeta = decEndpoint.pkgMeta;

            // The _direct propery is saved by the manager when .newly is specified
            if (!jsonCopy.dependencies[key] && pkgMeta._direct) {
                decEndpoint.extraneous = true;
                jsonCopy.dependencies[key] = pkgMeta._source + '#' + pkgMeta._target;
            }
        });

        // Restore the original dependencies cross-references,
        // that is, the parent-child relationships
        this._restoreNode(root, flattened, 'dependencies');
        // Do the same for the dev dependencies
        if (!this._options.production) {
            this._restoreNode(root, flattened, 'devDependencies');
        }

        // Restore the rest of the extraneousv (not installed directly)
        mout.object.forOwn(flattened, function (decEndpoint, name) {
            if (!decEndpoint.dependants) {
                decEndpoint.extraneous = true;
                this._restoreNode(decEndpoint, flattened, 'dependencies');
                // Note that it has no dependants, just dependencies!
                root.dependencies[name] = decEndpoint;
            }
        }, this);

        // Remove root from the flattened tree
        delete flattened[json.name];

        return [json, root, flattened];
    }.bind(this));
};

Project.prototype._bootstrap = function (targets, resolved, incompatibles) {
    var installed = mout.object.map(this._installed, function (decEndpoint) {
        return decEndpoint.pkgMeta;
    });

    this._json.resolutions = this._json.resolutions || {};

    // Configure the manager and kick in the resolve process
    return this._manager
    .configure({
        targets: targets,
        resolved: resolved,
        incompatibles: incompatibles,
        resolutions: this._json.resolutions,
        installed: installed,
        forceLatest: this._options.forceLatest
    })
    .resolve()
    .then(function () {
        // If the resolutions is empty, delete key
        if (!mout.object.size(this._json.resolutions)) {
            delete this._json.resolutions;
        }
    }.bind(this))
    // Install resolved ones
    .then(this._manager.install.bind(this._manager));
};

Project.prototype._readJson = function () {
    var that = this;

    if (this._json) {
        return Q.resolve(this._json);
    }

    // Read local json
    return this._json = readJson(this._config.cwd, {
        name: path.basename(this._config.cwd) || 'root'
    })
    .spread(function (json, deprecated, assumed) {
        var jsonStr;

        if (deprecated) {
            that._logger.warn('deprecated', 'You are using the deprecated ' + deprecated + ' file');
        }

        if (!assumed) {
            that._jsonFile = path.join(that._config.cwd, deprecated ? deprecated : 'bower.json');
        }

        jsonStr = JSON.stringify(json, null, '  ') + '\n';
        that._jsonHash = md5(jsonStr);
        return that._json = json;
    });
};

Project.prototype._readInstalled = function () {
    var componentsDir;
    var that = this;

    if (this._installed) {
        return Q.resolve(this._installed);
    }

    // Gather all folders that are actual packages by
    // looking for the package metadata file
    componentsDir = path.join(this._config.cwd, this._config.directory);
    return this._installed = Q.nfcall(glob, '*/.bower.json', {
        cwd: componentsDir,
        dot: true
    })
    .then(function (filenames) {
        var promises;
        var decEndpoints = {};

        // Foreach bower.json found
        promises = filenames.map(function (filename) {
            var name = path.dirname(filename);
            var metaFile = path.join(componentsDir, filename);

            // Read package metadata
            return readJson(metaFile)
            .spread(function (pkgMeta) {
                decEndpoints[name] = {
                    name: name,
                    source: pkgMeta._source,
                    target: pkgMeta._target,
                    canonicalDir: path.dirname(metaFile),
                    pkgMeta: pkgMeta
                };
            });
        });

        // Wait until all files have been read
        // and resolve with the decomposed endpoints
        return Q.all(promises)
        .then(function () {
            return that._installed = decEndpoints;
        });
    });
};

Project.prototype._readLinks = function () {
    var componentsDir;
    var that = this;

    // Read directory, looking for links
    componentsDir = path.join(this._config.cwd, this._config.directory);
    return Q.nfcall(fs.readdir, componentsDir)
    .then(function (filenames) {
        var promises;
        var decEndpoints = {};

        promises = filenames.map(function (filename) {
            var dir = path.join(componentsDir, filename);

            // Filter only those that are valid links
            return validLink(dir)
            .spread(function (valid, err) {
                var name;

                if (!valid) {
                    if (err) {
                        that._logger.debug('read-link', 'Link ' + dir + ' is invalid', {
                            filename: dir,
                            error: err
                        });
                    }
                    return;
                }

                name = path.basename(dir);
                return readJson(dir, { name: name })
                .spread(function (json, deprecated) {
                    if (deprecated) {
                        that._logger.warn('deprecated', 'Package ' + name + ' is using the deprecated ' + deprecated);
                    }

                    json._direct = true;  // Mark as a direct dep of root
                    decEndpoints[name] = {
                        name: name,
                        source: dir,
                        target: '*',
                        canonicalDir: dir,
                        pkgMeta: json,
                        linked: true
                    };
                });
            });
        });

        // Wait until all links have been read
        // and resolve with the decomposed endpoints
        return Q.all(promises)
        .then(function () {
            return decEndpoints;
        });
    // Ignore if folder does not exist
    }, function (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }

        return {};
    });
};

Project.prototype._removePackages = function (packages) {
    var that = this;
    var promises = [];

    mout.object.forOwn(packages, function (dir, name) {
        var promise;

        // Delete directory
        if (!dir) {
            promise = Q.resolve();
            that._logger.warn('not-installed', name, {
                name: name
            });
        } else {
            promise = Q.nfcall(rimraf, dir);
            that._logger.action('uninstall', name, {
                name: name,
                dir: dir
            });
        }

        // Remove from json only if successfully deleted
        if (that._options.save && that._json.dependencies) {
            promise = promise
            .then(function () {
                delete that._json.dependencies[name];
            });
        }

        if (that._options.saveDev && that._json.devDependencies) {
            promise = promise
            .then(function () {
                delete that._json.devDependencies[name];
            });
        }

        promises.push(promise);
    });

    return Q.all(promises)
    // Save json
    .then(function () {
        return that.saveJson();
    })
    // Resolve with removed packages
    .then(function () {
        return mout.object.filter(packages, function (dir) {
            return !!dir;
        });
    });
};

Project.prototype._restoreNode = function (node, flattened, jsonKey) {
    var deps;

    // Do not restore if the node is missing
    if (node.missing) {
        return;
    }

    node.dependencies = node.dependencies || {};
    node.dependants = node.dependants || {};

    // Only process deps that are yet processed
    deps = mout.object.filter(node.pkgMeta[jsonKey], function (value, key) {
        return !node.dependencies[key];
    });

    mout.object.forOwn(deps, function (value, key) {
        var local = flattened[key];
        var json = endpointParser.json2decomposed(key, value);
        var restored;
        var compatible;

        // Check if the dependency is not installed
        if (!local) {
            flattened[key] = restored = json;
            restored.missing = true;
        // Even if it is installed, check if it's compatible
        // Note that linked packages are interpreted as compatible
        // This might change in the future: #673
        } else {
            compatible = local.linked || (!local.missing && json.target === local.pkgMeta._target);

            if (!compatible) {
                restored = json;

                if (!local.missing) {
                    restored.pkgMeta = local.pkgMeta;
                    restored.canonicalDir = local.canonicalDir;
                    restored.incompatible = true;
                } else {
                    restored.missing = true;
                }
            } else {
                restored = local;
                mout.object.mixIn(local, json);
            }
        }

        // Cross reference
        node.dependencies[key] = restored;
        restored.dependants = restored.dependants || {};
        restored.dependants[node.name] = node;

        // Call restore for this dependency
        this._restoreNode(restored, flattened, 'dependencies');

        // Do the same for the incompatible local package
        if (local && restored !== local) {
            this._restoreNode(local, flattened, 'dependencies');
        }
    }, this);
};

module.exports = Project;
