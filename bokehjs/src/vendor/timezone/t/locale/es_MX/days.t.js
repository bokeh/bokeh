#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_MX"));
  // es_MX abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_MX"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_MX"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_MX"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_MX"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_MX"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_MX"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_MX"), "sáb", "Sat");

  // es_MX days of week
  equal(tz("2006-01-01", "%A", "es_MX"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_MX"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_MX"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_MX"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_MX"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_MX"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_MX"), "sábado", "Saturday");
});
