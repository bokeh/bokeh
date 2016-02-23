var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

var tpe = system.args[1];
var url = system.args[2];
var png = system.args[3];
var timeout = system.args[4];

var errors = [];
var messages = [];
var resources = [];

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

page.onError = function(msg, trace) {
    errors.push({
        msg: msg,
        trace: trace.map(function(item) {
            return { file: item.file, line: item.line };
        }),
    });
};

page.onConsoleMessage = function(msg, line, source) {
    messages.push({
        msg: msg,
        line: line,
        source: source,
    });
};

page.onResourceReceived = function(response) {
    if (response.stage === 'end') {
        var status = response.status;

        if (response.url.slice(0, 7) === "file://") {
            var path = response.url.slice(7);

            if (!fs.exists(path)) {
                response.status = 404;
                response.statusText = "NOT FOUND";
                resources.push(response);
            }
        } else if (status && status >= 400) {
            resources.push(response);
        }
    }
};

// TODO: fit viewport's size to content
if (tpe === 'notebook') {
        page.viewportSize = { width: 1000, height: 2000 };
    } else {
        page.viewportSize = { width: 1000, height: 1000 };
    }

page.open(url, function(status) {
    page.evaluate(function() {
        document.body.bgColor = 'white';
    });

    // TODO: get notified when Bokeh finished rendering
    window.setTimeout(function() {
        if (png !== undefined) {
            page.render(png);
        }

        console.log(JSON.stringify({
            status: status,
            errors: errors,
            messages: messages,
            resources: resources,
        }));

        phantom.exit();
    }, timer());
});

function timer() {
    if (tpe === 'notebook') {
        return timeout * 1000;
    } else {
        return 1000;
    }
}
