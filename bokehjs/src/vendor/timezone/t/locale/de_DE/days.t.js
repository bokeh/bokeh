#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/de_DE"));
  // de_DE abbreviated days of week
  equal(tz("2006-01-01", "%a", "de_DE"), "So", "Sun");
  equal(tz("2006-01-02", "%a", "de_DE"), "Mo", "Mon");
  equal(tz("2006-01-03", "%a", "de_DE"), "Di", "Tue");
  equal(tz("2006-01-04", "%a", "de_DE"), "Mi", "Wed");
  equal(tz("2006-01-05", "%a", "de_DE"), "Do", "Thu");
  equal(tz("2006-01-06", "%a", "de_DE"), "Fr", "Fri");
  equal(tz("2006-01-07", "%a", "de_DE"), "Sa", "Sat");

  // de_DE days of week
  equal(tz("2006-01-01", "%A", "de_DE"), "Sonntag", "Sunday");
  equal(tz("2006-01-02", "%A", "de_DE"), "Montag", "Monday");
  equal(tz("2006-01-03", "%A", "de_DE"), "Dienstag", "Tuesday");
  equal(tz("2006-01-04", "%A", "de_DE"), "Mittwoch", "Wednesday");
  equal(tz("2006-01-05", "%A", "de_DE"), "Donnerstag", "Thursday");
  equal(tz("2006-01-06", "%A", "de_DE"), "Freitag", "Friday");
  equal(tz("2006-01-07", "%A", "de_DE"), "Samstag", "Saturday");
});
