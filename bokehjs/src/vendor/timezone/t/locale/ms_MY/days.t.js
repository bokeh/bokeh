#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ms_MY"));
  // ms_MY abbreviated days of week
  equal(tz("2006-01-01", "%a", "ms_MY"), "Ahd", "Sun");
  equal(tz("2006-01-02", "%a", "ms_MY"), "Isn", "Mon");
  equal(tz("2006-01-03", "%a", "ms_MY"), "Sel", "Tue");
  equal(tz("2006-01-04", "%a", "ms_MY"), "Rab", "Wed");
  equal(tz("2006-01-05", "%a", "ms_MY"), "Kha", "Thu");
  equal(tz("2006-01-06", "%a", "ms_MY"), "Jum", "Fri");
  equal(tz("2006-01-07", "%a", "ms_MY"), "Sab", "Sat");

  // ms_MY days of week
  equal(tz("2006-01-01", "%A", "ms_MY"), "Ahad", "Sunday");
  equal(tz("2006-01-02", "%A", "ms_MY"), "Isnin", "Monday");
  equal(tz("2006-01-03", "%A", "ms_MY"), "Selasa", "Tuesday");
  equal(tz("2006-01-04", "%A", "ms_MY"), "Rabu", "Wednesday");
  equal(tz("2006-01-05", "%A", "ms_MY"), "Khamis", "Thursday");
  equal(tz("2006-01-06", "%A", "ms_MY"), "Jumaat", "Friday");
  equal(tz("2006-01-07", "%A", "ms_MY"), "Sabtu", "Saturday");
});
