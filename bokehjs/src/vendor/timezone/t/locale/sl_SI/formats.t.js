#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/sl_SI"));
  // sl_SI date representation
  equal(tz("2000-09-03", "%x", "sl_SI"), "03. 09. 2000", "date format");

  // sl_SI time representation
  equal(tz("2000-09-03 08:05:04", "%X", "sl_SI"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "sl_SI"), "23:05:04", "long time format evening");

  // sl_SI date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "sl_SI"), "ned 03 sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "sl_SI"), "ned 03 sep 2000 23:05:04 UTC", "long date format evening");
});
