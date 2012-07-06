# module setup stuff
if this.Continuum
  Continuum = this.Continuum
else
  Continuum = {}
  this.Continuum = Continuum


#garbage logging experiment that I should remove
window.logger = new Backbone.Model()
window.logger.on('all',
  ()->
    msg = 'LOGGER:' + JSON.stringify(arguments[1][0])
    console.log(msg))
Continuum.logger = window.logger
logger = Continuum.logger
logger.log = () ->
  logger.trigger('LOG', arguments)






Continuum.ContinuumView = ContinuumView
Continuum.HasProperties = HasProperties
Continuum.HasParent = HasParent
Continuum.Component = Component




