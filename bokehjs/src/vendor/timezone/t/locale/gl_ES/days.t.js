#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/gl_ES"));
  // gl_ES abbreviated days of week
  equal(tz("2006-01-01", "%a", "gl_ES"), "Dom", "Sun");
  equal(tz("2006-01-02", "%a", "gl_ES"), "Lun", "Mon");
  equal(tz("2006-01-03", "%a", "gl_ES"), "Mar", "Tue");
  equal(tz("2006-01-04", "%a", "gl_ES"), "Mér", "Wed");
  equal(tz("2006-01-05", "%a", "gl_ES"), "Xov", "Thu");
  equal(tz("2006-01-06", "%a", "gl_ES"), "Ven", "Fri");
  equal(tz("2006-01-07", "%a", "gl_ES"), "Sáb", "Sat");

  // gl_ES days of week
  equal(tz("2006-01-01", "%A", "gl_ES"), "Domingo", "Sunday");
  equal(tz("2006-01-02", "%A", "gl_ES"), "Luns", "Monday");
  equal(tz("2006-01-03", "%A", "gl_ES"), "Martes", "Tuesday");
  equal(tz("2006-01-04", "%A", "gl_ES"), "Mércores", "Wednesday");
  equal(tz("2006-01-05", "%A", "gl_ES"), "Xoves", "Thursday");
  equal(tz("2006-01-06", "%A", "gl_ES"), "Venres", "Friday");
  equal(tz("2006-01-07", "%A", "gl_ES"), "Sábado", "Saturday");
});
