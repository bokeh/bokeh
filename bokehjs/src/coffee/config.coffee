require.config
  map:
    # '*' means all modules will get 'jquery-private'
    # for their 'jquery' dependency.
    '*': { 'jquery': 'jquery-private' }

    # 'jquery-private' wants the real jQuery module
    # though. If this line was not here, there would
    # be an unresolvable cyclic dependency.
    'jquery-private': { 'jquery': 'jquery' }
  paths:
    jquery:            "vendor/jquery-1.11.1/jquery"
    jquery_ui:         "vendor/jquery-ui-1.11.2/js"
    jquery_mousewheel: "vendor/jquery-mousewheel-3.1.12/jquery.mousewheel"
    jquery_event_drag: "vendor/jquery-event-2.2/jquery.event.drag"
    jquery_event_drop: "vendor/jquery-event-2.2/jquery.event.drop"
    jqrangeslider:     "vendor/jqrangeslider-5.7.0"
    slick_grid:        "vendor/slick-grid-2.1.0"
    underscore:        "vendor/underscore-amd/underscore"
    backbone:          "vendor/backbone-amd/backbone"
    bootstrap:         "vendor/bootstrap-3.1.1/js"
    timezone:          "vendor/timezone-0.0.38/src/timezone"
    sprintf:           "vendor/sprintf-1.0.2/sprintf"
    rbush:             "vendor/rbush/rbush"
    gear_utils:        "vendor/gear-utils/gear-utils"
    kiwi:              "vendor/kiwi/kiwi"
    jsnlog:            "vendor/jsnlog.js-2.7.5/jsnlog"
    hammer:            "vendor/hammer.js-2.0.4/hammer"
    numeral:           "vendor/numeral.js-1.5.3/numeral"
    handlebars:        "vendor/handlebars-2.0.0/handlebars"
  shim:
    kiwi:
      exports: 'kiwi'
