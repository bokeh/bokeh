#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/de_DE"));
  // de_DE date representation
  equal(tz("2000-09-03", "%x", "de_DE"), "03.09.2000", "date format");

  // de_DE time representation
  equal(tz("2000-09-03 08:05:04", "%X", "de_DE"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "de_DE"), "23:05:04", "long time format evening");

  // de_DE date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "de_DE"), "So 03 Sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "de_DE"), "So 03 Sep 2000 23:05:04 UTC", "long date format evening");
});
