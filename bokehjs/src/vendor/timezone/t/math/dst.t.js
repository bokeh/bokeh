#!/usr/bin/env node
require("../proof")(13, function (equal, tz, utc) {
  tz = tz(require("timezone/America/Detroit"));
  // Across dst transitions.
  equal(tz("2010-03-14 12:00", "America/Detroit", "-24 hour", "%c"), "Sat 13 Mar 2010 11:00:00 AM EST",
         "subtract hours across spring forward");
  equal(tz("2010-03-14 03:00", "America/Detroit", "-1 minute", "%c"), "Sun 14 Mar 2010 01:59:00 AM EST",
         "subtract minute across spring forward");
  equal(tz("2010-11-07 03:00", "America/Detroit", "-61 minute", "%c"), "Sun 07 Nov 2010 01:59:00 AM EST",
         "subtract to minute before hour after fall back");
  equal(tz("2010-11-07 03:00", "America/Detroit", "-121 minutes", "%c"), "Sun 07 Nov 2010 01:59:00 AM EDT",
         "subtract to minute before fall back");
  equal(tz("2010-11-07 02:00", "America/Detroit", "-2 hours", "%c"), "Sun 07 Nov 2010 01:00:00 AM EDT",
         "substract to an hour before fall back");

  // Minute by minute within the time zone
  equal(tz("2010-11-07 02:00", "America/Detroit", "-30 minutes", "%c"), "Sun 07 Nov 2010 01:30:00 AM EST",
         "-30 minutes from hour after fall back");
  equal(tz("2010-11-07 02:00", "America/Detroit", "-60 minutes", "%c"), "Sun 07 Nov 2010 01:00:00 AM EST",
         "-60 minutes from hour after fall back");
  equal(tz("2010-11-07 02:00", "America/Detroit", "-90 minutes", "%c"), "Sun 07 Nov 2010 01:30:00 AM EDT",
         "-90 minutes from hour after fall back");
  equal(tz("2010-11-07 02:00", "America/Detroit", "-120 minutes", "%c"), "Sun 07 Nov 2010 01:00:00 AM EDT",
        "-120 minutes from hour after fall back");

  // Landing on missing times.
  equal(tz("2010-03-13 02:30", "America/Detroit", "+1 day", "%c"), "Sun 14 Mar 2010 01:30:00 AM EST",
         "add day lands on missing dst start time");
  equal(tz("2010-03-13 03:30", "America/Detroit", "+1 day", "%c"), "Sun 14 Mar 2010 03:30:00 AM EDT",
         "add day lands after missing dst start time");
  equal(tz("2010-03-15 02:30", "America/Detroit", "-1 day", "%c"), "Sun 14 Mar 2010 03:30:00 AM EDT",
         "subtract day to missing dst start time");
  equal(tz("2010-03-15 03:30", "America/Detroit", "-1 day", "%c"), "Sun 14 Mar 2010 03:30:00 AM EDT",
         "subtract day to hour after missing dst start time");
});
