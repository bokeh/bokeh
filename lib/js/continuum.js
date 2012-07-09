var Continuum, logger;

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

Continuum.ContinuumView = ContinuumView;

Continuum.HasProperties = HasProperties;

Continuum.HasParent = HasParent;

Continuum.Component = Component;
