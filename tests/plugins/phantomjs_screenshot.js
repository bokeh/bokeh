var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

var url = system.args[1];
var png = system.args[2];
var local_wait = system.args[3];
var global_wait = system.args[4];
var width = system.args[5];
var height = system.args[6];

var errors = [];
var messages = [];
var resources = [];

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

page.viewportSize = { width: width, height: height };

page.open(url, function(status) {
  function finalize(timeout) {
    if (png != null) {
      page.render(png);
    }

    console.log(JSON.stringify({
      status: status,
      timeout: timeout,
      errors: errors,
      messages: messages,
      resources: resources,
    }));

    phantom.exit();
  }

  if (status !== 200) {
    finalize(false);
  }

  page.evaluate(function() {
    document.body.bgColor = 'white';

    window.addEventListener("bokeh:rendered", function() {
      window.callPhantom('working');
    });
  });

  var global_id = setTimeout(function() { finalize(true); }, global_wait);
  var local_id = null;

  page.onCallback = function(data) {
    if (data === 'working') {
      if (local_id != null) {
        clearTimeout(local_id);
      }

      local_id = setTimeout(function() { finalize(false); }, local_wait);
    }
  };
});
