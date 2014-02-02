#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/uk_UA"));
  // uk_UA date representation
  equal(tz("2000-09-03", "%x", "uk_UA"), "03.09.00", "date format");

  // uk_UA time representation
  equal(tz("2000-09-03 08:05:04", "%X", "uk_UA"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "uk_UA"), "23:05:04", "long time format evening");

  // uk_UA date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "uk_UA"), "нд, 03-вер-2000 08:05:04 +0000", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "uk_UA"), "нд, 03-вер-2000 23:05:04 +0000", "long date format evening");
});
