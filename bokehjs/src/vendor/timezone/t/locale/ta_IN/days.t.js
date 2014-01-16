#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ta_IN"));
  // ta_IN abbreviated days of week
  equal(tz("2006-01-01", "%a", "ta_IN"), "ஞா", "Sun");
  equal(tz("2006-01-02", "%a", "ta_IN"), "தி", "Mon");
  equal(tz("2006-01-03", "%a", "ta_IN"), "செ", "Tue");
  equal(tz("2006-01-04", "%a", "ta_IN"), "பு", "Wed");
  equal(tz("2006-01-05", "%a", "ta_IN"), "வி", "Thu");
  equal(tz("2006-01-06", "%a", "ta_IN"), "வெ", "Fri");
  equal(tz("2006-01-07", "%a", "ta_IN"), "ச", "Sat");

  // ta_IN days of week
  equal(tz("2006-01-01", "%A", "ta_IN"), "ஞாயிறு", "Sunday");
  equal(tz("2006-01-02", "%A", "ta_IN"), "திங்கள்", "Monday");
  equal(tz("2006-01-03", "%A", "ta_IN"), "செவ்வாய்", "Tuesday");
  equal(tz("2006-01-04", "%A", "ta_IN"), "புதன்", "Wednesday");
  equal(tz("2006-01-05", "%A", "ta_IN"), "வியாழன்", "Thursday");
  equal(tz("2006-01-06", "%A", "ta_IN"), "வெள்ளி", "Friday");
  equal(tz("2006-01-07", "%A", "ta_IN"), "சனி", "Saturday");
});
