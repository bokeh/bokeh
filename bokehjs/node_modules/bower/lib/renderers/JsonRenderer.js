var chalk = require('chalk');

function JsonRenderer() {
    this._nrLogs = 0;
}

JsonRenderer.prototype.end = function (data) {
    if (this._nrLogs) {
        process.stderr.write(']\n');
    }

    if (data) {
        process.stdout.write(this._stringify(data) + '\n');
    }
};

JsonRenderer.prototype.error = function (err) {
    var message = err.message;

    err.id = err.code || 'error';
    err.level = 'error';
    err.data = err.data || {};

    // Need to set message again because it is
    // not enumerable in some cases
    delete err.message;
    err.message = message;

    this.log(err);
    this.end();
};

JsonRenderer.prototype.log = function (log) {
    if (!this._nrLogs) {
        process.stderr.write('[');
    } else {
        process.stderr.write(', ');
    }

    process.stderr.write(this._stringify(log));
    this._nrLogs++;
};

JsonRenderer.prototype.updateAvailable = function () {};

// -------------------------

JsonRenderer.prototype._stringify = function (log) {
    // To json
    var str = JSON.stringify(log, null, '  ');
    // Remove colors in case some log has colors..
    str = chalk.stripColor(str);

    return str;
};

module.exports = JsonRenderer;
