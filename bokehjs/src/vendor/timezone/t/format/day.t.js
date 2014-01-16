#!/usr/bin/env node
require("../proof")(9, function (equal, tz, bicentennial, moonwalk, y2k) {
  equal(tz(y2k, "%j"), "001", "day of year y2k");
  equal(tz(moonwalk, "%j"), "202", "day of year moonwalk");
  equal(tz(bicentennial, "%j"), "186", "day of year bicentenial");
  equal(tz(y2k, "%u"), "6", "day of week starting monday y2k");
  equal(tz(moonwalk, "%u"), "1", "day of week starting monday moonwalk");
  equal(tz(bicentennial, "%u"), "7", "day of week starting monday bicentenial");
  equal(tz(y2k, "%w"), "6", "day of week starting sunday y2k");
  equal(tz(moonwalk, "%w"), "1", "day of week starting sunday moonwalk");
  equal(tz(bicentennial, "%w"), "0", "day of week starting sunday bicentenial");
});
