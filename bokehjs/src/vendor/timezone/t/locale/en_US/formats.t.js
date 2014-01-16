#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/en_US"));
  // en_US date representation
  equal(tz("2000-09-03", "%x", "en_US"), "09/03/2000", "date format");

  // en_US time representation
  equal(tz("2000-09-03 08:05:04", "%X", "en_US"), "08:05:04 AM", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "en_US"), "11:05:04 PM", "long time format evening");

  // en_US date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "en_US"), "Sun 03 Sep 2000 08:05:04 AM UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "en_US"), "Sun 03 Sep 2000 11:05:04 PM UTC", "long date format evening");
});
