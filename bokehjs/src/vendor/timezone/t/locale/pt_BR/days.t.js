#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/pt_BR"));
  // pt_BR abbreviated days of week
  equal(tz("2006-01-01", "%a", "pt_BR"), "Dom", "Sun");
  equal(tz("2006-01-02", "%a", "pt_BR"), "Seg", "Mon");
  equal(tz("2006-01-03", "%a", "pt_BR"), "Ter", "Tue");
  equal(tz("2006-01-04", "%a", "pt_BR"), "Qua", "Wed");
  equal(tz("2006-01-05", "%a", "pt_BR"), "Qui", "Thu");
  equal(tz("2006-01-06", "%a", "pt_BR"), "Sex", "Fri");
  equal(tz("2006-01-07", "%a", "pt_BR"), "Sáb", "Sat");

  // pt_BR days of week
  equal(tz("2006-01-01", "%A", "pt_BR"), "domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "pt_BR"), "segunda", "Monday");
  equal(tz("2006-01-03", "%A", "pt_BR"), "terça", "Tuesday");
  equal(tz("2006-01-04", "%A", "pt_BR"), "quarta", "Wednesday");
  equal(tz("2006-01-05", "%A", "pt_BR"), "quinta", "Thursday");
  equal(tz("2006-01-06", "%A", "pt_BR"), "sexta", "Friday");
  equal(tz("2006-01-07", "%A", "pt_BR"), "sábado", "Saturday");
});
