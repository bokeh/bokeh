#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/af_ZA"));
  // af_ZA date representation
  equal(tz("2000-09-03", "%x", "af_ZA"), "03/09/2000", "date format");

  // af_ZA time representation
  equal(tz("2000-09-03 08:05:04", "%X", "af_ZA"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "af_ZA"), "23:05:04", "long time format evening");

  // af_ZA date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "af_ZA"), "So 03 Sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "af_ZA"), "So 03 Sep 2000 23:05:04 UTC", "long date format evening");
});
