#!/usr/bin/env node
require("../proof")(3, function (equal, tz, utc) {
  equal(tz(utc(2007, 2, 3), "+1 month"), utc(2007, 3, 3), "add month");
  equal(tz(utc(2011, 10), "-1 month"), utc(2011, 9), "subtract month");
  equal(tz(utc(2007, 11, 3), "+1 month"), utc(2008, 0, 3), "add month across year");
});
