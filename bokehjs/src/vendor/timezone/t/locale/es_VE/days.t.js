#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_VE"));
  // es_VE abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_VE"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_VE"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_VE"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_VE"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_VE"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_VE"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_VE"), "sáb", "Sat");

  // es_VE days of week
  equal(tz("2006-01-01", "%A", "es_VE"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_VE"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_VE"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_VE"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_VE"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_VE"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_VE"), "sábado", "Saturday");
});
