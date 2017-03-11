import * as $ from "jquery"

import {isFunction} from "core/util/types"

# Cached regex to split keys for `delegate`.
delegateEventSplitter = /^(\S+)\s*(.*)$/

# trait
export JQueryable = {

  _prefix_ui: () ->
    for el in @el.querySelectorAll("*[class*='ui-']")
      classList = []
      for cls in el.classList
        classList.push(if cls.indexOf("ui-") == 0 then "bk-#{cls}" else cls)
      el.className = classList.join(" ")
    return null

  # START backbone

  # Creates the `this.el` and `this.$el` references for this view using the
  # given `el`. `el` can be a CSS selector or an HTML string, a jQuery
  # context or an element. Subclasses can override this to utilize an
  # alternative DOM manipulation API and are only required to set the
  # `this.el` property.
  _setElement: (el) ->
    @$el = if el instanceof $ then el else $(el)
    @el = @$el[0]

  # Change the view's element (`this.el` property) and re-delegate the
  # view's events on the new element.
  setElement: (element) ->
    @undelegateEvents()
    @_setElement(element)
    @delegateEvents()
    return @

  # Set callbacks, where `this.events` is a hash of
  #
  # *{"event selector": "callback"}*
  #
  #     {
  #       'mousedown .title':  'edit',
  #       'click .button':     'save',
  #       'click .open':       function(e) { ... }
  #     }
  #
  # pairs. Callbacks will be bound to the view, with `this` set properly.
  # Uses event delegation for efficiency.
  # Omitting the selector binds the event to `this.el`.
  delegateEvents: (events) ->
    events ?= @events
    if not events then return @
    @undelegateEvents()
    for key, method of events
      if not isFunction(method) then method = @[method]
      if not method? then continue
      match = key.match(delegateEventSplitter)
      @delegate(match[1], match[2], method.bind(@))
    return @

  # Add a single event listener to the view's element (or a child element
  # using `selector`). This only works for delegate-able events: not `focus`,
  # `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
  delegate: (eventName, selector, listener) ->
    @$el.on(eventName + '.delegateEvents' + @id, selector, listener)
    return @

  # Clears all callbacks previously bound to the view by `delegateEvents`.
  # You usually don't need to use this, but may wish to if you have multiple
  # Backbone views attached to the same DOM element.
  undelegateEvents: () ->
    if @$el then @$el.off('.delegateEvents' + @id)
    return @

  # A finer-grained `undelegateEvents` for removing a single delegated event.
  # `selector` and `listener` are both optional.
  undelegate: (eventName, selector, listener) ->
    @$el.off(eventName + '.delegateEvents' + @id, selector, listener)
    return @

  # END backbone
}
