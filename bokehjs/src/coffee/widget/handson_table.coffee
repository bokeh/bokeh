define [
  "underscore"
  "jquery"
  "handsontable"
  "common/collection"
  "common/has_properties"
  "common/continuum_view"
], (_, $, $$1, Collection, HasProperties, ContinuumView) ->

  class HandsonTableView extends ContinuumView
    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', () => @renderFn())
      source = @mget("source")
      @listenTo(source, 'change:data', () => @renderFn())
      @listenTo(source, 'change:selection', () => @changeSelection())

    changeSelection: () ->
      @ht.deselectCell()

      # NOTE: only linear selection allowed by ht
      selection = @mget("source").get("selection")
      i = _.min(selection)
      j = _.max(selection)
      n = @ht.countCols()
      @ht.selectCell(i, 0, j, n-1, true)

    renderFn: () ->
      source = @mget("source")
      if source?
        headers = []
        columns = []

        for column in @mget("columns")
          if column?
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

        @$el.handsontable({
          data: source.datapoints()
          colHeaders: headers
          columns: columns
          columnSorting: @mget("sorting")
          rowHeaders: true
          width: @mget("width")
          height: @mget("height")
          afterChange: (changes, source) =>
            if source == "edit"
              @editData(changes)
        })
      else
        @$el.handsontable()

      @ht = @$el.handsontable("getInstance")

    render: () ->
      # XXX: we have to know when bokeh finished rendering to ... finish rendering
      handler = () =>
        if $.contains(document.documentElement, @el)
          clearInterval(interval)
          @renderFn()
      interval = setInterval(handler, 50)

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

    defaults: ->
      return _.extend {}, super(), {
        source: null
        columns: []
        width: null
        height: null
      }

  class HandsonTables extends Collection
    model: HandsonTable

  return {
    Model : HandsonTable
    Collection: new HandsonTables()
    View: HandsonTableView
  }
