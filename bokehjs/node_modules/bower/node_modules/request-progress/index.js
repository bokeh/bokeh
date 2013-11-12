'use strict';

var throttle = require('throttleit');

function requestProgress(request, options) {
    var reporter;
    var delayTimer;
    var delayCompleted;
    var totalSize;
    var previousReceivedSize;
    var receivedSize = 0;
    var state = {};

    options = options || {};
    options.throttle = options.throttle == null ? 1000 : options.throttle;
    options.delay = options.delay || 0;

    request
    .on('request', function () {
        receivedSize = 0;
    })
    .on('response', function (response) {
        state.total = totalSize = Number(response.headers['content-length']);
        receivedSize = 0;

        // Check if there's no total size or is invalid (NaN)
        if (!totalSize) {
            return;
        }

        // Throttle the function
        reporter = throttle(function () {
            // If there received size is the same, abort
            if (previousReceivedSize === receivedSize) {
                return;
            }

            state.received = previousReceivedSize = receivedSize;
            state.percent = Math.round(receivedSize / totalSize * 100);
            request.emit('progress', state);
        }, options.throttle);

        // Delay the progress report
        delayTimer = setTimeout(function () {
            delayCompleted = true;
            delayTimer = null;
        }, options.delay);
    })
    .on('data', function (data) {
        receivedSize += data.length;

        if (delayCompleted) {
            reporter();
        }
    })
    .on('end', function () {
        if (!delayCompleted) {
            clearTimeout(delayTimer);
        }
    });

    return request;
}

module.exports = requestProgress;
