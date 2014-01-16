#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_AR"));
  // es_AR abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_AR"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_AR"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_AR"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_AR"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_AR"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_AR"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_AR"), "sáb", "Sat");

  // es_AR days of week
  equal(tz("2006-01-01", "%A", "es_AR"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_AR"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_AR"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_AR"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_AR"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_AR"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_AR"), "sábado", "Saturday");
});
