#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/vi_VN"));
  // vi_VN abbreviated days of week
  equal(tz("2006-01-01", "%a", "vi_VN"), "CN", "Sun");
  equal(tz("2006-01-02", "%a", "vi_VN"), "T2", "Mon");
  equal(tz("2006-01-03", "%a", "vi_VN"), "T3", "Tue");
  equal(tz("2006-01-04", "%a", "vi_VN"), "T4", "Wed");
  equal(tz("2006-01-05", "%a", "vi_VN"), "T5", "Thu");
  equal(tz("2006-01-06", "%a", "vi_VN"), "T6", "Fri");
  equal(tz("2006-01-07", "%a", "vi_VN"), "T7", "Sat");

  // vi_VN days of week
  equal(tz("2006-01-01", "%A", "vi_VN"), "Chủ nhật", "Sunday");
  equal(tz("2006-01-02", "%A", "vi_VN"), "Thứ hai", "Monday");
  equal(tz("2006-01-03", "%A", "vi_VN"), "Thứ ba", "Tuesday");
  equal(tz("2006-01-04", "%A", "vi_VN"), "Thứ tư", "Wednesday");
  equal(tz("2006-01-05", "%A", "vi_VN"), "Thứ năm", "Thursday");
  equal(tz("2006-01-06", "%A", "vi_VN"), "Thứ sáu", "Friday");
  equal(tz("2006-01-07", "%A", "vi_VN"), "Thứ bảy", "Saturday");
});
