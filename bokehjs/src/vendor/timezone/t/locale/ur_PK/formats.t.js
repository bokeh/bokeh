#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/ur_PK"));
  // ur_PK date representation
  equal(tz("2000-09-03", "%x", "ur_PK"), "03/09/2000", "date format");

  // ur_PK time representation
  equal(tz("2000-09-03 08:05:04", "%X", "ur_PK"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "ur_PK"), "23:05:04", "long time format evening");

  // ur_PK date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "ur_PK"), "و 08:05:04 UTC ت 03 ستمبر 2000", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "ur_PK"), "و 23:05:04 UTC ت 03 ستمبر 2000", "long date format evening");
});
