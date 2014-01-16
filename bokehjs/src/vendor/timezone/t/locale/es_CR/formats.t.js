#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/es_CR"));
  // es_CR date representation
  equal(tz("2000-09-03", "%x", "es_CR"), "03/09/2000", "date format");

  // es_CR time representation
  equal(tz("2000-09-03 08:05:04", "%X", "es_CR"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "es_CR"), "23:05:04", "long time format evening");

  // es_CR date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "es_CR"), "dom 03 sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "es_CR"), "dom 03 sep 2000 23:05:04 UTC", "long date format evening");
});
