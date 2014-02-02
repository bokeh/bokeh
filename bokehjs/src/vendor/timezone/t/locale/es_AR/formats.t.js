#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/es_AR"));
  // es_AR date representation
  equal(tz("2000-09-03", "%x", "es_AR"), "03/09/00", "date format");

  // es_AR time representation
  equal(tz("2000-09-03 08:05:04", "%X", "es_AR"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "es_AR"), "23:05:04", "long time format evening");

  // es_AR date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "es_AR"), "dom 03 sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "es_AR"), "dom 03 sep 2000 23:05:04 UTC", "long date format evening");
});
