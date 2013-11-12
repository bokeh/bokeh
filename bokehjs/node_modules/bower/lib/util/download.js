var progress = require('request-progress');
var request = require('request');
var Q = require('q');
var mout = require('mout');
var retry = require('retry');
var fs = require('graceful-fs');
var createError = require('./createError');

var errorCodes = [
    'EADDRINFO',
    'ETIMEDOUT',
    'ECONNRESET',
    'ESOCKETTIMEDOUT'
];

function download(url, file, options) {
    var operation;
    var response;
    var deferred = Q.defer();
    var progressDelay = 8000;

    options = mout.object.mixIn({
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 35000,
        randomize: true
    }, options || {});

    // Retry on network errors
    operation = retry.operation(options);
    operation.attempt(function () {
        var req = progress(request(url, options), {
            delay: progressDelay
        })
        .on('response', function (res) {
            var status = res.statusCode;

            if (status < 200 || status >= 300) {
                return deferred.reject(createError('Status code of ' + status, 'EHTTP'));
            }

            response = res;
        })
        .on('progress', function (state) {
            deferred.notify(state);
        })
        .on('error', function (error) {
            var timeout = operation._timeouts[0];

            // Reject if error is not a network error
            if (errorCodes.indexOf(error.code) === -1) {
                return deferred.reject(error);
            }

            // Next attempt will start reporting download progress immediately
            progressDelay = 0;

            // Check if there are more retries
            if (operation.retry(error)) {
                // Ensure that there are no more "error" events from this request
                req.removeAllListeners('error');
                req.removeAllListeners('progress');
                req.on('error', function () {});

                return deferred.notify({
                    retry: true,
                    delay: timeout,
                    error: error
                });
            }

            // No more retries, reject!
            deferred.reject(error);
        });

        // Pipe read stream to write stream
        req
        .pipe(fs.createWriteStream(file))
        .on('error', deferred.reject)
        .on('close', function () {
            deferred.resolve(response);
        });
    });

    return deferred.promise;
}

module.exports = download;
