#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_CL"));
  // es_CL abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_CL"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_CL"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_CL"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_CL"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_CL"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_CL"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_CL"), "sáb", "Sat");

  // es_CL days of week
  equal(tz("2006-01-01", "%A", "es_CL"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_CL"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_CL"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_CL"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_CL"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_CL"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_CL"), "sábado", "Saturday");
});
