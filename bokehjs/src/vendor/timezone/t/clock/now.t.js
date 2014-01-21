#!/usr/bin/env node
require("../proof")(1, function (equal, tz) {
  tz = tz(function () { this.clock = function () { return 0 } });
  equal(tz("*"), 0, "set");
});
