#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ja_JP"));
  //ja_JP abbreviated months
  equal(tz("2000-01-01", "%b", "ja_JP"), " 1月", "Jan");
  equal(tz("2000-02-01", "%b", "ja_JP"), " 2月", "Feb");
  equal(tz("2000-03-01", "%b", "ja_JP"), " 3月", "Mar");
  equal(tz("2000-04-01", "%b", "ja_JP"), " 4月", "Apr");
  equal(tz("2000-05-01", "%b", "ja_JP"), " 5月", "May");
  equal(tz("2000-06-01", "%b", "ja_JP"), " 6月", "Jun");
  equal(tz("2000-07-01", "%b", "ja_JP"), " 7月", "Jul");
  equal(tz("2000-08-01", "%b", "ja_JP"), " 8月", "Aug");
  equal(tz("2000-09-01", "%b", "ja_JP"), " 9月", "Sep");
  equal(tz("2000-10-01", "%b", "ja_JP"), "10月", "Oct");
  equal(tz("2000-11-01", "%b", "ja_JP"), "11月", "Nov");
  equal(tz("2000-12-01", "%b", "ja_JP"), "12月", "Dec");

  // ja_JP months
  equal(tz("2000-01-01", "%B", "ja_JP"), "1月", "January");
  equal(tz("2000-02-01", "%B", "ja_JP"), "2月", "February");
  equal(tz("2000-03-01", "%B", "ja_JP"), "3月", "March");
  equal(tz("2000-04-01", "%B", "ja_JP"), "4月", "April");
  equal(tz("2000-05-01", "%B", "ja_JP"), "5月", "May");
  equal(tz("2000-06-01", "%B", "ja_JP"), "6月", "June");
  equal(tz("2000-07-01", "%B", "ja_JP"), "7月", "July");
  equal(tz("2000-08-01", "%B", "ja_JP"), "8月", "August");
  equal(tz("2000-09-01", "%B", "ja_JP"), "9月", "September");
  equal(tz("2000-10-01", "%B", "ja_JP"), "10月", "October");
  equal(tz("2000-11-01", "%B", "ja_JP"), "11月", "November");
  equal(tz("2000-12-01", "%B", "ja_JP"), "12月", "December");
});
