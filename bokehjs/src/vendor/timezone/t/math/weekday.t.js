#!/usr/bin/env node
require("../proof")(1, function (equal, tz, utc) {
  equal(tz("2011-10-01", "-1 day", "+2 saturday", "%F %T%^z"), "2011-10-08 00:00:00Z", "substract by day of week");
});
