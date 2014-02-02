#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/es_SV"));
  // es_SV date representation
  equal(tz("2000-09-03", "%x", "es_SV"), "03/09/00", "date format");

  // es_SV time representation
  equal(tz("2000-09-03 08:05:04", "%X", "es_SV"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "es_SV"), "23:05:04", "long time format evening");

  // es_SV date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "es_SV"), "dom 03 sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "es_SV"), "dom 03 sep 2000 23:05:04 UTC", "long date format evening");
});
