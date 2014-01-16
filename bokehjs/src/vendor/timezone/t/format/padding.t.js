#!/usr/bin/env node
require("../proof")(3, function (equal, tz, utc, bicentennial) {
  equal(tz(utc(1980, 0, 1, 0, 0, 1, 3), "%0003N"), "003", "padded");
  equal(tz(utc(1980, 0, 1, 0, 0, 1, 3), "%_3N"), "  3", "space padded");
  equal(tz(utc(1980, 0, 1), "%-d"), "1", "unpadded");
});
