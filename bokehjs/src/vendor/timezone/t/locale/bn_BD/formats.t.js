#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/bn_BD"));
  // bn_BD date representation
  equal(tz("2000-09-03", "%x", "bn_BD"), "রবিবার 03 সেপ্টে 2000", "date format");

  // bn_BD time representation
  equal(tz("2000-09-03 08:05:04", "%X", "bn_BD"), "08:05:04  UTC", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "bn_BD"), "11:05:04  UTC", "long time format evening");

  // bn_BD date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "bn_BD"), "রবিবার 03 সেপ্টে 2000 08:05:04 পূর্বাহ্ণ UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "bn_BD"), "রবিবার 03 সেপ্টে 2000 11:05:04 অপরাহ্ণ UTC", "long date format evening");
});
