#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/sr_RS"));
  // sr_RS date representation
  equal(tz("2000-09-03", "%x", "sr_RS"), "03.09.2000.", "date format");

  // sr_RS time representation
  equal(tz("2000-09-03 08:05:04", "%X", "sr_RS"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "sr_RS"), "23:05:04", "long time format evening");

  // sr_RS date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "sr_RS"), "недеља, 03. септембар 2000. 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "sr_RS"), "недеља, 03. септембар 2000. 23:05:04 UTC", "long date format evening");
});
