define [
  "underscore"
  "jquery"
  "handsontable"
  "backbone"
  "common/has_properties"
  "common/continuum_view"
], (_, $, $$1, Backbone, HasProperties, ContinuumView) ->

  class HandsonTableView extends ContinuumView.View
    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change:source', @render)

    renderFn: () ->
      source = @mget("source")
      if source?
        headers = []
        columns = []

        for column in @mget("columns")
          headers.push(column.get("header"))
          columns.push({
              data: column.get("field")
              type: column.get("type")
              format: column.get("format")
              source: column.get("source")
              strict: column.get("strict")
              checkedTemplate: column.get("checked")
              uncheckedTemplate: column.get("unchecked")
          })

        width = @mget("width")
        height = @mget("height")

        @$el.css(width: width + "px", height: height + "px")
        @$el.handsontable({
          data: source.datapoints()
          colHeaders: headers
          columns: columns
          width: width
          height: height
          afterChange: (changes, source) =>
            if source == "edit"
              @editData(changes)
        })
      else
        @$el.handsontable()

    render: () ->
      # XXX: we have to know when bokeh finished rendering to ... finish rendering
      display = @$el.css("display")

      interval = setInterval(() =>
        if @$el.css("display") != display
          clearInterval(interval)
          @renderFn()
      , 100)

    editData: (changes) ->
      source = @mget("source")
      data = source.get("data")

      for change in changes
        [index, column, old_val, new_val] = change
        array = _.clone(data[column]) # XXX: clone() is just plain wrong, but otherwise we won't get update in set()

        if index < array.length
          array[index] = new_val
        else
          for i in [0...array.length-index]
            array.push(NaN)

          array.push(new_val)

        data[column] = array

      source.set(data)

  class HandsonTable extends HasProperties
    type: 'HandsonTable'
    default_view: HandsonTableView

    defaults: () ->
      return {
          source: null
          columns: []
          width: null
          height: null
      }

  class HandsonTables extends Backbone.Collection
    model: HandsonTable

  return {
    Model : HandsonTable
    Collection: new HandsonTables()
    View: HandsonTableView
  }
