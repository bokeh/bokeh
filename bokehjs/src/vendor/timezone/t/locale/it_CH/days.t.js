#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/it_CH"));
  // it_CH abbreviated days of week
  equal(tz("2006-01-01", "%a", "it_CH"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "it_CH"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "it_CH"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "it_CH"), "mer", "Wed");
  equal(tz("2006-01-05", "%a", "it_CH"), "gio", "Thu");
  equal(tz("2006-01-06", "%a", "it_CH"), "ven", "Fri");
  equal(tz("2006-01-07", "%a", "it_CH"), "sab", "Sat");

  // it_CH days of week
  equal(tz("2006-01-01", "%A", "it_CH"), "domenica", "Sunday");
  equal(tz("2006-01-02", "%A", "it_CH"), "lunedì", "Monday");
  equal(tz("2006-01-03", "%A", "it_CH"), "martedì", "Tuesday");
  equal(tz("2006-01-04", "%A", "it_CH"), "mercoledì", "Wednesday");
  equal(tz("2006-01-05", "%A", "it_CH"), "giovedì", "Thursday");
  equal(tz("2006-01-06", "%A", "it_CH"), "venerdì", "Friday");
  equal(tz("2006-01-07", "%A", "it_CH"), "sabato", "Saturday");
});
