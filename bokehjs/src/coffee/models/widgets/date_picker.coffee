_ = require "underscore"
$ = require "jquery"
$1 = require "jquery-ui/datepicker"

p = require "../../core/properties"

InputWidget = require "./input_widget"


class DatePickerView extends InputWidget.View

  initialize: (options) ->
    super(options)
    @label = $('<label>').text(@mget("title"))
    @input = $('<input type="text">')
    @datepicker = @input.datepicker({
      defaultDate: new Date(@mget('value'))
      minDate: if @mget('min_date')? then new Date(@mget('min_date')) else null
      maxDate: if @mget('max_date')? then new Date(@mget('max_date')) else null
      onSelect: @onSelect
    })
    @$el.append([@label, @input])

  onSelect: (dateText, ui) =>
    d = new Date(dateText)
    @mset('value', d.toString())
    @mget('callback')?.execute(@model)

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
