#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/bn_BD"));
  // bn_BD abbreviated days of week
  equal(tz("2006-01-01", "%a", "bn_BD"), "রবি", "Sun");
  equal(tz("2006-01-02", "%a", "bn_BD"), "সোম", "Mon");
  equal(tz("2006-01-03", "%a", "bn_BD"), "মঙ্গল", "Tue");
  equal(tz("2006-01-04", "%a", "bn_BD"), "বুধ", "Wed");
  equal(tz("2006-01-05", "%a", "bn_BD"), "বৃহঃ", "Thu");
  equal(tz("2006-01-06", "%a", "bn_BD"), "শুক্র", "Fri");
  equal(tz("2006-01-07", "%a", "bn_BD"), "শনি", "Sat");

  // bn_BD days of week
  equal(tz("2006-01-01", "%A", "bn_BD"), "রবিবার", "Sunday");
  equal(tz("2006-01-02", "%A", "bn_BD"), "সোমবার", "Monday");
  equal(tz("2006-01-03", "%A", "bn_BD"), "মঙ্গলবার", "Tuesday");
  equal(tz("2006-01-04", "%A", "bn_BD"), "বুধবার", "Wednesday");
  equal(tz("2006-01-05", "%A", "bn_BD"), "বৃহস্পতিবার", "Thursday");
  equal(tz("2006-01-06", "%A", "bn_BD"), "শুক্রবার", "Friday");
  equal(tz("2006-01-07", "%A", "bn_BD"), "শনিবার", "Saturday");
});
