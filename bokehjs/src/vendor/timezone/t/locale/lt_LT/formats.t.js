#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/lt_LT"));
  // lt_LT date representation
  equal(tz("2000-09-03", "%x", "lt_LT"), "2000.09.03", "date format");

  // lt_LT time representation
  equal(tz("2000-09-03 08:05:04", "%X", "lt_LT"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "lt_LT"), "23:05:04", "long time format evening");

  // lt_LT date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "lt_LT"), "2000 m. rugsėjo 03 d. 08:05:04", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "lt_LT"), "2000 m. rugsėjo 03 d. 23:05:04", "long date format evening");
});
