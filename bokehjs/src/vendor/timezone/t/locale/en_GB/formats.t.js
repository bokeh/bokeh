#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/en_GB"));
  // en_GB date representation
  equal(tz("2000-09-03", "%x", "en_GB"), "03/09/00", "date format");

  // en_GB time representation
  equal(tz("2000-09-03 08:05:04", "%X", "en_GB"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "en_GB"), "23:05:04", "long time format evening");

  // en_GB date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "en_GB"), "Sun 03 Sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "en_GB"), "Sun 03 Sep 2000 23:05:04 UTC", "long date format evening");
});
