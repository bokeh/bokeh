
define [
  "underscore",
], (_) ->

  safebind = (binder, target, event, callback) ->
    # safebind, binder binds to an event on target, which triggers callback.
    # Safe means that when the binder is destroyed, all callbacks are unbound.
    # callbacks are bound and evaluated in the context of binder.  Now that
    # backbone 0.99 is out, with listenTo and stopListening functions, which
    # manage event lifecycles, we probably don't need this function
    #
    # #### Parameters
    #
    # * binder: backbone model or view - when this is destroyed or removed,
    #   the callback
    #   unbound
    # * target: object triggering the event we want to bind to
    # * event: string, name of the event
    # * callback: callback for the event
    #
    # #### Returns
    #
    # * null
    #
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

    # also need to bind destroy to remove obj from eventers.
    # no special logic needed to manage this life cycle, because
    # we will already unbind all listeners on target when binder goes away
    if target?
      target.on(event, callback, binder)
      target.on('destroy remove',
        () =>
          delete binder['eventers'][target]
        ,
          binder)
     else
      debugger;
      console.log("error with binder", binder, event)
    return null
