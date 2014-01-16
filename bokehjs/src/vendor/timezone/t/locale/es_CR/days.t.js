#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_CR"));
  // es_CR abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_CR"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_CR"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_CR"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_CR"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_CR"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_CR"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_CR"), "sáb", "Sat");

  // es_CR days of week
  equal(tz("2006-01-01", "%A", "es_CR"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_CR"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_CR"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_CR"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_CR"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_CR"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_CR"), "sábado", "Saturday");
});
