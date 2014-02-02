#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/zh_HK"));
  // zh_HK abbreviated days of week
  equal(tz("2006-01-01", "%a", "zh_HK"), "日", "Sun");
  equal(tz("2006-01-02", "%a", "zh_HK"), "一", "Mon");
  equal(tz("2006-01-03", "%a", "zh_HK"), "二", "Tue");
  equal(tz("2006-01-04", "%a", "zh_HK"), "三", "Wed");
  equal(tz("2006-01-05", "%a", "zh_HK"), "四", "Thu");
  equal(tz("2006-01-06", "%a", "zh_HK"), "五", "Fri");
  equal(tz("2006-01-07", "%a", "zh_HK"), "六", "Sat");

  // zh_HK days of week
  equal(tz("2006-01-01", "%A", "zh_HK"), "星期日", "Sunday");
  equal(tz("2006-01-02", "%A", "zh_HK"), "星期一", "Monday");
  equal(tz("2006-01-03", "%A", "zh_HK"), "星期二", "Tuesday");
  equal(tz("2006-01-04", "%A", "zh_HK"), "星期三", "Wednesday");
  equal(tz("2006-01-05", "%A", "zh_HK"), "星期四", "Thursday");
  equal(tz("2006-01-06", "%A", "zh_HK"), "星期五", "Friday");
  equal(tz("2006-01-07", "%A", "zh_HK"), "星期六", "Saturday");
});
