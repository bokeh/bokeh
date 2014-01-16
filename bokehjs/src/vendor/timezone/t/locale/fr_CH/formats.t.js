#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/fr_CH"));
  // fr_CH date representation
  equal(tz("2000-09-03", "%x", "fr_CH"), "03. 09. 00", "date format");

  // fr_CH time representation
  equal(tz("2000-09-03 08:05:04", "%X", "fr_CH"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "fr_CH"), "23:05:04", "long time format evening");

  // fr_CH date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "fr_CH"), "dim 03 sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "fr_CH"), "dim 03 sep 2000 23:05:04 UTC", "long date format evening");
});
