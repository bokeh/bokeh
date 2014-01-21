#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/es_HN"));
  // es_HN abbreviated days of week
  equal(tz("2006-01-01", "%a", "es_HN"), "dom", "Sun");
  equal(tz("2006-01-02", "%a", "es_HN"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "es_HN"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "es_HN"), "mié", "Wed");
  equal(tz("2006-01-05", "%a", "es_HN"), "jue", "Thu");
  equal(tz("2006-01-06", "%a", "es_HN"), "vie", "Fri");
  equal(tz("2006-01-07", "%a", "es_HN"), "sáb", "Sat");

  // es_HN days of week
  equal(tz("2006-01-01", "%A", "es_HN"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "es_HN"), "lunes", "Monday");
  equal(tz("2006-01-03", "%A", "es_HN"), "martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "es_HN"), "miércoles", "Wednesday");
  equal(tz("2006-01-05", "%A", "es_HN"), "jueves", "Thursday");
  equal(tz("2006-01-06", "%A", "es_HN"), "viernes", "Friday");
  equal(tz("2006-01-07", "%A", "es_HN"), "sábado", "Saturday");
});
