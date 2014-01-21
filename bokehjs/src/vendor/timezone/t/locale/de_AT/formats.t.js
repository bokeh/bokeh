#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/de_AT"));
  // de_AT date representation
  equal(tz("2000-09-03", "%x", "de_AT"), "2000-09-03", "date format");

  // de_AT time representation
  equal(tz("2000-09-03 08:05:04", "%X", "de_AT"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "de_AT"), "23:05:04", "long time format evening");

  // de_AT date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "de_AT"), "Son 03 Sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "de_AT"), "Son 03 Sep 2000 23:05:04 UTC", "long date format evening");
});
