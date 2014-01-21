#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_PE"));
  // es_PE abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_PE"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_PE"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_PE"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_PE"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_PE"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_PE"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_PE"), "sáb", "Sat");

  // es_PE days of week
  equal(tz("2006-01-01", "%A", "es_PE"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_PE"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_PE"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_PE"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_PE"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_PE"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_PE"), "sábado", "Saturday");
});
