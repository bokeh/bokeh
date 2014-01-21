#!/usr/bin/env node
require("../proof")(4, function (equal, tz, y2k, bicentennial, moonwalk) {
  equal(tz(bicentennial, "%x"), "07/04/1976", "locale date format");
  equal(tz(moonwalk, "%X"), "02:56:00 AM", "locale time format");
  equal(tz(moonwalk, "%c"), "Mon 21 Jul 1969 02:56:00 AM UTC", "locale time and date, padding apparent");
  equal(tz(y2k, "%c"), "Sat 01 Jan 2000 12:00:00 AM UTC", "locale time and date");
});
