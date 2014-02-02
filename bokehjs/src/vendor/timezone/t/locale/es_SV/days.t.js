#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_SV"));
  // es_SV abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_SV"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_SV"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_SV"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_SV"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_SV"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_SV"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_SV"), "sáb", "Sat");

  // es_SV days of week
  equal(tz("2006-01-01", "%A", "es_SV"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_SV"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_SV"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_SV"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_SV"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_SV"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_SV"), "sábado", "Saturday");
});
