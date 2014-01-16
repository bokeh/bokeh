#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/uk_UA"));
  // uk_UA abbreviated days of week
  equal(tz("2006-01-01", "%a", "uk_UA"), "нд", "Sun");
  equal(tz("2006-01-02", "%a", "uk_UA"), "пн", "Mon");
  equal(tz("2006-01-03", "%a", "uk_UA"), "вт", "Tue");
  equal(tz("2006-01-04", "%a", "uk_UA"), "ср", "Wed");
  equal(tz("2006-01-05", "%a", "uk_UA"), "чт", "Thu");
  equal(tz("2006-01-06", "%a", "uk_UA"), "пт", "Fri");
  equal(tz("2006-01-07", "%a", "uk_UA"), "сб", "Sat");

  // uk_UA days of week
  equal(tz("2006-01-01", "%A", "uk_UA"), "неділя", "Sunday");
  equal(tz("2006-01-02", "%A", "uk_UA"), "понеділок", "Monday");
  equal(tz("2006-01-03", "%A", "uk_UA"), "вівторок", "Tuesday");
  equal(tz("2006-01-04", "%A", "uk_UA"), "середа", "Wednesday");
  equal(tz("2006-01-05", "%A", "uk_UA"), "четвер", "Thursday");
  equal(tz("2006-01-06", "%A", "uk_UA"), "п'ятниця", "Friday");
  equal(tz("2006-01-07", "%A", "uk_UA"), "субота", "Saturday");
});
