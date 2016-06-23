_ = require "underscore"
$ = require "jquery"

p = require "../../core/properties"

AbstractButton = require "./abstract_button"

template = require "./dropdown_template"

class DropdownView extends AbstractButton.View
  template: template

  render: () ->
    super()

    items = []
    for item in @model.menu
      $item = if item?
        [label, value] = item
        $a = $("<a data-value='#{value}'>#{label}</a>")
        that = this
        $a.click((e) -> that.set_value($(this).data('value')))
        $('<li></li>').append($a)
      else
        $('<li class="bk-bs-divider"></li>')
      items.push($item)

    @$el.find('.bk-bs-dropdown-menu').append(items)
    @$el.find('button').val(@model.default_value)
    return @

  set_value: (value) ->
    # Set the bokeh model to value
    @model.value = value
    # Set the html button value to value
    @$el.find('button').val(value)



class Dropdown extends AbstractButton.Model
  type: "Dropdown"
  default_view: DropdownView

  @define {
      value:         [ p.String    ]
      default_value: [ p.String    ]
      menu:          [ p.Array, [] ]
    }

  @override {
    label: "Dropdown"
  }

module.exports =
  Model: Dropdown
  View: DropdownView
