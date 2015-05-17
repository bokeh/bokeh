var $ = require("jquery");
/* ========================================================================
 * Bootstrap: modal.js v3.1.1
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

'use strict';

// MODAL CLASS DEFINITION
// ======================

var Modal = function (element, options) {
  this.options   = options
  this.$element  = $(element)
  this.$backdrop =
  this.isShown   = null

  if (this.options.remote) {
    this.$element
      .find('.bk-bs-modal-content')
      .load(this.options.remote, $.proxy(function () {
        this.$element.trigger('loaded.bk-bs.modal')
      }, this))
  }
}

Modal.DEFAULTS = {
  backdrop: true,
  keyboard: true,
  show: true
}

Modal.prototype.toggle = function (_relatedTarget) {
  return this[!this.isShown ? 'show' : 'hide'](_relatedTarget)
}

Modal.prototype.show = function (_relatedTarget) {
  var that = this
  var e    = $.Event('show.bk-bs.modal', { relatedTarget: _relatedTarget })

  this.$element.trigger(e)

  if (this.isShown || e.isDefaultPrevented()) return

  this.isShown = true

  this.escape()

  this.$element.on('click.dismiss.bk-bs.modal', '[data-bk-bs-dismiss="modal"]', $.proxy(this.hide, this))

  this.backdrop(function () {
    var transition = $.support.transition && that.$element.hasClass('bk-bs-fade')

    if (!that.$element.parent().length) {
      that.$element.appendTo(document.body) // don't move modals dom position
    }

    that.$element
      .show()
      .scrollTop(0)

    if (transition) {
      that.$element[0].offsetWidth // force reflow
    }

    that.$element
      .addClass('bk-bs-in')
      .attr('aria-hidden', false)

    that.enforceFocus()

    var e = $.Event('shown.bk-bs.modal', { relatedTarget: _relatedTarget })

    transition ?
      that.$element.find('.bk-bs-modal-dialog') // wait for modal to slide in
        .one($.support.transition.end, function () {
          that.$element.focus().trigger(e)
        })
        .emulateTransitionEnd(300) :
      that.$element.focus().trigger(e)
  })
}

Modal.prototype.hide = function (e) {
  if (e) e.preventDefault()

  e = $.Event('hide.bk-bs.modal')

  this.$element.trigger(e)

  if (!this.isShown || e.isDefaultPrevented()) return

  this.isShown = false

  this.escape()

  $(document).off('focusin.bk-bs.modal')

  this.$element
    .removeClass('bk-bs-in')
    .attr('aria-hidden', true)
    .off('click.dismiss.bk-bs.modal')

  $.support.transition && this.$element.hasClass('bk-bs-fade') ?
    this.$element
      .one($.support.transition.end, $.proxy(this.hideModal, this))
      .emulateTransitionEnd(300) :
    this.hideModal()
}

Modal.prototype.enforceFocus = function () {
  $(document)
    .off('focusin.bk-bs.modal') // guard against infinite focus loop
    .on('focusin.bk-bs.modal', $.proxy(function (e) {
      if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
        this.$element.focus()
      }
    }, this))
}

Modal.prototype.escape = function () {
  if (this.isShown && this.options.keyboard) {
    this.$element.on('keyup.dismiss.bk-bs.modal', $.proxy(function (e) {
      e.which == 27 && this.hide()
    }, this))
  } else if (!this.isShown) {
    this.$element.off('keyup.dismiss.bk-bs.modal')
  }
}

Modal.prototype.hideModal = function () {
  var that = this
  this.$element.hide()
  this.backdrop(function () {
    that.removeBackdrop()
    that.$element.trigger('hidden.bk-bs.modal')
  })
}

Modal.prototype.removeBackdrop = function () {
  this.$backdrop && this.$backdrop.remove()
  this.$backdrop = null
}

Modal.prototype.backdrop = function (callback) {
  var animate = this.$element.hasClass('bk-bs-fade') ? 'bk-bs-fade' : ''

  if (this.isShown && this.options.backdrop) {
    var doAnimate = $.support.transition && animate

    this.$backdrop = $('<div class="bk-bs-modal-backdrop ' + animate + '" />')
      .appendTo(document.body)

    this.$element.on('click.dismiss.bk-bs.modal', $.proxy(function (e) {
      if (e.target !== e.currentTarget) return
      this.options.backdrop == 'static'
        ? this.$element[0].focus.call(this.$element[0])
        : this.hide.call(this)
    }, this))

    if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

    this.$backdrop.addClass('bk-bs-in')

    if (!callback) return

    doAnimate ?
      this.$backdrop
        .one($.support.transition.end, callback)
        .emulateTransitionEnd(150) :
      callback()

  } else if (!this.isShown && this.$backdrop) {
    this.$backdrop.removeClass('bk-bs-in')

    $.support.transition && this.$element.hasClass('bk-bs-fade') ?
      this.$backdrop
        .one($.support.transition.end, callback)
        .emulateTransitionEnd(150) :
      callback()

  } else if (callback) {
    callback()
  }
}


// MODAL PLUGIN DEFINITION
// =======================

var old = $.fn.modal

$.fn.modal = function (option, _relatedTarget) {
  return this.each(function () {
    var $this   = $(this)
    var data    = $this.data('bk-bs.modal')
    var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

    if (!data) $this.data('bk-bs.modal', (data = new Modal(this, options)))
    if (typeof option == 'string') data[option](_relatedTarget)
    else if (options.show) data.show(_relatedTarget)
  })
}

$.fn.modal.Constructor = Modal


// MODAL NO CONFLICT
// =================

$.fn.modal.noConflict = function () {
  $.fn.modal = old
  return this
}


// MODAL DATA-API
// ==============

$(document).on('click.bk-bs.modal.data-api', '[data-bk-bs-toggle="modal"]', function (e) {
  var $this   = $(this)
  var href    = $this.attr('href')
  var $target = $($this.attr('data-bk-bs-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
  var option  = $target.data('bk-bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

  if ($this.is('a')) e.preventDefault()

  $target
    .modal(option, this)
    .one('hide', function () {
      $this.is(':visible') && $this.focus()
    })
})

$(document)
  .on('show.bk-bs.modal', '.bk-bs-modal', function () { $(document.body).addClass('bk-bs-modal-open') })
  .on('hidden.bk-bs.modal', '.bk-bs-modal', function () { $(document.body).removeClass('bk-bs-modal-open') })
