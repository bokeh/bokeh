#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/bg_BG"));
  // bg_BG date representation
  equal(tz("2000-09-03", "%x", "bg_BG"), " 3.09.2000", "date format");

  // bg_BG time representation
  equal(tz("2000-09-03 08:05:04", "%X", "bg_BG"), " 8,05,04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "bg_BG"), "23,05,04", "long time format evening");

  // bg_BG date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "bg_BG"), " 3.09.2000 (нд)  8,05,04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "bg_BG"), " 3.09.2000 (нд) 23,05,04 UTC", "long date format evening");
});
