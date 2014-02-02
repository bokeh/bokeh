#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/si_LK"));
  // si_LK date representation
  equal(tz("2000-09-03", "%x", "si_LK"), "2000-09-03", "date format");

  // si_LK time representation
  equal(tz("2000-09-03 08:05:04", "%X", "si_LK"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "si_LK"), "23:05:04", "long time format evening");

  // si_LK date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "si_LK"), "2000-09-03 08:05:04 +0000", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "si_LK"), "2000-09-03 23:05:04 +0000", "long date format evening");
});
