var EventEmitter = require('events').EventEmitter;
var util = require('util');

var slice = Array.prototype.slice;

function Logger() {
    this._interceptors = [];
    this._piped = [];
}

util.inherits(Logger, EventEmitter);

Logger.prototype.intercept = function (fn) {
    this._interceptors.push(fn);
    return this;
};

Logger.prototype.emit = function () {
    var ret;
    var args = slice.call(arguments);

    // Run interceptors before
    if (args[0] === 'log') {
        this._interceptors.forEach(function (interceptor) {
            interceptor.apply(this, args.slice(1));
        });
    }

    ret = EventEmitter.prototype.emit.apply(this, args);

    // Pipe
    this._piped.forEach(function (emitter) {
        emitter.emit.apply(emitter, args);
    });

    return ret;
};

Logger.prototype.pipe = function (emitter) {
    this._piped.push(emitter);

    return emitter;
};

Logger.prototype.geminate = function () {
    var logger = new Logger();

    logger.pipe(this);
    return logger;
};

Logger.prototype.log = function (level, id, message, data) {
    var log = {
        level: level,
        id: id,
        message: message,
        data: data || {}
    };

    // Emit log
    this.emit('log', log);

    return this;
};

// ------------------

Logger.LEVELS = {
    'error': 5,
    'conflict': 4,
    'warn': 3,
    'action': 2,
    'info': 1,
    'debug': 0
};

// Add helpful log methods
Object.keys(Logger.LEVELS).forEach(function (level) {
    Logger.prototype[level] = function (id, message, data) {
        this.log(level, id, message, data);
    };
});

module.exports = Logger;
