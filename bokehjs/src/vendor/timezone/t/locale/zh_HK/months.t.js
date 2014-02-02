#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/zh_HK"));
  //zh_HK abbreviated months
  equal(tz("2000-01-01", "%b", "zh_HK"), "1月", "Jan");
  equal(tz("2000-02-01", "%b", "zh_HK"), "2月", "Feb");
  equal(tz("2000-03-01", "%b", "zh_HK"), "3月", "Mar");
  equal(tz("2000-04-01", "%b", "zh_HK"), "4月", "Apr");
  equal(tz("2000-05-01", "%b", "zh_HK"), "5月", "May");
  equal(tz("2000-06-01", "%b", "zh_HK"), "6月", "Jun");
  equal(tz("2000-07-01", "%b", "zh_HK"), "7月", "Jul");
  equal(tz("2000-08-01", "%b", "zh_HK"), "8月", "Aug");
  equal(tz("2000-09-01", "%b", "zh_HK"), "9月", "Sep");
  equal(tz("2000-10-01", "%b", "zh_HK"), "10月", "Oct");
  equal(tz("2000-11-01", "%b", "zh_HK"), "11月", "Nov");
  equal(tz("2000-12-01", "%b", "zh_HK"), "12月", "Dec");

  // zh_HK months
  equal(tz("2000-01-01", "%B", "zh_HK"), "一月", "January");
  equal(tz("2000-02-01", "%B", "zh_HK"), "二月", "February");
  equal(tz("2000-03-01", "%B", "zh_HK"), "三月", "March");
  equal(tz("2000-04-01", "%B", "zh_HK"), "四月", "April");
  equal(tz("2000-05-01", "%B", "zh_HK"), "五月", "May");
  equal(tz("2000-06-01", "%B", "zh_HK"), "六月", "June");
  equal(tz("2000-07-01", "%B", "zh_HK"), "七月", "July");
  equal(tz("2000-08-01", "%B", "zh_HK"), "八月", "August");
  equal(tz("2000-09-01", "%B", "zh_HK"), "九月", "September");
  equal(tz("2000-10-01", "%B", "zh_HK"), "十月", "October");
  equal(tz("2000-11-01", "%B", "zh_HK"), "十一月", "November");
  equal(tz("2000-12-01", "%B", "zh_HK"), "十二月", "December");
});
