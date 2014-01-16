#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/de_AT"));
  // de_AT abbreviated days of week
  equal(tz("2006-01-01", "%a", "de_AT"), "Son", "Sun");
  equal(tz("2006-01-02", "%a", "de_AT"), "Mon", "Mon");
  equal(tz("2006-01-03", "%a", "de_AT"), "Die", "Tue");
  equal(tz("2006-01-04", "%a", "de_AT"), "Mit", "Wed");
  equal(tz("2006-01-05", "%a", "de_AT"), "Don", "Thu");
  equal(tz("2006-01-06", "%a", "de_AT"), "Fre", "Fri");
  equal(tz("2006-01-07", "%a", "de_AT"), "Sam", "Sat");

  // de_AT days of week
  equal(tz("2006-01-01", "%A", "de_AT"), "Sonntag", "Sunday");
  equal(tz("2006-01-02", "%A", "de_AT"), "Montag", "Monday");
  equal(tz("2006-01-03", "%A", "de_AT"), "Dienstag", "Tuesday");
  equal(tz("2006-01-04", "%A", "de_AT"), "Mittwoch", "Wednesday");
  equal(tz("2006-01-05", "%A", "de_AT"), "Donnerstag", "Thursday");
  equal(tz("2006-01-06", "%A", "de_AT"), "Freitag", "Friday");
  equal(tz("2006-01-07", "%A", "de_AT"), "Samstag", "Saturday");
});
