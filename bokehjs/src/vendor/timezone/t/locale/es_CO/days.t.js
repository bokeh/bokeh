#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_CO"));
  // es_CO abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_CO"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_CO"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_CO"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_CO"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_CO"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_CO"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_CO"), "sáb", "Sat");

  // es_CO days of week
  equal(tz("2006-01-01", "%A", "es_CO"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_CO"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_CO"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_CO"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_CO"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_CO"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_CO"), "sábado", "Saturday");
});
