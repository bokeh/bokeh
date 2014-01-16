#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/he_IL"));
  // he_IL date representation
  equal(tz("2000-09-03", "%x", "he_IL"), "03/09/00", "date format");

  // he_IL time representation
  equal(tz("2000-09-03 08:05:04", "%X", "he_IL"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "he_IL"), "23:05:04", "long time format evening");

  // he_IL date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "he_IL"), "UTC 08:05:04 2000 ספט 03 א'", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "he_IL"), "UTC 23:05:04 2000 ספט 03 א'", "long date format evening");
});
