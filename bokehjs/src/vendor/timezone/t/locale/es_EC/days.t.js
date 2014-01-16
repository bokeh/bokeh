#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_EC"));
  // es_EC abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_EC"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_EC"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_EC"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_EC"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_EC"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_EC"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_EC"), "sáb", "Sat");

  // es_EC days of week
  equal(tz("2006-01-01", "%A", "es_EC"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_EC"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_EC"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_EC"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_EC"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_EC"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_EC"), "sábado", "Saturday");
});
