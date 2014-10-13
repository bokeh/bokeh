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
      selection = @mget("source").get("selected")
      i = _.min(selection)
      j = _.max(selection)
      n = @ht.countCols()
      @ht.selectCell(i, 0, j, n-1, true)

    renderFn: () ->
      source = @mget("source")
      if source?
        headers = []
        widths  = []
        columns = []

        for column in @mget("columns")
          if column?
            header = column.get("header")
            width = column.get("width")

            # NOTE: null won't work, so explicitly fall back to undefined
            headers.push(if header? then header else undefined)
            widths.push(if width? then width else undefined)

            columns.push({
              data: column.get("field")
              type: column.get("type")
              format: column.get("format")
              source: column.get("source")
              strict: column.get("strict")
              checkedTemplate: column.get("checked")
              uncheckedTemplate: column.get("unchecked")
            })

        if @mget("columns_width")?
          col_widths = @mget("columns_width")
        else if _.filter(widths, (x) => x?).length != 0
          col_widths = widths
        else
          col_widths = undefined

        @$el.handsontable({
          data: source.datapoints()
          width: @mget("width")
          height: @mget("height")
          columns: columns
          colWidths: col_widths
          columnSorting: @mget("sorting")
          rowHeaders: @mget("row_headers")
          colHeaders: if @mget("column_headers") then headers else false
          manualRowResize: @mget("row_resize")
          manualColumnResize: @mget("column_resize")
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
        width: null
        height: null
        columns: []
        columns_width: null
        sorting: true
        row_headers: true
        column_headers: true
        row_resize: false
        column_resize: false
      }

  class HandsonTables extends Collection
    model: HandsonTable

  return {
    Model : HandsonTable
    Collection: new HandsonTables()
    View: HandsonTableView
  }
