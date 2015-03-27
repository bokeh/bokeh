var gulp = require("gulp");
var gutil = require("gulp-util");
var spawn = require("child_process").spawn;
var uglify = require("gulp-uglifyjs");
var browserify = require("browserify");
var source = require("vinyl-source-stream");


var alias = function(name) {
  return {cwd: "src/coffee/" + name, base: name};
};

gulp.task("scripts", function() {
  var opts = {
    entries: ["./src/coffee/main.coffee"],
    extensions: [".coffee", ".eco"]
  }

  return browserify(opts)
    .transform("browserify-eco")
    .transform("coffeeify")
    .bundle()
    .pipe(source("bokeh.js"))
    .pipe(gulp.dest("./build/js/"))
});

gulp.task("minify", ["scripts"], function() {
  return gulp.src("./build/js/bokeh.js")
    .pipe(uglify("bokeh.min.js"))
    .pipe(gulp.dest("./build/js/"))
});

var serverOutput = function(data) {
  var prefix = gutil.colors.cyan("setup.py:")
  data.replace(/\s*$/, "")
    .split("\n")
    .forEach(function(line) {
      gutil.log(prefix + " " + gutil.colors.grey(line))
    });
};

gulp.task("install-js", ["minify"], function(cb) {
  var setup = spawn("python", ["../setup.py", "develop", "--install_js"])
  setup.stdout.setEncoding("utf8");
  setup.stdout.on("data", serverOutput)
  setup.stderr.setEncoding("utf8");
  setup.stderr.on("data", serverOutput);
  setup.on("exit", function() {
    gutil.log("setup.py DONE!");
    cb();
  })
});

gulp.task("develop", ["install-js"], function() {
  gulp.watch("./src/coffee/**/*.coffee", ["install-js"])
});

gulp.task("default", ["minify"], function() {
  gulp.watch("./src/coffee/**/*.coffee", ["minify"]);
})
