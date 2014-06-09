(function() {
  require.config({
    paths: {
      jquery: "vendor/jquery/jquery",
      jquery_ui: "vendor/jquery-ui-amd/jquery-ui-1.10.0/jqueryui",
      jquery_mousewheel: "vendor/jquery-mousewheel/jquery.mousewheel",
      jqrangeslider: "vendor/jqrangeslider/jQAllRangeSliders-withRuler-min",
      handsontable: "vendor/handsontable/jquery.handsontable",
      numeral: "vendor/numeral/numeral",
      underscore: "vendor/underscore-amd/underscore",
      backbone: "vendor/backbone-amd/backbone",
      bootstrap: "vendor/bootstrap-3.1.1/js",
      timezone: "vendor/timezone/src/timezone",
      sprintf: "vendor/sprintf/src/sprintf",
      rbush: "vendor/rbush/rbush",
      jstree: "vendor/jstree/dist/jstree",
      gear_utils: "vendor/gear-utils/gear-utils"
    },
    shim: {
      sprintf: {
        exports: 'sprintf'
      },
      handsontable: {
        deps: ["numeral"],
        exports: "$.fn.handsontable"
      },
      jqrangeslider: {
        deps: ["jquery_ui/core", "jquery_ui/widget", "jquery_ui/mouse", "jquery_mousewheel"],
        exports: "$.fn.rangeSlider"
      }
    }
  });

}).call(this);

/*
//@ sourceMappingURL=config.js.map
*/