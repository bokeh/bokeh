#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_NI"));
  // es_NI abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_NI"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_NI"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_NI"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_NI"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_NI"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_NI"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_NI"), "sáb", "Sat");

  // es_NI days of week
  equal(tz("2006-01-01", "%A", "es_NI"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_NI"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_NI"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_NI"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_NI"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_NI"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_NI"), "sábado", "Saturday");
});
