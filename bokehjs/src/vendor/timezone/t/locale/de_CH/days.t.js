#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/de_CH"));
  // de_CH abbreviated days of week
  equal(tz("2006-01-01", "%a", "de_CH"), "Son", "Sun");
  equal(tz("2006-01-02", "%a", "de_CH"), "Mon", "Mon");
  equal(tz("2006-01-03", "%a", "de_CH"), "Die", "Tue");
  equal(tz("2006-01-04", "%a", "de_CH"), "Mit", "Wed");
  equal(tz("2006-01-05", "%a", "de_CH"), "Don", "Thu");
  equal(tz("2006-01-06", "%a", "de_CH"), "Fre", "Fri");
  equal(tz("2006-01-07", "%a", "de_CH"), "Sam", "Sat");

  // de_CH days of week
  equal(tz("2006-01-01", "%A", "de_CH"), "Sonntag", "Sunday");
  equal(tz("2006-01-02", "%A", "de_CH"), "Montag", "Monday");
  equal(tz("2006-01-03", "%A", "de_CH"), "Dienstag", "Tuesday");
  equal(tz("2006-01-04", "%A", "de_CH"), "Mittwoch", "Wednesday");
  equal(tz("2006-01-05", "%A", "de_CH"), "Donnerstag", "Thursday");
  equal(tz("2006-01-06", "%A", "de_CH"), "Freitag", "Friday");
  equal(tz("2006-01-07", "%A", "de_CH"), "Samstag", "Saturday");
});
