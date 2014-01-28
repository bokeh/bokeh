#!/usr/bin/env node
require("../proof")(4, function (equal, tz, bicentennial) {
  equal(tz(bicentennial, "%d"), "04", "date");
  equal(tz(bicentennial, "%-d"), "4", "date unpadded");
  equal(tz(bicentennial, "%_d"), " 4", "date space padded");
  equal(tz(bicentennial, "%e"), " 4", "date single digit");
});
