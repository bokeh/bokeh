#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/nl_NL"));
  // nl_NL abbreviated days of week
  equal(tz("2006-01-01", "%a", "nl_NL"), "zo", "Sun");
  equal(tz("2006-01-02", "%a", "nl_NL"), "ma", "Mon");
  equal(tz("2006-01-03", "%a", "nl_NL"), "di", "Tue");
  equal(tz("2006-01-04", "%a", "nl_NL"), "wo", "Wed");
  equal(tz("2006-01-05", "%a", "nl_NL"), "do", "Thu");
  equal(tz("2006-01-06", "%a", "nl_NL"), "vr", "Fri");
  equal(tz("2006-01-07", "%a", "nl_NL"), "za", "Sat");

  // nl_NL days of week
  equal(tz("2006-01-01", "%A", "nl_NL"), "zondag", "Sunday");
  equal(tz("2006-01-02", "%A", "nl_NL"), "maandag", "Monday");
  equal(tz("2006-01-03", "%A", "nl_NL"), "dinsdag", "Tuesday");
  equal(tz("2006-01-04", "%A", "nl_NL"), "woensdag", "Wednesday");
  equal(tz("2006-01-05", "%A", "nl_NL"), "donderdag", "Thursday");
  equal(tz("2006-01-06", "%A", "nl_NL"), "vrijdag", "Friday");
  equal(tz("2006-01-07", "%A", "nl_NL"), "zaterdag", "Saturday");
});
