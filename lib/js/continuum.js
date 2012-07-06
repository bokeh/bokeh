(function() {
  var Continuum, logger, safebind;

  if (this.Continuum) {
    Continuum = this.Continuum;
  } else {
    Continuum = {};
    this.Continuum = Continuum;
  }

  window.logger = new Backbone.Model();

  window.logger.on('all', function() {
    var msg;
    msg = 'LOGGER:' + JSON.stringify(arguments[1][0]);
    return console.log(msg);
  });

  Continuum.logger = window.logger;

  logger = Continuum.logger;

  logger.log = function() {
    return logger.trigger('LOG', arguments);
  };

  safebind = function(binder, target, event, callback) {
    var _this = this;
    if (!_.has(binder, 'eventers')) binder['eventers'] = {};
    binder['eventers'][target.id] = target;
    target.on(event, callback, binder);
    target.on('destroy remove', function() {
      return delete binder['eventers'][target];
    }, binder);
    return null;
  };

  Continuum.ContinuumView = ContinuumView;

  Continuum.HasProperties = HasProperties;

  Continuum.HasParent = HasParent;

  Continuum.Component = Component;

  Continuum.safebind = safebind;

}).call(this);
