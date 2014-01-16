#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/bg_BG"));
  // bg_BG abbreviated days of week
  equal(tz("2006-01-01", "%a", "bg_BG"), "нд", "Sun");
  equal(tz("2006-01-02", "%a", "bg_BG"), "пн", "Mon");
  equal(tz("2006-01-03", "%a", "bg_BG"), "вт", "Tue");
  equal(tz("2006-01-04", "%a", "bg_BG"), "ср", "Wed");
  equal(tz("2006-01-05", "%a", "bg_BG"), "чт", "Thu");
  equal(tz("2006-01-06", "%a", "bg_BG"), "пт", "Fri");
  equal(tz("2006-01-07", "%a", "bg_BG"), "сб", "Sat");

  // bg_BG days of week
  equal(tz("2006-01-01", "%A", "bg_BG"), "неделя", "Sunday");
  equal(tz("2006-01-02", "%A", "bg_BG"), "понеделник", "Monday");
  equal(tz("2006-01-03", "%A", "bg_BG"), "вторник", "Tuesday");
  equal(tz("2006-01-04", "%A", "bg_BG"), "сряда", "Wednesday");
  equal(tz("2006-01-05", "%A", "bg_BG"), "четвъртък", "Thursday");
  equal(tz("2006-01-06", "%A", "bg_BG"), "петък", "Friday");
  equal(tz("2006-01-07", "%A", "bg_BG"), "събота", "Saturday");
});
