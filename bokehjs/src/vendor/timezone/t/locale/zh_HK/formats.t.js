#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/zh_HK"));
  // zh_HK date representation
  equal(tz("2000-09-03", "%x", "zh_HK"), "2000年09月03日 星期日", "date format");

  // zh_HK time representation
  equal(tz("2000-09-03 08:05:04", "%X", "zh_HK"), "08時05分04秒 UTC", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "zh_HK"), "11時05分04秒 UTC", "long time format evening");

  // zh_HK date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "zh_HK"), "2000年09月03日 星期日 08:05:04", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "zh_HK"), "2000年09月03日 星期日 23:05:04", "long date format evening");
});
