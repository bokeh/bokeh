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

  browserify(opts)
    .transform("browserify-eco")
    .transform("coffeeify")
    .bundle()
    .pipe(source("bokeh.js"))
    .pipe(gulp.dest("./build/js/"))
});

gulp.task('eco', function(){
  gulp.src('./src/templates/**/*.eco')
    .pipe(template({author: "Continuum Analytics"}))
    .pipe(gulp.dest('./build'));
});
