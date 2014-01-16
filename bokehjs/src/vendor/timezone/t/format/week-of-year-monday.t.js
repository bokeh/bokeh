#!/usr/bin/env node
require("../proof")(14640, function (equal, tz, readDate) {
  var formatted, lines, line, i, I, date, dayOfYear, record;
  formatted = __dirname + "/../data/format";
  lines = require("fs").readFileSync(formatted + "/W", "utf8").split(/\n/);
  lines.pop()
  for (i = 0, I = lines.length; i < I; i++) {
    line = lines[i];
    record = line.split(/\s+/);
    date = record[0];
    dayOfYear = record[1];
    equal(tz(readDate(date), "%W"), dayOfYear, "week of year monday" + date);
  }
});
