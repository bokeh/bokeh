#!/usr/bin/env node
require("../proof")(3, function (equal, tz, y2k, utc) {
  equal(tz(y2k, "%N"), "000000000", "top of hour");
  equal(tz(utc(1980, 0, 1, 0, 0, 1, 999), "%N"), "999000000", "last millisecond");
  equal(tz(utc(1980, 0, 1, 0, 0, 1, 3), "%N"), "003000000", "nanoseconds");
});
