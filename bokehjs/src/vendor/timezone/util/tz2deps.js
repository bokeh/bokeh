var fs = require("fs");

process.stdout.write("timezones = ");

process.argv.slice(2).forEach(function (file) {
  fs.readFileSync(file, "utf8").split(/\n/).forEach(function (line) {
    var $;
    if ($ = /^Zone\s+(\S+)/.exec(line)) {
      process.stdout.write(" \\\n\t" + $[1]);
    }
    if ($ = /^Link\s+\S+\s+(\S+)/.exec(line)) {
      process.stdout.write(" \\\n\t" + $[1]);
    }
  });
});

process.stdout.write("\n");
