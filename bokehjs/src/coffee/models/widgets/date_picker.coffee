_ = require "underscore"
$ = require "jquery"
$1 = require "jquery-ui/datepicker"

p = require "../../core/properties"

InputWidget = require "./input_widget"


class DatePickerView extends InputWidget.View

  initialize: (options) ->
    super(options)
    @label = $('<label>').text(@model.get("title"))
    @input = $('<input type="text">')
    @datepicker = @input.datepicker({
      defaultDate: new Date(@model.get('value'))
      minDate: if @model.get('min_date')? then new Date(@model.get('min_date')) else null
      maxDate: if @model.get('max_date')? then new Date(@model.get('max_date')) else null
      onSelect: @onSelect
    })
    @$el.append([@label, @input])

  onSelect: (dateText, ui) =>
    d = new Date(dateText)
    @model.set('value', d.toString())
    @model.get('callback')?.execute(@model)

class DatePicker extends InputWidget.Model
  type: "DatePicker"
  default_view: DatePickerView

  @define {
      # TODO (bev) types
      value:    [ p.Any, Date.now() ]
      min_date: [ p.Any             ]
      max_date: [ p.Any             ]
    }

module.exports =
  Model: DatePicker
  View: DatePickerView
