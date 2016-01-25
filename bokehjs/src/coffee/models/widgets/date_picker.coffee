_ = require "underscore"
$ = require "jquery"
$1 = require "jquery-ui/datepicker"
ContinuumView = require "../common/continuum_view"
InputWidget = require "./input_widget"

class DatePickerView extends ContinuumView

  initialize: (options) ->
    super(options)
    @render()

  render: () ->
    @$el.empty()
    $label = $('<label>').text(@mget("title"))
    $datepicker = $("<div>").datepicker({
      defaultDate: new Date(@mget('value'))
      minDate: if @mget('min_date')? then new Date(@mget('min_date')) else null
      maxDate: if @mget('max_date')? then new Date(@mget('max_date')) else null
      onSelect: @onSelect
    })
    @$el.append([$label, $datepicker])
    return @

  onSelect: (dateText, ui) =>
    @mset('value', new Date(dateText))
    @mget('callback')?.execute(@model)

class DatePicker extends InputWidget.Model
  type: "DatePicker"
  default_view: DatePickerView

  defaults: () ->
    return _.extend {}, super(), {
      value: Date.now()
      min_date: null
      max_date: null
    }

module.exports =
  Model: DatePicker
  View: DatePickerView
