var gulp = require("gulp");
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

gulp.task("default", ["scripts"], function() {
  gulp.watch("./src/coffee/**/*.coffee", ["scripts"]);
})
