#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/pt_PT"));
  //pt_PT abbreviated months
  equal(tz("2000-01-01", "%b", "pt_PT"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "pt_PT"), "Fev", "Feb");
  equal(tz("2000-03-01", "%b", "pt_PT"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "pt_PT"), "Abr", "Apr");
  equal(tz("2000-05-01", "%b", "pt_PT"), "Mai", "May");
  equal(tz("2000-06-01", "%b", "pt_PT"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "pt_PT"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "pt_PT"), "Ago", "Aug");
  equal(tz("2000-09-01", "%b", "pt_PT"), "Set", "Sep");
  equal(tz("2000-10-01", "%b", "pt_PT"), "Out", "Oct");
  equal(tz("2000-11-01", "%b", "pt_PT"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "pt_PT"), "Dez", "Dec");

  // pt_PT months
  equal(tz("2000-01-01", "%B", "pt_PT"), "Janeiro", "January");
  equal(tz("2000-02-01", "%B", "pt_PT"), "Fevereiro", "February");
  equal(tz("2000-03-01", "%B", "pt_PT"), "Março", "March");
  equal(tz("2000-04-01", "%B", "pt_PT"), "Abril", "April");
  equal(tz("2000-05-01", "%B", "pt_PT"), "Maio", "May");
  equal(tz("2000-06-01", "%B", "pt_PT"), "Junho", "June");
  equal(tz("2000-07-01", "%B", "pt_PT"), "Julho", "July");
  equal(tz("2000-08-01", "%B", "pt_PT"), "Agosto", "August");
  equal(tz("2000-09-01", "%B", "pt_PT"), "Setembro", "September");
  equal(tz("2000-10-01", "%B", "pt_PT"), "Outubro", "October");
  equal(tz("2000-11-01", "%B", "pt_PT"), "Novembro", "November");
  equal(tz("2000-12-01", "%B", "pt_PT"), "Dezembro", "December");
});
