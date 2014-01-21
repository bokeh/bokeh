#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/zh_TW"));
  // zh_TW abbreviated days of week
  equal(tz("2006-01-01", "%a", "zh_TW"), "日", "Sun");
  equal(tz("2006-01-02", "%a", "zh_TW"), "一", "Mon");
  equal(tz("2006-01-03", "%a", "zh_TW"), "二", "Tue");
  equal(tz("2006-01-04", "%a", "zh_TW"), "三", "Wed");
  equal(tz("2006-01-05", "%a", "zh_TW"), "四", "Thu");
  equal(tz("2006-01-06", "%a", "zh_TW"), "五", "Fri");
  equal(tz("2006-01-07", "%a", "zh_TW"), "六", "Sat");

  // zh_TW days of week
  equal(tz("2006-01-01", "%A", "zh_TW"), "週日", "Sunday");
  equal(tz("2006-01-02", "%A", "zh_TW"), "週一", "Monday");
  equal(tz("2006-01-03", "%A", "zh_TW"), "週二", "Tuesday");
  equal(tz("2006-01-04", "%A", "zh_TW"), "週三", "Wednesday");
  equal(tz("2006-01-05", "%A", "zh_TW"), "週四", "Thursday");
  equal(tz("2006-01-06", "%A", "zh_TW"), "週五", "Friday");
  equal(tz("2006-01-07", "%A", "zh_TW"), "週六", "Saturday");
});
