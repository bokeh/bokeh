#!/usr/bin/env node
require("../proof")(3, function (equal, tz, utc) {
  equal(tz(utc(2011, 0, 1, 0, 0), "%M"), "00", "top of hour");
  equal(tz(utc(2011, 0, 1, 0, 1), "%M"), "01", "minutes");
  equal(tz(utc(2011, 0, 1, 0, 59), "%M"), "59", "last minute");
});
