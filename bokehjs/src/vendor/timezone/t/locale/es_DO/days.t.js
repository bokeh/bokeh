#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_DO"));
  // es_DO abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_DO"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_DO"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_DO"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_DO"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_DO"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_DO"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_DO"), "sáb", "Sat");

  // es_DO days of week
  equal(tz("2006-01-01", "%A", "es_DO"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_DO"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_DO"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_DO"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_DO"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_DO"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_DO"), "sábado", "Saturday");
});
