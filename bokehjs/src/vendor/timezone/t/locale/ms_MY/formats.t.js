#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/ms_MY"));
  // ms_MY date representation
  equal(tz("2000-09-03", "%x", "ms_MY"), "Ahad 03 Sep 2000", "date format");

  // ms_MY time representation
  equal(tz("2000-09-03 08:05:04", "%X", "ms_MY"), "08:05:04  UTC", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "ms_MY"), "11:05:04  UTC", "long time format evening");

  // ms_MY date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "ms_MY"), "Ahad 03 Sep 2000 08:05:04  UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "ms_MY"), "Ahad 03 Sep 2000 11:05:04  UTC", "long date format evening");
});
