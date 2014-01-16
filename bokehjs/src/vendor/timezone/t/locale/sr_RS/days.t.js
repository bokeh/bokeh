#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/sr_RS"));
  // sr_RS abbreviated days of week
  equal(tz("2006-01-01", "%a", "sr_RS"), "нед", "Sun");
  equal(tz("2006-01-02", "%a", "sr_RS"), "пон", "Mon");
  equal(tz("2006-01-03", "%a", "sr_RS"), "уто", "Tue");
  equal(tz("2006-01-04", "%a", "sr_RS"), "сре", "Wed");
  equal(tz("2006-01-05", "%a", "sr_RS"), "чет", "Thu");
  equal(tz("2006-01-06", "%a", "sr_RS"), "пет", "Fri");
  equal(tz("2006-01-07", "%a", "sr_RS"), "суб", "Sat");

  // sr_RS days of week
  equal(tz("2006-01-01", "%A", "sr_RS"), "недеља", "Sunday");
  equal(tz("2006-01-02", "%A", "sr_RS"), "понедељак", "Monday");
  equal(tz("2006-01-03", "%A", "sr_RS"), "уторак", "Tuesday");
  equal(tz("2006-01-04", "%A", "sr_RS"), "среда", "Wednesday");
  equal(tz("2006-01-05", "%A", "sr_RS"), "четвртак", "Thursday");
  equal(tz("2006-01-06", "%A", "sr_RS"), "петак", "Friday");
  equal(tz("2006-01-07", "%A", "sr_RS"), "субота", "Saturday");
});
