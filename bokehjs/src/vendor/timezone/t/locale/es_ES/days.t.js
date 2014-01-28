#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_ES"));
  // es_ES abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_ES"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_ES"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_ES"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_ES"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_ES"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_ES"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_ES"), "sáb", "Sat");

  // es_ES days of week
  equal(tz("2006-01-01", "%A", "es_ES"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_ES"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_ES"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_ES"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_ES"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_ES"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_ES"), "sábado", "Saturday");
});
