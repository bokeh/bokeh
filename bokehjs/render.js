var fs = require("fs");
var path = require("path");
var uuid = require("uuid");
var yargs = require("yargs");
var jsdom = require("jsdom");
var htmlparser2 = require("htmlparser2");

var argv = yargs
  .options({
    l: {
      alias: 'log-level',
      type: 'string',
      choices: ['debug', 'info', 'warn', 'error', 'fatal', 'none'],
      default: 'info',
    },
    js: {
      type: 'string',
      default: path.join(__dirname, 'build/js'),
    },
    css: {
      type: 'string',
      default: path.join(__dirname, 'build/css'),
    },
  })
  .help('h').alias('h', 'help')
  .argv;

function readStdin() {
  var stdin = process.stdin;
  var data = "";

  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', function (chunk) {
    data += chunk;
  });

  stdin.on('end', function () {
    var docs_json = JSON.parse(data);
    render(docs_json, null);
  });
}

function readFile(file) {
  var docs_json;

  switch (path.extname(file)) {
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
          docs_json = JSON.parse(all_texts[0]);
          break;
        default:
          throw new Error("too many 'text/x-bokeh' sections");
      }
      break;
    case ".json":
      docs_json = require(file);
      break;
    default:
      throw new Error("expected an HTML or JSON file");
  }

  render(docs_json, file);
}

function render(docs_json, file) {
  global.document = jsdom.jsdom();
  global.window = document.defaultView;
  global.location = require("location");
  global.navigator = require("navigator");
  global.window.Canvas = require("canvas");
  global.window.Image = global.window.Canvas.Image;

  global.bokehRequire = require(path.join(argv.js, "bokeh.js")).bokehRequire;
  require(path.join(argv.js, "bokeh-widgets.js"));

  var Bokeh = global.window.Bokeh;
  Bokeh.set_log_level(argv.logLevel);

  function insertCSS(href) {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    head.appendChild(link);
  }

  insertCSS(path.join(argv.css, "bokeh.js"));
  insertCSS(path.join(argv.css, "bokeh-widgets.js"));

  function outPath(file) {
    if (file) {
      var basename = path.basename(file, path.extname(file));
      var dirname = path.dirname(file);
    } else {
      var basename = "stdin";
      var dirname = __dirname;
    }
    return function(id) {
      var name = basename + (id ? "-" + id : "") + ".png";
      return path.join(dirname, name);
    };
  }

  Bokeh.Events.on("render:done", function(plot_view) {
    var nodeCanvas = plot_view.canvas_view.canvas[0]._nodeCanvas;
    var outFile = outPath(file)(plot_view.model.id);
    Bokeh.logger.info("writing " + outFile);
    var out = fs.createWriteStream(outFile);
    nodeCanvas.pngStream().on('data', function(chunk) { out.write(chunk); });
  });

  var render_items = [];

  Object.keys(docs_json).forEach(function(docid) {
    var el = document.createElement("div");
    var elementid = uuid.v4();
    el.setAttribute("id", elementid);
    el.setAttribute("class", "plotdiv");
    document.body.appendChild(el);
    render_items.push({"docid": docid, "elementid": elementid, "modelid": null});
  });

  Bokeh.embed.embed_items(docs_json, render_items, null);
}

var file = argv._[0];

if (file == null) {
  readStdin();
} else {
  readFile(file);
}
