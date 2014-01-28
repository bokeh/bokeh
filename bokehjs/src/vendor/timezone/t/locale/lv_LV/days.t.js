#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/lv_LV"));
  // lv_LV abbreviated days of week
  equal(tz("2006-01-01", "%a", "lv_LV"), "Sv", "Sun");
  equal(tz("2006-01-02", "%a", "lv_LV"), "P ", "Mon");
  equal(tz("2006-01-03", "%a", "lv_LV"), "O ", "Tue");
  equal(tz("2006-01-04", "%a", "lv_LV"), "T ", "Wed");
  equal(tz("2006-01-05", "%a", "lv_LV"), "C ", "Thu");
  equal(tz("2006-01-06", "%a", "lv_LV"), "Pk", "Fri");
  equal(tz("2006-01-07", "%a", "lv_LV"), "S ", "Sat");

  // lv_LV days of week
  equal(tz("2006-01-01", "%A", "lv_LV"), "svētdiena", "Sunday");
  equal(tz("2006-01-02", "%A", "lv_LV"), "pirmdiena", "Monday");
  equal(tz("2006-01-03", "%A", "lv_LV"), "otrdiena", "Tuesday");
  equal(tz("2006-01-04", "%A", "lv_LV"), "trešdiena", "Wednesday");
  equal(tz("2006-01-05", "%A", "lv_LV"), "ceturtdiena", "Thursday");
  equal(tz("2006-01-06", "%A", "lv_LV"), "piektdiena", "Friday");
  equal(tz("2006-01-07", "%A", "lv_LV"), "sestdiena", "Saturday");
});
