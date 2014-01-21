#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/pt_PT"));
  // pt_PT abbreviated days of week
  equal(tz("2006-01-01", "%a", "pt_PT"), "Dom", "Sun");
  equal(tz("2006-01-02", "%a", "pt_PT"), "Seg", "Mon");
  equal(tz("2006-01-03", "%a", "pt_PT"), "Ter", "Tue");
  equal(tz("2006-01-04", "%a", "pt_PT"), "Qua", "Wed");
  equal(tz("2006-01-05", "%a", "pt_PT"), "Qui", "Thu");
  equal(tz("2006-01-06", "%a", "pt_PT"), "Sex", "Fri");
  equal(tz("2006-01-07", "%a", "pt_PT"), "Sáb", "Sat");

  // pt_PT days of week
  equal(tz("2006-01-01", "%A", "pt_PT"), "Domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "pt_PT"), "Segunda", "Monday");
  equal(tz("2006-01-03", "%A", "pt_PT"), "Terça", "Tuesday");
  equal(tz("2006-01-04", "%A", "pt_PT"), "Quarta", "Wednesday");
  equal(tz("2006-01-05", "%A", "pt_PT"), "Quinta", "Thursday");
  equal(tz("2006-01-06", "%A", "pt_PT"), "Sexta", "Friday");
  equal(tz("2006-01-07", "%A", "pt_PT"), "Sábado", "Saturday");
});
