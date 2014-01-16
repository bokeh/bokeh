#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/eu_ES"));
  // eu_ES date representation
  equal(tz("2000-09-03", "%x", "eu_ES"), "ig., 2000.eko iraren 03a", "date format");

  // eu_ES time representation
  equal(tz("2000-09-03 08:05:04", "%X", "eu_ES"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "eu_ES"), "23:05:04", "long time format evening");

  // eu_ES date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "eu_ES"), "00-09-03 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "eu_ES"), "00-09-03 23:05:04 UTC", "long date format evening");
});
