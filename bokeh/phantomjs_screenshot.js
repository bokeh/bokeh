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

var globalTimer = setTimeout(function() { finalize(true, true); }, global_wait);
var localTimer = null;

function resetLocalTimer() {
  if (localTimer != null) {
    clearTimeout(localTimer);
  }

  localTimer = setTimeout(function() { finalize(false, true); }, local_wait);
}

function finalize(timeout, success) {
  if (png != null) {
    page.render(png);
  }

  console.log(JSON.stringify({
    success: success,
    timeout: timeout,
    errors: errors,
    messages: messages,
    resources: resources,
  }));

  phantom.exit();
}

page.onError = function(msg, trace) {
  resetLocalTimer();
  errors.push({
    msg: msg,
    trace: trace.map(function(item) {
      return { file: item.file, line: item.line };
    }),
  });
};

page.onResourceError = function(response) {
  resetLocalTimer();
  resources.push(response);
};

page.onConsoleMessage = function(msg, line, source) {
  if (localTimer != null) resetLocalTimer();
  messages.push({msg: msg, line: line, source: source});
};

page.viewportSize = { width: width, height: height };

page.open(url, function(status) {
  if (status === 'fail') {
    finalize(false, false);
  }

  page.evaluate(function() {
    document.body.bgColor = 'white';

    window.addEventListener("bokeh:rendered", function() {
      window.callPhantom('working');
    });
  });

  page.onCallback = function(data) {
    if (data === 'working') {
      resetLocalTimer();
    }
  };
});
