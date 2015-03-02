define [
  "jquery"
  "underscore"
  "common/collection"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], ($, _, Collection, ContinuumView, HasParent, Logging) ->

  logger = Logging.logger

  class DropdownView extends ContinuumView
    tagName: "div"

    change_input: (action) ->
      @mset('action', action)
      @model.save()

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()

      split = @mget("default_action")?

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
        $button.click(() => @change_input(@mget("default_action")))
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
          [label, action] = item
          $a = $('<a></a>').text(label)
          $a.click(() => @change_input(action))
          $('<li></li>').append($a)
        else
          $divider
        $menu.append($item)

      @$el.addClass("bk-bs-btn-group")
      @$el.append([$button, $toggle, $menu])
      return @

  class Dropdown extends HasParent
    type: "Dropdown"
    default_view: DropdownView

    defaults: ->
      return _.extend {}, super(), {
        action: null
        default_action: null
        label: "Dropdown"
        icon: null
        type: "default"
        menu: []
        disabled: false
      }

  class Dropdowns extends Collection
    model: Dropdown

  return {
    Model: Dropdown
    Collection: new Dropdowns()
    View: DropdownView
  }
