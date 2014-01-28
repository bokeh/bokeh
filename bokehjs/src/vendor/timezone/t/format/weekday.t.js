#!/usr/bin/env node
require("../proof")(2, function (equal, tz, bicentennial) {
  equal(tz(bicentennial, "%a"), "Sun", "weekday short");
  equal(tz(bicentennial, "%A"), "Sunday", "weekday long");
});
