# module setup stuff
if this.Continuum
  Continuum = this.Continuum
else
  Continuum = {}
  this.Continuum = Continuum

safebind = (binder, target, event, callback) ->
  # ##function : safebind
  # safebind, binder binds to an event on target, which triggers callback.
  # Safe means that when the binder is destroyed, all callbacks are unbound.
  # callbacks are bound and evaluated in the context of binder

  # ####Parameters

  # * binder : some backbone model - when this is destroyed, the callback will be
  #   unbound
  # * target : object triggering the event we want to bind to
  # * event : string, name of the event
  # * callback : callback for the event

  # ####Returns

  # * null

  # stores objects we are binding events on, so that if we go away,
  # we can unbind all our events
  # currently, we require that the context being used is the binders context
  # this is because we currently unbind on a per context basis.  this can
  # be changed later if we need it
  if not _.has(binder, 'eventers')
    binder['eventers'] = {}
  try
    binder['eventers'][target.id] = target
  catch error
    debugger;
  target.on(event, callback, binder)
  # also need to bind destroy to remove obj from eventers.
  # no special logic needed to manage this life cycle, because
  # we will already unbind all listeners on target when binder goes away
  target.on('destroy remove',
      () =>
        delete binder['eventers'][target]
    ,
      binder)
  return null
Continuum.safebind = safebind
