#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/gl_ES"));
  //gl_ES abbreviated months
  equal(tz("2000-01-01", "%b", "gl_ES"), "Xan", "Jan");
  equal(tz("2000-02-01", "%b", "gl_ES"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "gl_ES"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "gl_ES"), "Abr", "Apr");
  equal(tz("2000-05-01", "%b", "gl_ES"), "Mai", "May");
  equal(tz("2000-06-01", "%b", "gl_ES"), "Xuñ", "Jun");
  equal(tz("2000-07-01", "%b", "gl_ES"), "Xul", "Jul");
  equal(tz("2000-08-01", "%b", "gl_ES"), "Ago", "Aug");
  equal(tz("2000-09-01", "%b", "gl_ES"), "Set", "Sep");
  equal(tz("2000-10-01", "%b", "gl_ES"), "Out", "Oct");
  equal(tz("2000-11-01", "%b", "gl_ES"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "gl_ES"), "Dec", "Dec");

  // gl_ES months
  equal(tz("2000-01-01", "%B", "gl_ES"), "Xaneiro", "January");
  equal(tz("2000-02-01", "%B", "gl_ES"), "Febreiro", "February");
  equal(tz("2000-03-01", "%B", "gl_ES"), "Marzo", "March");
  equal(tz("2000-04-01", "%B", "gl_ES"), "Abril", "April");
  equal(tz("2000-05-01", "%B", "gl_ES"), "Maio", "May");
  equal(tz("2000-06-01", "%B", "gl_ES"), "Xuño", "June");
  equal(tz("2000-07-01", "%B", "gl_ES"), "Xullo", "July");
  equal(tz("2000-08-01", "%B", "gl_ES"), "Agosto", "August");
  equal(tz("2000-09-01", "%B", "gl_ES"), "Setembro", "September");
  equal(tz("2000-10-01", "%B", "gl_ES"), "Outubro", "October");
  equal(tz("2000-11-01", "%B", "gl_ES"), "Novembro", "November");
  equal(tz("2000-12-01", "%B", "gl_ES"), "Decembro", "December");
});
