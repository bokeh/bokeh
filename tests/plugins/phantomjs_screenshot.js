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

function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : global_wait, //< default timeout is 'global_wait' period
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    // we return success=true here because some cases don't correctly return is_idle (i.e. TileRenderers)
                    finalize(true, true);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, local_wait); //< repeat check every 'local_wait' period
};

page.viewportSize = { width: width, height: height };

page.onError = function(msg, trace) {
  errors.push({
    msg: msg,
    trace: trace.map(function(item) {
      return { file: item.file, line: item.line };
    }),
  });
};

page.onResourceError = function(response) {
  resources.push(response);
};

page.onConsoleMessage = function(msg, line, source) {
  messages.push({msg: msg, line: line, source: source});
};

page.onCallback = function(data) {
  if (data === 'done') {
    finalize(false, true);
  }
};

page.open(url, function(status) {
  if (status === 'fail') {
    finalize(false, false);
  } else {
    waitFor(function() {
      return page.evaluate(function() {
        // this will annoying be set repeatedly, but we need to make sure it happens
        document.body.bgColor = 'white';
        // wait for BokehJS to be loaded
        if (window.Bokeh == undefined) {
          return false
        };
        // check that document is done rendering
        var docs = window.Bokeh.documents;
        if (docs.length == 0) {
          return false
        };
        return docs[0].is_idle
      });
    }, function() {
      page.evaluate(function() {
        window.callPhantom('done');
      });
    });
  };
});
