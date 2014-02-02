#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/nl_BE"));
  // nl_BE abbreviated days of week
  equal(tz("2006-01-01", "%a", "nl_BE"), "zo", "Sun");
  equal(tz("2006-01-02", "%a", "nl_BE"), "ma", "Mon");
  equal(tz("2006-01-03", "%a", "nl_BE"), "di", "Tue");
  equal(tz("2006-01-04", "%a", "nl_BE"), "wo", "Wed");
  equal(tz("2006-01-05", "%a", "nl_BE"), "do", "Thu");
  equal(tz("2006-01-06", "%a", "nl_BE"), "vr", "Fri");
  equal(tz("2006-01-07", "%a", "nl_BE"), "za", "Sat");

  // nl_BE days of week
  equal(tz("2006-01-01", "%A", "nl_BE"), "zondag", "Sunday");
  equal(tz("2006-01-02", "%A", "nl_BE"), "maandag", "Monday");
  equal(tz("2006-01-03", "%A", "nl_BE"), "dinsdag", "Tuesday");
  equal(tz("2006-01-04", "%A", "nl_BE"), "woensdag", "Wednesday");
  equal(tz("2006-01-05", "%A", "nl_BE"), "donderdag", "Thursday");
  equal(tz("2006-01-06", "%A", "nl_BE"), "vrijdag", "Friday");
  equal(tz("2006-01-07", "%A", "nl_BE"), "zaterdag", "Saturday");
});
