var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

var file = system.args[1];
var url = 'file://' + fs.absolute(file);

var errors = [];

page.onError = function(msg, trace) {
    errors.push({
        msg: msg,
        trace: trace.map(function(item) {
            return { file: item.file, line: item.line };
        }),
    });
};

// TODO: fit viewport's size to content
page.viewportSize = { width: 1000, height: 1000 };

page.open(url, function(status) {
    page.evaluate(function() {
        document.body.bgColor = 'white';
    });

    // TODO: get notified when Bokeh finished rendering
    window.setTimeout(function() {
        page.render(file + '.png');

        console.log(JSON.stringify({
            status: status,
            errors: errors,
        }));

        phantom.exit();
    }, 1000);
});
