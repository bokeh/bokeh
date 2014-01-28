#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ko_KR"));
  // ko_KR abbreviated days of week
  equal(tz("2006-01-01", "%a", "ko_KR"), "일", "Sun");
  equal(tz("2006-01-02", "%a", "ko_KR"), "월", "Mon");
  equal(tz("2006-01-03", "%a", "ko_KR"), "화", "Tue");
  equal(tz("2006-01-04", "%a", "ko_KR"), "수", "Wed");
  equal(tz("2006-01-05", "%a", "ko_KR"), "목", "Thu");
  equal(tz("2006-01-06", "%a", "ko_KR"), "금", "Fri");
  equal(tz("2006-01-07", "%a", "ko_KR"), "토", "Sat");

  // ko_KR days of week
  equal(tz("2006-01-01", "%A", "ko_KR"), "일요일", "Sunday");
  equal(tz("2006-01-02", "%A", "ko_KR"), "월요일", "Monday");
  equal(tz("2006-01-03", "%A", "ko_KR"), "화요일", "Tuesday");
  equal(tz("2006-01-04", "%A", "ko_KR"), "수요일", "Wednesday");
  equal(tz("2006-01-05", "%A", "ko_KR"), "목요일", "Thursday");
  equal(tz("2006-01-06", "%A", "ko_KR"), "금요일", "Friday");
  equal(tz("2006-01-07", "%A", "ko_KR"), "토요일", "Saturday");
});
