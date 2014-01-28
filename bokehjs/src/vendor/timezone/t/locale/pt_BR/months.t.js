#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/pt_BR"));
  //pt_BR abbreviated months
  equal(tz("2000-01-01", "%b", "pt_BR"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "pt_BR"), "Fev", "Feb");
  equal(tz("2000-03-01", "%b", "pt_BR"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "pt_BR"), "Abr", "Apr");
  equal(tz("2000-05-01", "%b", "pt_BR"), "Mai", "May");
  equal(tz("2000-06-01", "%b", "pt_BR"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "pt_BR"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "pt_BR"), "Ago", "Aug");
  equal(tz("2000-09-01", "%b", "pt_BR"), "Set", "Sep");
  equal(tz("2000-10-01", "%b", "pt_BR"), "Out", "Oct");
  equal(tz("2000-11-01", "%b", "pt_BR"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "pt_BR"), "Dez", "Dec");

  // pt_BR months
  equal(tz("2000-01-01", "%B", "pt_BR"), "janeiro", "January");
  equal(tz("2000-02-01", "%B", "pt_BR"), "fevereiro", "February");
  equal(tz("2000-03-01", "%B", "pt_BR"), "março", "March");
  equal(tz("2000-04-01", "%B", "pt_BR"), "abril", "April");
  equal(tz("2000-05-01", "%B", "pt_BR"), "maio", "May");
  equal(tz("2000-06-01", "%B", "pt_BR"), "junho", "June");
  equal(tz("2000-07-01", "%B", "pt_BR"), "julho", "July");
  equal(tz("2000-08-01", "%B", "pt_BR"), "agosto", "August");
  equal(tz("2000-09-01", "%B", "pt_BR"), "setembro", "September");
  equal(tz("2000-10-01", "%B", "pt_BR"), "outubro", "October");
  equal(tz("2000-11-01", "%B", "pt_BR"), "novembro", "November");
  equal(tz("2000-12-01", "%B", "pt_BR"), "dezembro", "December");
});
