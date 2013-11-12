var util = require('util');
var url = require('url');
var Q = require('q');
var mout = require('mout');
var LRU = require('lru-cache');
var GitResolver = require('./GitResolver');
var cmd = require('../../util/cmd');

function GitRemoteResolver(decEndpoint, config, logger) {
    GitResolver.call(this, decEndpoint, config, logger);

    if (!mout.string.startsWith(this._source, 'file://')) {
        // Trim trailing slashes
        this._source = this._source.replace(/\/+$/, '');
    }

    // If the name was guessed, remove the trailing .git
    if (this._guessedName && mout.string.endsWith(this._name, '.git')) {
        this._name = this._name.slice(0, -4);
    }

    // Get the host of this source
    if (!/\/\/:/.test(this._source)) {
        this._host = url.parse('ssh://' + this._source);
    } else {
        this._host = url.parse(this._source);
    }
}

util.inherits(GitRemoteResolver, GitResolver);
mout.object.mixIn(GitRemoteResolver, GitResolver);

// -----------------

GitRemoteResolver.prototype._checkout = function () {
    var promise;
    var timer;
    var reporter;
    var that = this;
    var resolution = this._resolution;

    this._logger.action('checkout', resolution.tag || resolution.branch || resolution.commit, {
        resolution: resolution,
        to: this._tempDir
    });

    // If resolution is a commit, we need to clone the entire repo and check it out
    // Because a commit is not a named ref, there's no better solution
    if (resolution.type === 'commit') {
        promise = this._slowClone(resolution);
    // Otherwise we are checking out a named ref so we can optimize it
    } else {
        promise = this._fastClone(resolution);
    }

    // Throttle the progress reporter to 1 time each sec
    reporter = mout['function'].throttle(function (data) {
        var lines = data.split(/[\r\n]+/);

        lines.forEach(function (line) {
            if (/\d{1,3}\%/.test(line)) {
                // TODO: There are some strange chars that appear once in a while (\u001b[K)
                //       Trim also those?
                that._logger.info('progress', line.trim());
            }
        });
    }, 1000);

    // Start reporting progress after a few seconds
    timer = setTimeout(function () {
        promise.progress(reporter);
    }, 8000);

    return promise
    // Clear timer at the end
    .fin(function () {
        clearTimeout(timer);
    });
};

// ------------------------------

GitRemoteResolver.prototype._slowClone = function (resolution) {
    return cmd('git', ['clone', this._source, this._tempDir, '--progress'])
    .then(cmd.bind(cmd, 'git', ['checkout', resolution.commit], { cwd: this._tempDir }));
};

GitRemoteResolver.prototype._fastClone = function (resolution) {
    var branch,
        args,
        that = this;

    branch = resolution.tag || resolution.branch;
    args = ['clone',  this._source, '-b', branch, '--progress', '.'];

    // If the host does not support shallow clones, we don't use --depth=1
    if (!GitRemoteResolver._noShallow.get(this._host)) {
        args.push('--depth', 1);
    }

    return cmd('git', args, { cwd: this._tempDir })
    .spread(function (stdout, stderr) {
        // Only after 1.7.10 --branch accepts tags
        // Detect those cases and inform the user to update git otherwise it's
        // a lot slower than newer versions
        if (!/branch .+? not found/i.test(stderr)) {
            return;
        }

        that._logger.warn('old-git', 'It seems you are using an old version of git, it will be slower and propitious to errors!');
        return cmd('git', ['checkout', resolution.commit], { cwd: that._tempDir });
    }, function (err) {
        // Some git servers do not support shallow clones
        // When that happens, we mark this host and try again
        if (!GitRemoteResolver._noShallow.has(that._source) &&
            err.details &&
            /rpc failed/i.test(err.details)
        ) {
            GitRemoteResolver._noShallow.set(that._host, true);
            return that._fastClone(resolution);
        }

        throw err;
    });
};

// ------------------------------

// Store hosts that do not support shallow clones here
GitRemoteResolver._noShallow = new LRU({ max: 50, maxAge: 5 * 60 * 1000 });

// Grab refs remotely
GitRemoteResolver.refs = function (source) {
    var value;

    // TODO: Normalize source because of the various available protocols?
    value = this._cache.refs.get(source);
    if (value) {
        return Q.resolve(value);
    }

    // Store the promise in the refs object
    value = cmd('git', ['ls-remote', '--tags', '--heads', source])
    .spread(function (stdout) {
        var refs;

        refs = stdout.toString()
        .trim()                         // Trim trailing and leading spaces
        .replace(/[\t ]+/g, ' ')        // Standardize spaces (some git versions make tabs, other spaces)
        .split(/[\r\n]+/);              // Split lines into an array

        // Update the refs with the actual refs
        this._cache.refs.set(source, refs);

        return refs;
    }.bind(this));

    // Store the promise to be reused until it resolves
    // to a specific value
    this._cache.refs.set(source);

    return value;
};

module.exports = GitRemoteResolver;
