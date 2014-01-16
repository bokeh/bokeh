#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/en_CA"));
  // en_CA date representation
  equal(tz("2000-09-03", "%x", "en_CA"), "03/09/00", "date format");

  // en_CA time representation
  equal(tz("2000-09-03 08:05:04", "%X", "en_CA"), "08:05:04 AM", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "en_CA"), "11:05:04 PM", "long time format evening");

  // en_CA date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "en_CA"), "Sun 03 Sep 2000 08:05:04 AM UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "en_CA"), "Sun 03 Sep 2000 11:05:04 PM UTC", "long date format evening");
});
