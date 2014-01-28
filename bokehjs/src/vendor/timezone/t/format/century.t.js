#!/usr/bin/env node
require("../proof")(1, function (equal, tz, bicentennial) {
  equal(tz(bicentennial, "%C"), "19", "century");
});
