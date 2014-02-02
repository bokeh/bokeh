#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_UY"));
  // es_UY abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_UY"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_UY"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_UY"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_UY"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_UY"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_UY"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_UY"), "sáb", "Sat");

  // es_UY days of week
  equal(tz("2006-01-01", "%A", "es_UY"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_UY"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_UY"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_UY"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_UY"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_UY"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_UY"), "sábado", "Saturday");
});
