#!/usr/bin/env node
require("../proof")(1, function (equal, tz) {
  tz = tz(require("timezone/America/Detroit"));
  // Landing on missing times.
  equal(tz("2010-03-13 02:30", "America/Detroit", "+1 day", "%c"), "Sun 14 Mar 2010 01:30:00 AM EST",
         "add day lands on missing dst start time");
});
