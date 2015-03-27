var $ = require("jquery");
/* ========================================================================
 * Bootstrap: collapse.js v3.1.1
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

'use strict';

// COLLAPSE PUBLIC CLASS DEFINITION
// ================================

var Collapse = function (element, options) {
  this.$element      = $(element)
  this.options       = $.extend({}, Collapse.DEFAULTS, options)
  this.transitioning = null

  if (this.options.parent) this.$parent = $(this.options.parent)
  if (this.options.toggle) this.toggle()
}

Collapse.DEFAULTS = {
  toggle: true
}

Collapse.prototype.dimension = function () {
  var hasWidth = this.$element.hasClass('bk-bs-width')
  return hasWidth ? 'width' : 'height'
}

Collapse.prototype.show = function () {
  if (this.transitioning || this.$element.hasClass('bk-bs-in')) return

  var startEvent = $.Event('show.bk-bs.collapse')
  this.$element.trigger(startEvent)
  if (startEvent.isDefaultPrevented()) return

  var actives = this.$parent && this.$parent.find('> .bk-bs-panel > .bk-bs-in')

  if (actives && actives.length) {
    var hasData = actives.data('bk-bs.collapse')
    if (hasData && hasData.transitioning) return
    actives.collapse('hide')
    hasData || actives.data('bk-bs.collapse', null)
  }

  var dimension = this.dimension()

  this.$element
    .removeClass('bk-bs-collapse')
    .addClass('bk-bs-collapsing')
    [dimension](0)

  this.transitioning = 1

  var complete = function () {
    this.$element
      .removeClass('bk-bs-collapsing')
      .addClass('bk-bs-collapse bk-bs-in')
      [dimension]('auto')
    this.transitioning = 0
    this.$element.trigger('shown.bk-bs.collapse')
  }

  if (!$.support.transition) return complete.call(this)

  var scrollSize = $.camelCase(['scroll', dimension].join('-'))

  this.$element
    .one($.support.transition.end, $.proxy(complete, this))
    .emulateTransitionEnd(350)
    [dimension](this.$element[0][scrollSize])
}

Collapse.prototype.hide = function () {
  if (this.transitioning || !this.$element.hasClass('bk-bs-in')) return

  var startEvent = $.Event('hide.bk-bs.collapse')
  this.$element.trigger(startEvent)
  if (startEvent.isDefaultPrevented()) return

  var dimension = this.dimension()

  this.$element
    [dimension](this.$element[dimension]())
    [0].offsetHeight

  this.$element
    .addClass('bk-bs-collapsing')
    .removeClass('bk-bs-collapse')
    .removeClass('bk-bs-in')

  this.transitioning = 1

  var complete = function () {
    this.transitioning = 0
    this.$element
      .trigger('hidden.bk-bs.collapse')
      .removeClass('bk-bs-collapsing')
      .addClass('bk-bs-collapse')
  }

  if (!$.support.transition) return complete.call(this)

  this.$element
    [dimension](0)
    .one($.support.transition.end, $.proxy(complete, this))
    .emulateTransitionEnd(350)
}

Collapse.prototype.toggle = function () {
  this[this.$element.hasClass('bk-bs-in') ? 'hide' : 'show']()
}


// COLLAPSE PLUGIN DEFINITION
// ==========================

var old = $.fn.collapse

$.fn.collapse = function (option) {
  return this.each(function () {
    var $this   = $(this)
    var data    = $this.data('bk-bs.collapse')
    var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

    if (!data && options.toggle && option == 'show') option = !option
    if (!data) $this.data('bk-bs.collapse', (data = new Collapse(this, options)))
    if (typeof option == 'string') data[option]()
  })
}

$.fn.collapse.Constructor = Collapse


// COLLAPSE NO CONFLICT
// ====================

$.fn.collapse.noConflict = function () {
  $.fn.collapse = old
  return this
}


// COLLAPSE DATA-API
// =================

$(document).on('click.bk-bs.collapse.data-api', '[data-bk-bs-toggle=collapse]', function (e) {
  var $this   = $(this), href
  var target  = $this.attr('data-bk-bs-target')
      || e.preventDefault()
      || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
  var $target = $(target)
  var data    = $target.data('bk-bs.collapse')
  var option  = data ? 'toggle' : $this.data()
  var parent  = $this.attr('data-bk-bs-parent')
  var $parent = parent && $(parent)

  if (!data || !data.transitioning) {
    if ($parent) $parent.find('[data-bk-bs-toggle=collapse][data-bk-bs-parent="' + parent + '"]').not($this).addClass('bk-bs-collapsed')
    $this[$target.hasClass('bk-bs-in') ? 'addClass' : 'removeClass']('bk-bs-collapsed')
  }

  $target.collapse(option)
})
