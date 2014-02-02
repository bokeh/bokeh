#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/zh_TW"));
  // zh_TW date representation
  equal(tz("2000-09-03", "%x", "zh_TW"), "西元2000年09月03日", "date format");

  // zh_TW time representation
  equal(tz("2000-09-03 08:05:04", "%X", "zh_TW"), "08時05分04秒", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "zh_TW"), "23時05分04秒", "long time format evening");

  // zh_TW date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "zh_TW"), "西元2000年09月03日 (週日) 08時05分04秒", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "zh_TW"), "西元2000年09月03日 (週日) 23時05分04秒", "long date format evening");
});
