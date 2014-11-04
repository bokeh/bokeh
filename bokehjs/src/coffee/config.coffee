require.config
    paths:
        jquery:            "vendor/jquery/jquery.min"
        jquery_ui:         "vendor/jquery-ui-amd/jquery-ui-1.10.0/jqueryui"
        jquery_mousewheel: "vendor/jquery-mousewheel/jquery.mousewheel.min"
        jquery_event_drag: "vendor/jquery-event/jquery.event.drag-2.2"
        jquery_event_drop: "vendor/jquery-event/jquery.event.drop-2.2"
        jqrangeslider:     "vendor/jqrangeslider/jQAllRangeSliders-withRuler-min"
        slick_grid:        "vendor/slick-grid"
        underscore:        "vendor/underscore-amd/underscore"
        backbone:          "vendor/backbone-amd/backbone"
        bootstrap:         "vendor/bootstrap-3.1.1/js"
        timezone:          "vendor/timezone/src/timezone"
        sprintf:           "vendor/sprintf/src/sprintf"
        rbush:             "vendor/rbush/rbush"
        gear_utils:        "vendor/gear-utils/gear-utils"
        kiwi:              "vendor/kiwi/kiwi"
        jsnlog:            "vendor/jsnlog/jsnlog.min"
        hammer:            "vendor/hammer-2.0.4/hammer.min"
    shim:
        sprintf:
            exports: 'sprintf'
        jqrangeslider:
            deps: ["jquery_ui/core", "jquery_ui/widget", "jquery_ui/mouse", "jquery_mousewheel"]
            exports: "$.fn.rangeSlider"
        kiwi:
            exports: 'kiwi'
        jquery_event_drag:
            deps: ["jquery"]
            exports: "$.fn.drag"
        jquery_event_drop:
            deps: ["jquery"]
            exports: "$.fn.drop"
