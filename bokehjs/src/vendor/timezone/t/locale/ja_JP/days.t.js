#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ja_JP"));
  // ja_JP abbreviated days of week
  equal(tz("2006-01-01", "%a", "ja_JP"), "日", "Sun");
  equal(tz("2006-01-02", "%a", "ja_JP"), "月", "Mon");
  equal(tz("2006-01-03", "%a", "ja_JP"), "火", "Tue");
  equal(tz("2006-01-04", "%a", "ja_JP"), "水", "Wed");
  equal(tz("2006-01-05", "%a", "ja_JP"), "木", "Thu");
  equal(tz("2006-01-06", "%a", "ja_JP"), "金", "Fri");
  equal(tz("2006-01-07", "%a", "ja_JP"), "土", "Sat");

  // ja_JP days of week
  equal(tz("2006-01-01", "%A", "ja_JP"), "日曜日", "Sunday");
  equal(tz("2006-01-02", "%A", "ja_JP"), "月曜日", "Monday");
  equal(tz("2006-01-03", "%A", "ja_JP"), "火曜日", "Tuesday");
  equal(tz("2006-01-04", "%A", "ja_JP"), "水曜日", "Wednesday");
  equal(tz("2006-01-05", "%A", "ja_JP"), "木曜日", "Thursday");
  equal(tz("2006-01-06", "%A", "ja_JP"), "金曜日", "Friday");
  equal(tz("2006-01-07", "%A", "ja_JP"), "土曜日", "Saturday");
});
