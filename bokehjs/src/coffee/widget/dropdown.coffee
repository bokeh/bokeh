_ = require "underscore"
$ = require "jquery"
ContinuumView = require "../common/continuum_view"
AbstractButton = require "./abstract_button"

class DropdownView extends ContinuumView
  tagName: "div"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()

    split = @mget("default_value")?

    $button = $('<button></button>')
    $button.addClass("bk-bs-btn")
    $button.addClass("bk-bs-btn-" + @mget("type"))
    $button.text(@mget("label"))

    $caret = $('<span class="bk-bs-caret"></span>')
    if not split
      $button.addClass("bk-bs-dropdown-toggle")
      $button.attr("data-bk-bs-toggle", "dropdown")
      $button.append(document.createTextNode(" "))
      $button.append($caret)
      $toggle = $('')
    else
      $button.click(() => @change_input(@mget("default_value")))
      $toggle = $('<button></button>')
      $toggle.addClass("bk-bs-btn")
      $toggle.addClass("bk-bs-btn-" + @mget("type"))
      $toggle.addClass("bk-bs-dropdown-toggle")
      $toggle.attr("data-bk-bs-toggle", "dropdown")
      $toggle.append($caret)

    $menu = $('<ul class="bk-bs-dropdown-menu"></ul>')
    $divider = $('<li class="bk-bs-divider"></li>')

    for item in @mget("menu")
      $item = if item?
        [label, value] = item
        $a = $('<a></a>').text(label).data('value', value)
        that = this
        $a.click((e) -> that.change_input($(this).data('value')))
        $('<li></li>').append($a)
      else
        $divider
      $menu.append($item)

    @$el.addClass("bk-bs-btn-group")
    @$el.append([$button, $toggle, $menu])
    return @

  change_input: (value) ->
    @mset('value', value)
    @mget('callback')?.execute(@model)

class Dropdown extends AbstractButton.Model
  type: "Dropdown"
  default_view: DropdownView

  defaults: () ->
    return _.extend {}, super(), {
      value: null
      default_value: null
      label: "Dropdown"
      menu: []
    }

module.exports =
  Model: Dropdown
  View: DropdownView
