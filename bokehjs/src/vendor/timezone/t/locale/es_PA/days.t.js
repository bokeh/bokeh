#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_PA"));
  // es_PA abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_PA"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_PA"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_PA"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_PA"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_PA"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_PA"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_PA"), "sáb", "Sat");

  // es_PA days of week
  equal(tz("2006-01-01", "%A", "es_PA"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_PA"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_PA"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_PA"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_PA"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_PA"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_PA"), "sábado", "Saturday");
});
