_ = require "underscore"
$ = require "jquery"
if global._bokehTest?
  $1 = undefined  # TODO Make work
else
  $1 = require "jquery-ui/datepicker"
ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"

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
    @model.save()
    @mget('callback')?.execute(@model)

class DatePicker extends HasProperties
  type: "DatePicker"
  default_view: DatePickerView

  defaults: () ->
    return _.extend {}, super(), {
      value: Date.now()
    }

module.exports =
  Model: DatePicker
  View: DatePickerView