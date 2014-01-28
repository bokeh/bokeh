#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/he_IL"));
  // he_IL abbreviated days of week
  equal(tz("2006-01-01", "%a", "he_IL"), "א'", "Sun");
  equal(tz("2006-01-02", "%a", "he_IL"), "ב'", "Mon");
  equal(tz("2006-01-03", "%a", "he_IL"), "ג'", "Tue");
  equal(tz("2006-01-04", "%a", "he_IL"), "ד'", "Wed");
  equal(tz("2006-01-05", "%a", "he_IL"), "ה'", "Thu");
  equal(tz("2006-01-06", "%a", "he_IL"), "ו'", "Fri");
  equal(tz("2006-01-07", "%a", "he_IL"), "ש'", "Sat");

  // he_IL days of week
  equal(tz("2006-01-01", "%A", "he_IL"), "ראשון", "Sunday");
  equal(tz("2006-01-02", "%A", "he_IL"), "שני", "Monday");
  equal(tz("2006-01-03", "%A", "he_IL"), "שלישי", "Tuesday");
  equal(tz("2006-01-04", "%A", "he_IL"), "רביעי", "Wednesday");
  equal(tz("2006-01-05", "%A", "he_IL"), "חמישי", "Thursday");
  equal(tz("2006-01-06", "%A", "he_IL"), "שישי", "Friday");
  equal(tz("2006-01-07", "%A", "he_IL"), "שבת", "Saturday");
});
