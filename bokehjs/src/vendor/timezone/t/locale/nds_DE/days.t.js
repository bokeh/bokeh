#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/nds_DE"));
  // nds_DE abbreviated days of week
  equal(tz("2006-01-01", "%a", "nds_DE"), "Sdag", "Sun");
  equal(tz("2006-01-02", "%a", "nds_DE"), "Maan", "Mon");
  equal(tz("2006-01-03", "%a", "nds_DE"), "Ding", "Tue");
  equal(tz("2006-01-04", "%a", "nds_DE"), "Migg", "Wed");
  equal(tz("2006-01-05", "%a", "nds_DE"), "Dunn", "Thu");
  equal(tz("2006-01-06", "%a", "nds_DE"), "Free", "Fri");
  equal(tz("2006-01-07", "%a", "nds_DE"), "Svd.", "Sat");

  // nds_DE days of week
  equal(tz("2006-01-01", "%A", "nds_DE"), "Sünndag", "Sunday");
  equal(tz("2006-01-02", "%A", "nds_DE"), "Maandag", "Monday");
  equal(tz("2006-01-03", "%A", "nds_DE"), "Dingsdag", "Tuesday");
  equal(tz("2006-01-04", "%A", "nds_DE"), "Middeweek", "Wednesday");
  equal(tz("2006-01-05", "%A", "nds_DE"), "Dunnersdag", "Thursday");
  equal(tz("2006-01-06", "%A", "nds_DE"), "Freedag", "Friday");
  equal(tz("2006-01-07", "%A", "nds_DE"), "Sünnavend", "Saturday");
});
