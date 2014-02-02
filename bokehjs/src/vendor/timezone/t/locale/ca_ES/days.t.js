#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ca_ES"));
  // ca_ES abbreviated days of week
  equal(tz("2006-01-01", "%a", "ca_ES"), "dg", "Sun");
  equal(tz("2006-01-02", "%a", "ca_ES"), "dl", "Mon");
  equal(tz("2006-01-03", "%a", "ca_ES"), "dt", "Tue");
  equal(tz("2006-01-04", "%a", "ca_ES"), "dc", "Wed");
  equal(tz("2006-01-05", "%a", "ca_ES"), "dj", "Thu");
  equal(tz("2006-01-06", "%a", "ca_ES"), "dv", "Fri");
  equal(tz("2006-01-07", "%a", "ca_ES"), "ds", "Sat");

  // ca_ES days of week
  equal(tz("2006-01-01", "%A", "ca_ES"), "diumenge", "Sunday");
  equal(tz("2006-01-02", "%A", "ca_ES"), "dilluns", "Monday");
  equal(tz("2006-01-03", "%A", "ca_ES"), "dimarts", "Tuesday");
  equal(tz("2006-01-04", "%A", "ca_ES"), "dimecres", "Wednesday");
  equal(tz("2006-01-05", "%A", "ca_ES"), "dijous", "Thursday");
  equal(tz("2006-01-06", "%A", "ca_ES"), "divendres", "Friday");
  equal(tz("2006-01-07", "%A", "ca_ES"), "dissabte", "Saturday");
});
