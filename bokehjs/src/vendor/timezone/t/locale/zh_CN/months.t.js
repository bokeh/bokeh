#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/zh_CN"));
  //zh_CN abbreviated months
  equal(tz("2000-01-01", "%b", "zh_CN"), " 1月", "Jan");
  equal(tz("2000-02-01", "%b", "zh_CN"), " 2月", "Feb");
  equal(tz("2000-03-01", "%b", "zh_CN"), " 3月", "Mar");
  equal(tz("2000-04-01", "%b", "zh_CN"), " 4月", "Apr");
  equal(tz("2000-05-01", "%b", "zh_CN"), " 5月", "May");
  equal(tz("2000-06-01", "%b", "zh_CN"), " 6月", "Jun");
  equal(tz("2000-07-01", "%b", "zh_CN"), " 7月", "Jul");
  equal(tz("2000-08-01", "%b", "zh_CN"), " 8月", "Aug");
  equal(tz("2000-09-01", "%b", "zh_CN"), " 9月", "Sep");
  equal(tz("2000-10-01", "%b", "zh_CN"), "10月", "Oct");
  equal(tz("2000-11-01", "%b", "zh_CN"), "11月", "Nov");
  equal(tz("2000-12-01", "%b", "zh_CN"), "12月", "Dec");

  // zh_CN months
  equal(tz("2000-01-01", "%B", "zh_CN"), "一月", "January");
  equal(tz("2000-02-01", "%B", "zh_CN"), "二月", "February");
  equal(tz("2000-03-01", "%B", "zh_CN"), "三月", "March");
  equal(tz("2000-04-01", "%B", "zh_CN"), "四月", "April");
  equal(tz("2000-05-01", "%B", "zh_CN"), "五月", "May");
  equal(tz("2000-06-01", "%B", "zh_CN"), "六月", "June");
  equal(tz("2000-07-01", "%B", "zh_CN"), "七月", "July");
  equal(tz("2000-08-01", "%B", "zh_CN"), "八月", "August");
  equal(tz("2000-09-01", "%B", "zh_CN"), "九月", "September");
  equal(tz("2000-10-01", "%B", "zh_CN"), "十月", "October");
  equal(tz("2000-11-01", "%B", "zh_CN"), "十一月", "November");
  equal(tz("2000-12-01", "%B", "zh_CN"), "十二月", "December");
});
