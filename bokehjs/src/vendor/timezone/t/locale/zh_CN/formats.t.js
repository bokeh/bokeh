#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/zh_CN"));
  // zh_CN date representation
  equal(tz("2000-09-03", "%x", "zh_CN"), "2000年09月03日", "date format");

  // zh_CN time representation
  equal(tz("2000-09-03 08:05:04", "%X", "zh_CN"), "08时05分04秒", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "zh_CN"), "23时05分04秒", "long time format evening");

  // zh_CN date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "zh_CN"), "2000年09月03日 星期日 08时05分04秒", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "zh_CN"), "2000年09月03日 星期日 23时05分04秒", "long date format evening");
});
