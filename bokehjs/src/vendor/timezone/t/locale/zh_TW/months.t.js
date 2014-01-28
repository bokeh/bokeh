#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/zh_TW"));
  //zh_TW abbreviated months
  equal(tz("2000-01-01", "%b", "zh_TW"), " 1月", "Jan");
  equal(tz("2000-02-01", "%b", "zh_TW"), " 2月", "Feb");
  equal(tz("2000-03-01", "%b", "zh_TW"), " 3月", "Mar");
  equal(tz("2000-04-01", "%b", "zh_TW"), " 4月", "Apr");
  equal(tz("2000-05-01", "%b", "zh_TW"), " 5月", "May");
  equal(tz("2000-06-01", "%b", "zh_TW"), " 6月", "Jun");
  equal(tz("2000-07-01", "%b", "zh_TW"), " 7月", "Jul");
  equal(tz("2000-08-01", "%b", "zh_TW"), " 8月", "Aug");
  equal(tz("2000-09-01", "%b", "zh_TW"), " 9月", "Sep");
  equal(tz("2000-10-01", "%b", "zh_TW"), "10月", "Oct");
  equal(tz("2000-11-01", "%b", "zh_TW"), "11月", "Nov");
  equal(tz("2000-12-01", "%b", "zh_TW"), "12月", "Dec");

  // zh_TW months
  equal(tz("2000-01-01", "%B", "zh_TW"), "一月", "January");
  equal(tz("2000-02-01", "%B", "zh_TW"), "二月", "February");
  equal(tz("2000-03-01", "%B", "zh_TW"), "三月", "March");
  equal(tz("2000-04-01", "%B", "zh_TW"), "四月", "April");
  equal(tz("2000-05-01", "%B", "zh_TW"), "五月", "May");
  equal(tz("2000-06-01", "%B", "zh_TW"), "六月", "June");
  equal(tz("2000-07-01", "%B", "zh_TW"), "七月", "July");
  equal(tz("2000-08-01", "%B", "zh_TW"), "八月", "August");
  equal(tz("2000-09-01", "%B", "zh_TW"), "九月", "September");
  equal(tz("2000-10-01", "%B", "zh_TW"), "十月", "October");
  equal(tz("2000-11-01", "%B", "zh_TW"), "十一月", "November");
  equal(tz("2000-12-01", "%B", "zh_TW"), "十二月", "December");
});
