var fs = require("fs");
var path = require("path");
var uuid = require("uuid");
var argv = require("yargs").argv;
var jsdom = require("jsdom");
var htmlparser2 = require("htmlparser2");

var all_models;
var file = argv._[0];
var ext = path.extname(file);
var basename = path.basename(file, ext);
var dirname = path.dirname(file);

switch (ext) {
  case ".html":
    var all_texts = [];
    var all_text = null;
    var parser = new htmlparser2.Parser({
      onopentag: function(name, attrs) {
        if (name == "script" && attrs.type == "text/x-bokeh") {
          all_text = "";
        }
      },
      ontext: function(text) {
        if (all_text !== null) {
          all_text += text;
        }
      },
      onclosetag: function(name) {
        if (name == "script" && all_text !== null) {
          all_texts.push(all_text);
          all_text = null;
        }
      }
    });
    parser.write(fs.readFileSync(file));
    parser.end();
    switch (all_texts.length) {
      case 0:
        throw new Error("no 'text/x-bokeh' sections found");
        break;
      case 1:
        all_models = JSON.parse(all_texts[0]);
        break;
      default:
        throw new Error("too many 'text/x-bokeh' sections");
    }
    break;
  case ".json":
    all_models = require(file);
    break;
  default:
    throw new Error("expected an HTML or JSON file");
}

global.document = jsdom.jsdom();
global.window = document.defaultView;
global.location = require("location");
global.navigator = require("navigator");
global.window.Canvas = require("canvas");
global.window.Image = global.window.Canvas.Image;

global.bokehRequire = require("./build/js/bokeh.js").bokehRequire;
require("./build/js/bokeh-widgets.js");

var Bokeh = global.window.Bokeh;

var head = document.getElementsByTagName('head')[0];
var link = document.createElement('link');
link.rel = 'stylesheet';
link.href = './build/css/bokeh.css';
head.appendChild(link);

Bokeh.set_log_level("debug");
Bokeh.load_models(all_models);

Bokeh.Collections("PlotContext").each(function(model) {
  var el = document.createElement("div");
  el.setAttribute("class", "plotdiv");
  document.body.appendChild(el);

  Bokeh.Events.on("render:done", function(plot_view) {
    var nodeCanvas = plot_view.canvas_view.canvas[0]._nodeCanvas;
    var name = basename + "-" + plot_view.model.id + ".png";
    var outfile = path.join(dirname, name)
    Bokeh.logger.info("writing " + outfile);
    var out = fs.createWriteStream(outfile);
    nodeCanvas.pngStream().on('data', function(chunk) { out.write(chunk); });
  });

  var view = new model.default_view({model: model, el: el});
  Bokeh.index[model.id] = view;
});
