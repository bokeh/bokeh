#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/pl_PL"));
  // pl_PL abbreviated days of week
  equal(tz("2006-01-01", "%a", "pl_PL"), "nie", "Sun");
  equal(tz("2006-01-02", "%a", "pl_PL"), "pon", "Mon");
  equal(tz("2006-01-03", "%a", "pl_PL"), "wto", "Tue");
  equal(tz("2006-01-04", "%a", "pl_PL"), "śro", "Wed");
  equal(tz("2006-01-05", "%a", "pl_PL"), "czw", "Thu");
  equal(tz("2006-01-06", "%a", "pl_PL"), "pią", "Fri");
  equal(tz("2006-01-07", "%a", "pl_PL"), "sob", "Sat");

  // pl_PL days of week
  equal(tz("2006-01-01", "%A", "pl_PL"), "niedziela", "Sunday");
  equal(tz("2006-01-02", "%A", "pl_PL"), "poniedziałek", "Monday");
  equal(tz("2006-01-03", "%A", "pl_PL"), "wtorek", "Tuesday");
  equal(tz("2006-01-04", "%A", "pl_PL"), "środa", "Wednesday");
  equal(tz("2006-01-05", "%A", "pl_PL"), "czwartek", "Thursday");
  equal(tz("2006-01-06", "%A", "pl_PL"), "piątek", "Friday");
  equal(tz("2006-01-07", "%A", "pl_PL"), "sobota", "Saturday");
});
