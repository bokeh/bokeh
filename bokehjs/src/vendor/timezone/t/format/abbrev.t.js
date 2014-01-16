#!/usr/bin/env node
require("../proof")(1, function (equal, tz, utc) {
  tz = tz(require("timezone/America/Anchorage"));
  equal(tz(utc(1946, 0, 1, 10), "%Z", "America/Anchorage"), "CAT", "standard");
});
