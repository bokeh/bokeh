#!/usr/bin/env node
require("../../proof")(5, function (equal, tz) {
  equal(tz("2000-09-03", "%x", "en_US"), "09/03/2000", "date");
  equal(tz("2000-09-03 08:05:04", "%X", "en_US"), "08:05:04 AM", "time, padding apparent");
  equal(tz("2000-09-03 23:05:04", "%X", "en_US"), "11:05:04 PM", "time");
  equal(tz("2000-09-03 08:05:04", "%c", "en_US"), "Sun 03 Sep 2000 08:05:04 AM UTC", "date, padding apparent");
  equal(tz("2000-09-03 23:05:04", "%c", "en_US"), "Sun 03 Sep 2000 11:05:04 PM UTC", "date");
});
