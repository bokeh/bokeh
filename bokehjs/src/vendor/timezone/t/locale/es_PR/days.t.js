#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_PR"));
  // es_PR abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_PR"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_PR"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_PR"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_PR"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_PR"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_PR"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_PR"), "sáb", "Sat");

  // es_PR days of week
  equal(tz("2006-01-01", "%A", "es_PR"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_PR"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_PR"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_PR"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_PR"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_PR"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_PR"), "sábado", "Saturday");
});
