var $ = require("jquery");
/* ========================================================================
 * Bootstrap: tab.js v3.1.1
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

'use strict';

// TAB CLASS DEFINITION
// ====================

var Tab = function (element) {
  this.element = $(element)
}

Tab.prototype.show = function () {
  var $this    = this.element
  var $ul      = $this.closest('ul:not(.bk-bs-dropdown-menu)')
  var selector = $this.data('bk-bs-target')

  if (!selector) {
    selector = $this.attr('href')
    selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
  }

  if ($this.parent('li').hasClass('bk-bs-active')) return

  var previous = $ul.find('.bk-bs-active:last a')[0]
  var e        = $.Event('show.bk-bs.tab', {
    relatedTarget: previous
  })

  $this.trigger(e)

  if (e.isDefaultPrevented()) return

  var $target = $(selector)

  this.activate($this.parent('li'), $ul)
  this.activate($target, $target.parent(), function () {
    $this.trigger({
      type: 'shown.bk-bs.tab',
      relatedTarget: previous
    })
  })
}

Tab.prototype.activate = function (element, container, callback) {
  var $active    = container.find('> .bk-bs-active')
  var transition = callback
    && $.support.transition
    && $active.hasClass('bk-bs-fade')

  function next() {
    $active
      .removeClass('bk-bs-active')
      .find('> .bk-bs-dropdown-menu > .bk-bs-active')
      .removeClass('bk-bs-active')

    element.addClass('bk-bs-active')

    if (transition) {
      element[0].offsetWidth // reflow for transition
      element.addClass('bk-bs-in')
    } else {
      element.removeClass('bk-bs-fade')
    }

    if (element.parent('.bk-bs-dropdown-menu')) {
      element.closest('li.bk-bs-dropdown').addClass('bk-bs-active')
    }

    callback && callback()
  }

  transition ?
    $active
      .one($.support.transition.end, next)
      .emulateTransitionEnd(150) :
    next()

  $active.removeClass('bk-bs-in')
}


// TAB PLUGIN DEFINITION
// =====================

var old = $.fn.tab

$.fn.tab = function ( option ) {
  return this.each(function () {
    var $this = $(this)
    var data  = $this.data('bk-bs.tab')

    if (!data) $this.data('bk-bs.tab', (data = new Tab(this)))
    if (typeof option == 'string') data[option]()
  })
}

$.fn.tab.Constructor = Tab


// TAB NO CONFLICT
// ===============

$.fn.tab.noConflict = function () {
  $.fn.tab = old
  return this
}


// TAB DATA-API
// ============

$(document).on('click.bk-bs.tab.data-api', '[data-bk-bs-toggle="tab"], [data-bk-bs-toggle="pill"]', function (e) {
  e.preventDefault()
  $(this).tab('show')
})
