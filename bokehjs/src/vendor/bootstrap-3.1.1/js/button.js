var $ = require("jquery");
/* ========================================================================
* Bootstrap: button.js v3.1.1
* http://getbootstrap.com/javascript/#buttons
* ========================================================================
* Copyright 2011-2014 Twitter, Inc.
* Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
* ======================================================================== */

'use strict';

// BUTTON PUBLIC CLASS DEFINITION
// ==============================

var Button = function (element, options) {
  this.$element  = $(element)
  this.options   = $.extend({}, Button.DEFAULTS, options)
  this.isLoading = false
}

Button.DEFAULTS = {
  loadingText: 'loading...'
}

Button.prototype.setState = function (state) {
  var d    = 'bk-bs-disabled'
  var $el  = this.$element
  var val  = $el.is('input') ? 'val' : 'html'
  var data = $el.data()

  state = state + 'Text'

  if (!data.resetText) $el.data('resetText', $el[val]())

  $el[val](data[state] || this.options[state])

  // push to event loop to allow forms to submit
  setTimeout($.proxy(function () {
    if (state == 'loadingText') {
      this.isLoading = true
      $el.addClass(d).attr(d, d)
    } else if (this.isLoading) {
      this.isLoading = false
      $el.removeClass(d).removeAttr(d)
    }
  }, this), 0)
}

Button.prototype.toggle = function () {
  var changed = true
  var $parent = this.$element.closest('[data-bk-bs-toggle="buttons"]')

  if ($parent.length) {
    var $input = this.$element.find('input')
    if ($input.prop('type') == 'radio') {
      if ($input.prop('checked') && this.$element.hasClass('bk-bs-active')) changed = false
      else $parent.find('.bk-bs-active').removeClass('bk-bs-active')
    }
    if (changed) $input.prop('checked', !this.$element.hasClass('bk-bs-active')).trigger('change')
  }

  if (changed) this.$element.toggleClass('bk-bs-active')
}


// BUTTON PLUGIN DEFINITION
// ========================

var old = $.fn.button

$.fn.button = function (option) {
  return this.each(function () {
    var $this   = $(this)
    var data    = $this.data('bk-bs.button')
    var options = typeof option == 'object' && option

    if (!data) $this.data('bk-bs.button', (data = new Button(this, options)))

    if (option == 'toggle') data.toggle()
    else if (option) data.setState(option)
  })
}

$.fn.button.Constructor = Button


// BUTTON NO CONFLICT
// ==================

$.fn.button.noConflict = function () {
  $.fn.button = old
  return this
}


// BUTTON DATA-API
// ===============

$(document).on('click.bk-bs.button.data-api', '[data-bk-bs-toggle^=button]', function (e) {
  var $btn = $(e.target)
  if (!$btn.hasClass('bk-bs-btn')) $btn = $btn.closest('.bk-bs-btn')
  $btn.button('toggle')
  e.preventDefault()
})
