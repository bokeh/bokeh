(function() {
  require.config({
    paths: {
      jquery: "vendor/jquery/jquery",
      jquery_ui: "vendor/jquery-ui-amd/jquery-ui-1.10.0/jqueryui",
      jquery_mousewheel: "vendor/jquery-mousewheel/jquery.mousewheel.min",
      jqrangeslider: "vendor/jqrangeslider/jQAllRangeSliders-withRuler-min",
      handsontable: "vendor/handsontable/jquery.handsontable.full",
      underscore: "vendor/underscore-amd/underscore",
      backbone: "vendor/backbone-amd/backbone",
      bootstrap: "vendor/bootstrap-3.1.1/js",
      timezone: "vendor/timezone/src/timezone",
      sprintf: "vendor/sprintf/src/sprintf",
      rbush: "vendor/rbush/rbush",
      jstree: "vendor/jstree/dist/jstree",
      gear_utils: "vendor/gear-utils/gear-utils",
      kiwi: "vendor/kiwi/kiwi",
      jsnlog: "vendor/jsnlog/jsnlog.min"
    },
    shim: {
      sprintf: {
        exports: 'sprintf'
      },
      handsontable: {
        deps: ["jquery"],
        exports: "$.fn.handsontable"
      },
      jqrangeslider: {
        deps: ["jquery_ui/core", "jquery_ui/widget", "jquery_ui/mouse", "jquery_mousewheel"],
        exports: "$.fn.rangeSlider"
      },
      kiwi: {
        exports: 'kiwi'
      }
    }
  });

}).call(this);

/*
//@ sourceMappingURL=config.js.map
*/