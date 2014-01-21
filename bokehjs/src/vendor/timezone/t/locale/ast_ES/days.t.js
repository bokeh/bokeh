#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ast_ES"));
  // ast_ES abbreviated days of week
  equal(tz("2006-01-01", "%a", "ast_ES"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "ast_ES"), "llu", "Mon");
  equal(tz("2006-01-03", "%a", "ast_ES"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "ast_ES"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "ast_ES"), "xue", "Thu");
  equal(tz("2006-01-06", "%a", "ast_ES"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "ast_ES"), "sáb", "Sat");

  // ast_ES days of week
  equal(tz("2006-01-01", "%A", "ast_ES"), "domingu", "Sunday");
  equal(tz("2006-01-02", "%A", "ast_ES"), "llunes", "Monday");
  equal(tz("2006-01-03", "%A", "ast_ES"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "ast_ES"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "ast_ES"), "xueves", "Thursday");
  equal(tz("2006-01-06", "%A", "ast_ES"), "vienres", "Friday");
  equal(tz("2006-01-07", "%A", "ast_ES"), "sábadu", "Saturday");
});
