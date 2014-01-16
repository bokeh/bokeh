#!/usr/bin/env node
require("../proof")(4, function (equal, tz, moonwalk, utc) {
  equal(tz(moonwalk, "+2 years"), utc(1971, 6, 21, 2, 56), "add years");
  equal(tz(moonwalk, "-2 years"), utc(1967, 6, 21, 2, 56), "subtract years across leap year");
  equal(tz(utc(1980, 1, 29, 12), "+1 year"), utc(1981, 2, 1, 12), "add years from leap day");
  equal(tz(utc(1980, 1, 29, 12), "-1 year"), utc(1979, 2, 1, 12), "subtract years from leap day");
});
