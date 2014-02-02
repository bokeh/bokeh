#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/bn_IN"));
  // bn_IN abbreviated days of week
  equal(tz("2006-01-01", "%a", "bn_IN"), "রবি", "Sun");
  equal(tz("2006-01-02", "%a", "bn_IN"), "সোম", "Mon");
  equal(tz("2006-01-03", "%a", "bn_IN"), "মঙ্গল", "Tue");
  equal(tz("2006-01-04", "%a", "bn_IN"), "বুধ", "Wed");
  equal(tz("2006-01-05", "%a", "bn_IN"), "বৃহস্পতি", "Thu");
  equal(tz("2006-01-06", "%a", "bn_IN"), "শুক্র", "Fri");
  equal(tz("2006-01-07", "%a", "bn_IN"), "শনি", "Sat");

  // bn_IN days of week
  equal(tz("2006-01-01", "%A", "bn_IN"), "রবিবার", "Sunday");
  equal(tz("2006-01-02", "%A", "bn_IN"), "সোমবার", "Monday");
  equal(tz("2006-01-03", "%A", "bn_IN"), "মঙ্গলবার", "Tuesday");
  equal(tz("2006-01-04", "%A", "bn_IN"), "বুধবার", "Wednesday");
  equal(tz("2006-01-05", "%A", "bn_IN"), "বৃহস্পতিবার", "Thursday");
  equal(tz("2006-01-06", "%A", "bn_IN"), "শুক্রবার", "Friday");
  equal(tz("2006-01-07", "%A", "bn_IN"), "শনিবার", "Saturday");
});
