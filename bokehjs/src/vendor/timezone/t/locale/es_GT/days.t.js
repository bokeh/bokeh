#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_GT"));
  // es_GT abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_GT"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_GT"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_GT"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_GT"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_GT"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_GT"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_GT"), "sáb", "Sat");

  // es_GT days of week
  equal(tz("2006-01-01", "%A", "es_GT"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_GT"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_GT"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_GT"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_GT"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_GT"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_GT"), "sábado", "Saturday");
});
