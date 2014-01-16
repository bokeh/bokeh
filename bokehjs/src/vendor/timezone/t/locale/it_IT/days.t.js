#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/it_IT"));
  // it_IT abbreviated days of week
  equal(tz("2006-01-01", "%a", "it_IT"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "it_IT"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "it_IT"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "it_IT"), "mer", "Wed");
  equal(tz("2006-01-05", "%a", "it_IT"), "gio", "Thu");
  equal(tz("2006-01-06", "%a", "it_IT"), "ven", "Fri");
  equal(tz("2006-01-07", "%a", "it_IT"), "sab", "Sat");

  // it_IT days of week
  equal(tz("2006-01-01", "%A", "it_IT"), "domenica", "Sunday");
  equal(tz("2006-01-02", "%A", "it_IT"), "lunedì", "Monday");
  equal(tz("2006-01-03", "%A", "it_IT"), "martedì", "Tuesday");
  equal(tz("2006-01-04", "%A", "it_IT"), "mercoledì", "Wednesday");
  equal(tz("2006-01-05", "%A", "it_IT"), "giovedì", "Thursday");
  equal(tz("2006-01-06", "%A", "it_IT"), "venerdì", "Friday");
  equal(tz("2006-01-07", "%A", "it_IT"), "sabato", "Saturday");
});
