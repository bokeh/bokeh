#!/usr/bin/env node
require("../proof")(29, function (equal, tz, y2k, moonwalk, utc) {
  // Month digits.
  equal(tz(moonwalk, "%m"), "07", "two digit july");
  equal(tz(y2k, "%m"), "01", "two digit january");

  // Abbreviated month.
  equal(tz(moonwalk, "%h"), "Jul", "abbreviation");
  equal(tz(moonwalk, "%b"), "Jul", "locale abbreviation");
  equal(tz(utc(1980, 0, 1), "%b"), "Jan", "locale abbreviation January");
  equal(tz(utc(1980, 1, 1), "%b"), "Feb", "locale abbreviation February");
  equal(tz(utc(1980, 2, 1), "%b"), "Mar", "locale abbreviation March");
  equal(tz(utc(1980, 3, 1), "%b"), "Apr", "locale abbreviation April");
  equal(tz(utc(1980, 4, 1), "%b"), "May", "locale abbreviation May");
  equal(tz(utc(1980, 5, 1), "%b"), "Jun", "locale abbreviation June");
  equal(tz(utc(1980, 6, 1), "%b"), "Jul", "locale abbreviation July");
  equal(tz(utc(1980, 7, 1), "%b"), "Aug", "locale abbreviation August");
  equal(tz(utc(1980, 8, 1), "%b"), "Sep", "locale abbreviation September");
  equal(tz(utc(1980, 9, 1), "%b"), "Oct", "locale abbreviation October");
  equal(tz(utc(1980, 10, 1), "%b"), "Nov", "locale abbreviation November");
  equal(tz(utc(1980, 11, 1), "%b"), "Dec", "locale abbreviation December");

  // Full month.
  equal(tz(moonwalk, "%B"), "July", "locale full");
  equal(tz(utc(1980, 0, 1), "%B"), "January", "locale full January");
  equal(tz(utc(1980, 1, 1), "%B"), "February", "locale full February");
  equal(tz(utc(1980, 2, 1), "%B"), "March", "locale full March");
  equal(tz(utc(1980, 3, 1), "%B"), "April", "locale full April");
  equal(tz(utc(1980, 4, 1), "%B"), "May", "locale full May");
  equal(tz(utc(1980, 5, 1), "%B"), "June", "locale full June");
  equal(tz(utc(1980, 6, 1), "%B"), "July", "locale full July");
  equal(tz(utc(1980, 7, 1), "%B"), "August", "locale full August");
  equal(tz(utc(1980, 8, 1), "%B"), "September", "locale full September");
  equal(tz(utc(1980, 9, 1), "%B"), "October", "locale full October");
  equal(tz(utc(1980, 10, 1), "%B"), "November", "locale full November");
  equal(tz(utc(1980, 11, 1), "%B"), "December", "locale full December");
});
