var $ = require("jquery");

/* ========================================================================
 * Bootstrap: dropdown.js v3.1.1
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

'use strict';

// DROPDOWN CLASS DEFINITION
// =========================

var backdrop = '.bk-bs-dropdown-backdrop'
var toggle   = '[data-bk-bs-toggle=dropdown]'
var Dropdown = function (element) {
  $(element).on('click.bk-bs.dropdown', this.toggle)
}

Dropdown.prototype.toggle = function (e) {
  var $this = $(this)

  if ($this.is('.bk-bs-disabled, :disabled')) return

  var $parent  = getParent($this)
  var isActive = $parent.hasClass('bk-bs-open')

  clearMenus()

  if (!isActive) {
    if ('ontouchstart' in document.documentElement && !$parent.closest('.bk-bs-navbar-nav').length) {
      // if mobile we use a backdrop because click events don't delegate
      $('<div class="bk-bs-dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
    }

    var relatedTarget = { relatedTarget: this }
    $parent.trigger(e = $.Event('show.bk-bs.dropdown', relatedTarget))

    if (e.isDefaultPrevented()) return

    $parent
      .toggleClass('bk-bs-open')
      .trigger('shown.bk-bs.dropdown', relatedTarget)

    $this.focus()
  }

  return false
}

Dropdown.prototype.keydown = function (e) {
  if (!/(38|40|27)/.test(e.keyCode)) return

  var $this = $(this)

  e.preventDefault()
  e.stopPropagation()

  if ($this.is('.bk-bs-disabled, :disabled')) return

  var $parent  = getParent($this)
  var isActive = $parent.hasClass('bk-bs-open')

  if (!isActive || (isActive && e.keyCode == 27)) {
    if (e.which == 27) $parent.find(toggle).focus()
    return $this.click()
  }

  var desc = ' li:not(.bk-bs-divider):visible a'
  var $items = $parent.find('[role=menu]' + desc + ', [role=listbox]' + desc)

  if (!$items.length) return

  var index = $items.index($items.filter(':focus'))

  if (e.keyCode == 38 && index > 0)                 index--                        // up
  if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
  if (!~index)                                      index = 0

  $items.eq(index).focus()
}

function clearMenus(e) {
  $(backdrop).remove()
  $(toggle).each(function () {
    var $parent = getParent($(this))
    var relatedTarget = { relatedTarget: this }
    if (!$parent.hasClass('bk-bs-open')) return
    $parent.trigger(e = $.Event('hide.bk-bs.dropdown', relatedTarget))
    if (e.isDefaultPrevented()) return
    $parent.removeClass('bk-bs-open').trigger('hidden.bk-bs.dropdown', relatedTarget)
  })
}

function getParent($this) {
  var selector = $this.attr('data-bk-bs-target')

  if (!selector) {
    selector = $this.attr('href')
    selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
  }

  var $parent = selector && $(selector)

  return $parent && $parent.length ? $parent : $this.parent()
}


// DROPDOWN PLUGIN DEFINITION
// ==========================

var old = $.fn.dropdown

$.fn.dropdown = function (option) {
  return this.each(function () {
    var $this = $(this)
    var data  = $this.data('bk-bs.dropdown')

    if (!data) $this.data('bk-bs.dropdown', (data = new Dropdown(this)))
    if (typeof option == 'string') data[option].call($this)
  })
}

$.fn.dropdown.Constructor = Dropdown


// DROPDOWN NO CONFLICT
// ====================

$.fn.dropdown.noConflict = function () {
  $.fn.dropdown = old
  return this
}


// APPLY TO STANDARD DROPDOWN ELEMENTS
// ===================================

$(document)
  .on('click.bk-bs.dropdown.data-api', clearMenus)
  .on('click.bk-bs.dropdown.data-api', '.bk-bs-dropdown form', function (e) { e.stopPropagation() })
  .on('click.bk-bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
  .on('keydown.bk-bs.dropdown.data-api', toggle + ', [role=menu], [role=listbox]', Dropdown.prototype.keydown)
