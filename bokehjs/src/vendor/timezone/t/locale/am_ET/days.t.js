#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/am_ET"));
  // am_ET abbreviated days of week
  equal(tz("2006-01-01", "%a", "am_ET"), "እሑድ", "Sun");
  equal(tz("2006-01-02", "%a", "am_ET"), "ሰኞ ", "Mon");
  equal(tz("2006-01-03", "%a", "am_ET"), "ማክሰ", "Tue");
  equal(tz("2006-01-04", "%a", "am_ET"), "ረቡዕ", "Wed");
  equal(tz("2006-01-05", "%a", "am_ET"), "ሐሙስ", "Thu");
  equal(tz("2006-01-06", "%a", "am_ET"), "ዓርብ", "Fri");
  equal(tz("2006-01-07", "%a", "am_ET"), "ቅዳሜ", "Sat");

  // am_ET days of week
  equal(tz("2006-01-01", "%A", "am_ET"), "እሑድ", "Sunday");
  equal(tz("2006-01-02", "%A", "am_ET"), "ሰኞ", "Monday");
  equal(tz("2006-01-03", "%A", "am_ET"), "ማክሰኞ", "Tuesday");
  equal(tz("2006-01-04", "%A", "am_ET"), "ረቡዕ", "Wednesday");
  equal(tz("2006-01-05", "%A", "am_ET"), "ሐሙስ", "Thursday");
  equal(tz("2006-01-06", "%A", "am_ET"), "ዓርብ", "Friday");
  equal(tz("2006-01-07", "%A", "am_ET"), "ቅዳሜ", "Saturday");
});
