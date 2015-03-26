var gulp = require("gulp");
var coffeeify = require("gulp-coffeeify");
var template = require('gulp-eco-template');


var alias = function(name) {
  return {cwd: "src/coffee/" + name, base: name};
};

gulp.task("scripts", function() {
  gulp.src("src/coffee/main.coffee")
    .pipe(coffeeify({
      // TOOD: Remove these as they are ported to true CommonJS style
      aliases: [
        alias("common"),
        alias("mapper"),
        alias("palettes"),
        alias("range"),
        alias("renderer"),
        alias("server"),
        alias("source"),
        alias("ticking"),
        alias("tool"),
        alias("transforms"),
        alias("util"),
        alias("widget")
      ]
    }))
    .pipe(gulp.dest("./build/js"));
});

gulp.task('eco', function(){
  gulp.src('./src/templates/**/*.eco')
    .pipe(template({author: "Continuum Analytics"}))
    .pipe(gulp.dest('./build'));
});
