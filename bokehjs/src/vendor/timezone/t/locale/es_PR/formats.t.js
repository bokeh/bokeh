#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/es_PR"));
  // es_PR date representation
  equal(tz("2000-09-03", "%x", "es_PR"), "03/09/00", "date format");

  // es_PR time representation
  equal(tz("2000-09-03 08:05:04", "%X", "es_PR"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "es_PR"), "23:05:04", "long time format evening");

  // es_PR date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "es_PR"), "dom 03 sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "es_PR"), "dom 03 sep 2000 23:05:04 UTC", "long date format evening");
});
