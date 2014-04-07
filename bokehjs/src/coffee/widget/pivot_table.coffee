define [
  "underscore"
  "jquery"
  "jquery_ui/sortable"
  "bootstrap"
  "backbone"
  "common/has_parent"
  "common/has_properties"
  "common/continuum_view"
], (_, $, $$1, $$2, Backbone, HasParent, HasProperties, ContinuumView) ->

  class PivotTableView extends ContinuumView.View

    initialize: (options) ->
      super(options)
      @listenTo(@model, 'destroy', @remove)
      @listenTo(@model, 'change', @rerenderToolbox)
      @listenTo(@model, 'change:data', @rerenderPivotTable)
      @render()

    mpush: (attr, value) ->
      @mset(attr, @mget(attr).concat([value]))

    mupdate: (attr, fn) ->
      value = _.map(@mget(attr), (item) => _.clone(item))
      fn(value)
      @mset(attr, value)

    fieldNames: () ->
      (field.name for field in @mget("fields"))

    fieldDTypes: () ->
      (field.dtype for field in @mget("fields"))

    getDType: (fieldName) ->
      _.find(@mget("fields"), (field) -> field.name == fieldName).dtype

    render: () ->
      html = $('<table class="cdx-pivot"></table>')

      @$description = $('<td class="cdx-pivot-description" valign="center"></td>')
      @$toolbox = $('<td class="cdx-pivot-toolbox" valign="top"></td>')
      @$pivot = $('<td class="cdx-pivot-table" valign="top"></td>')

      @$description.html(@renderDescription())
      @$toolbox.html(@renderToolbox())
      @$pivot.html(@renderWait())

      html.append([
        $('<tr></tr>').append(@$desciption),
        $('<tr></tr>').append([@$toolbox, @$pivot]),
      ])
      @$el.html(html)

      @delayRenderPivotTable()

    renderWait: () ->
      $('<span class="cdx-wait">Rendering ...</span>')

    rerenderPivotTable: () ->
      @$pivot.html(@renderWait())
      @delayRenderPivotTable()

    delayRenderPivotTable: () ->
      _.delay((() => @$pivot.html(@renderPivotTable())), 50)

    rerenderToolbox: () ->
      @$toolbox.html(@renderToolbox())

    renderToolbox: () ->
      toolbox = $('<ul></ul>')
      toolbox.append(@renderRows())
      toolbox.append(@renderColumns())
      toolbox.append(@renderValues())
      toolbox.append(@renderFilters())
      toolbox.append(@renderUpdate())
      toolbox

    renderAdd: (exclude, handler) ->
      dropdown = $('<div class="dropdown pull-right"></div>')
      button = $('<button class="btn btn-link btn-xs dropdown-toggle" data-toggle="dropdown"><i class="fa fa-plus"></i></button>')
      dropdown.append([button.dropdown(), @renderFields(exclude, handler)])
      dropdown

    renderFields: (exclude, handler) ->
      fields = _.difference(@fieldNames(), exclude)
      menu = $('<ul class="dropdown-menu"></ul>')
      items = _.map fields, (field) ->
        link = $('<a tabindex="-1" href="javascript://"></a>')
        link.text(field)
        item = $('<li></li>')
        item.append(link)
      menu.append(items)
      menu.click (event) -> handler($(event.target).text())

    renderRemove: (attr, field) ->
      handler = (event) => @mset(attr, _.reject(@mget(attr), (item) -> item.field == field))
      $('<span class="close pull-right">&times;</span>').click(handler)

    renderOptions: (options, value, handler) ->
      menu = $('<ul class="dropdown-menu"></ul>')
      items = _.map options, (option) =>
        link = $('<a tabindex="-1" href="javascript://"></a>')
        link.text(option)
        item = $('<li></li>')
        item.append(link)
      menu.append(items)
      menu.click (event) => handler($(event.target).text())
      dropdown = $('<span class="dropdown"></span>')
      button = $('<button class="btn btn-link btn-xs dropdown-toggle" data-toggle="dropdown"></button>')
      text = if typeof(value) == 'number' then options[value] else value
      button.text(text)
      button.append('&nbsp;')
      button.append($('<span class="caret"></span>'))
      dropdown.append([button.dropdown(), menu])

    makeSortable: (attr, $el) ->
      $el.sortable({
        handle: ".cdx-pivot-box-header",
        axis: "y",
        distance: 10,
      }).on 'sortstop', (ui) =>
        fields = ($(child).data('cdx-field') for child in $el.children())
        @mset(attr, _.sortBy(@mget(attr), (item) -> fields.indexOf(item.field)))

    renderFieldName: (field) ->
      $('<span class="cdx-field"></span').text(field)

    renderDType: (field) ->
      $('<span class="cdx-dtype"></span').text('(' + @getDType(field) + ')')

    defaultRowColumn: (field) ->
      {field: field, order: "ascending", sort_by: field, totals: true}

    usedFields: () ->
      _.map(@mget("rows").concat(@mget("columns")), (item) -> item.field)

    renderRows: () ->
      el = $("<li></li>")
      header = $("<div>Rows</div>")
      add = @renderAdd @usedFields(), (field) => @mpush("rows", @defaultRowColumn(field))
      header.append(add)
      $rows = $('<ul></ul>')
      _.each @mget("rows"), (row, index) =>
        groupBy = $('<li class="cdx-pivot-box-header">Group by:</li>')
        $field = @renderFieldName(row.field)
        $dtype = @renderDType(row.field)
        $remove = @renderRemove("rows", row.field)
        groupBy.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove])
        order = $('<li>Order:&nbsp;</li>')
        order.append(@renderOptions(["ascending", "descending"], row.order,
          (value) => @mupdate("rows", (rows) -> rows[index].order = value)))
        sortBy = $('<li>Sort by:&nbsp;</li>')
        sortBy.append(@renderOptions([row.field], row.sort_by,
          (value) => @mupdate("rows", (rows) -> rows[index].sort_by = value)))
        totals = $('<li>Totals:&nbsp;</li>')
        totals.append(@renderOptions(["on", "off"], (if row.totals then 0 else 1),
          (value) => @mupdate("rows", (rows) -> rows[index].totals = if value == "on" then true else false)))
        $row = $('<ul class="cdx-pivot-box"></ul>')
        $row.data('cdx-field', row.field)
        $row.append([groupBy, order, sortBy, totals])
        $rows.append($row)
      @makeSortable("rows", $rows)
      el.append([header, $rows])

    renderColumns: () ->
      el = $("<li></li>")
      header = $("<div>Columns</div>")
      add = @renderAdd @usedFields(), (field) => @mpush("columns", @defaultRowColumn(field))
      header.append(add)
      $columns = $('<ul></ul>')
      _.each @mget("columns"), (column, index) =>
        groupBy = $('<li class="cdx-pivot-box-header">Group by:</li>')
        $field = @renderFieldName(column.field)
        $dtype = @renderDType(column.field)
        $remove = @renderRemove("columns", column.field)
        groupBy.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove])
        order = $('<li>Order:&nbsp;</li>')
        order.append(@renderOptions(["ascending", "descending"], column.order,
          (value) => @mupdate("columns", (columns) -> columns[index].order = value)))
        sortBy = $('<li>Sort by:&nbsp;</li>')
        sortBy.append(@renderOptions([column.field], column.sort_by,
          (value) => @mupdate("columns", (columns) -> columns[index].sort_by = value)))
        totals = $('<li>Totals:&nbsp;</li>')
        totals.append(@renderOptions(["on", "off"], (if column.totals then 0 else 1),
          (value) => @mupdate("columns", (columns) -> columns[index].totals = if value == "on" then true else false)))
        $column = $('<ul class="cdx-pivot-box"></ul>')
        $column.data('cdx-field', column.field)
        $column.append([groupBy, order, sortBy, totals])
        $columns.append($column)
      @makeSortable("columns", $columns)
      el.append([header, $columns])

    defaultValue: (field) ->
      {field: field, aggregate: "count", renderer: "default", formatter: "none"}

    renderValues: () ->
      el = $("<li></li>")
      header = $("<div>Values</div>")
      add = @renderAdd [], (field) => @mpush("values", @defaultValue(field))
      header.append(add)
      $values = $('<ul></ul>')
      _.each @mget("values"), (value, index) =>
        display = $('<li class="cdx-pivot-box-header">Display:</li>')
        $field = @renderFieldName(value.field)
        $dtype = @renderDType(value.field)
        $remove = @renderRemove("values", value.field)
        display.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove])
        aggregate = $('<li>Aggregate:&nbsp;</li>')
        aggregate.append(@renderOptions(@model.aggregates, value.aggregate,
          (aggregate) => @mupdate("values", (values) -> values[index].aggregate = aggregate)))
        renderer = $('<li>Renderer:&nbsp;</li>')
        renderer.append(@renderOptions(@model.renderers, value.renderer,
          (renderer) => @mupdate("values", (values) -> values[index].renderer = renderer)))
        formatter = $('<li>Formatter:&nbsp;</li>')
        formatter.append(@renderOptions(@model.formatters, value.formatter,
          (formatter) => @mupdate("values", (values) -> values[index].formatter = formatter)))
        $value = $('<ul class="cdx-pivot-box"></ul>')
        $value.data('cdx-field', value.field)
        $value.append([display, aggregate, renderer, formatter])
        $values.append($value)
      @makeSortable("values", $values)
      el.append([header, $values])

    defaultFilter: (field) ->
      {field: field}

    renderFilters: () ->
      el = $("<li></li>")
      header = $("<div>Filters</div>")
      add = @renderAdd [], (field) => @mpush("filters", @defaultFilter(field))
      header.append(add)
      $filters = $('<ul></ul>')
      _.each @mget("filters"), (filter) =>
        display = $('<li class="cdx-pivot-box-header">Filter:</li>')
        $field = @renderFieldName(filter.field)
        $dtype = @renderDType(filter.field)
        $remove = @renderRemove("filters", filter.field)
        display.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove])
        $filter = $('<ul class="cdx-pivot-box"></ul>')
        $filter.data('cdx-field', filter.field)
        $filter.append([display])
        $filters.append($filter)
      @makeSortable("filters", $filters)
      el.append([header, $filters])

    renderUpdate: () ->
      manual_update = @mget("manual_update")
      el = $("<li></li>")
      update = $('<div>Update:&nbsp;</div>')
      update.append(@renderOptions(["Manual", "Automatic"], (if manual_update then 0 else 1),
        (value) => @mset("manual_update", if value == "Manual" then true else false)))
      el.append(update)
      if manual_update
        button = $('<button type="button" class="btn btn-primary">Update</button>')
        button.click (event) => @model.save()
        el.append(button)
      el

    renderDescription: () ->
      $('<div></div>').text(@mget("description"))

    spanSize: (arr, i, j) ->
      if i != 0
        noDraw = true
        for x in [0..j]
          if arr[i-1][x] != arr[i][x]
            noDraw = false
        if noDraw
          return -1 #do not draw cell
      len = 0
      while i+len < arr.length
        stop = false
        for x in [0..j]
          stop = true if arr[i][x] != arr[i+len][x]
        break if stop
        len++
      return len

    getAggregator: (rowKey, colKey) =>
      data = @mget("data")
      row = data.rows.indexOf(rowKey)
      col = data.cols.indexOf(colKey)
      row = data.rows.length-1 if row == -1
      col = data.cols.length-1 if col == -1
      if row == -1 or col == -1
        value = null
      else
        value = data.values[row][col]
      return {value: (-> value), format: ((value) -> "" + value)}

    renderPivotTable: () ->
      rowAttrs = @mget("rows")
      colAttrs = @mget("columns")

      rowKeys = @mget("data").rows
      colKeys = @mget("data").cols

      #now actually build the output
      result = $("<table class='cdx-pivot-table pvtTable'>")

      #the first few rows are for col headers
      for own j, c of colAttrs
        tr = $("<tr>")
        if parseInt(j) == 0 and rowAttrs.length != 0
          tr.append $("<th>")
            .attr("colspan", rowAttrs.length)
            .attr("rowspan", colAttrs.length)
        tr.append $("<th class='pvtAxisLabel'>").text(c.field)
        for own i, colKey of colKeys
          x = @spanSize(colKeys, parseInt(i), parseInt(j))
          if x != -1
            th = $("<th class='pvtColLabel'>").text(colKey[j]).attr("colspan", x)
            if parseInt(j) == colAttrs.length-1 and rowAttrs.length != 0
              th.attr("rowspan", 2)
            tr.append th
        if parseInt(j) == 0
          tr.append $("<th class='pvtTotalLabel'>").text("Totals")
            .attr("rowspan", colAttrs.length + (if rowAttrs.length ==0 then 0 else 1))
        result.append tr

      #then a row for row header headers
      if rowAttrs.length !=0
        tr = $("<tr>")
        for own i, r of rowAttrs
          tr.append $("<th class='pvtAxisLabel'>").text(r.field)
        th = $("<th>")
        if colAttrs.length ==0
          th.addClass("pvtTotalLabel").text("Totals")
        tr.append th
        result.append tr

      #now the actual data rows, with their row headers and totals
      for own i, rowKey of rowKeys
        tr = $("<tr>")
        for own j, txt of rowKey
          x = @spanSize(rowKeys, parseInt(i), parseInt(j))
          if x != -1
            th = $("<th class='pvtRowLabel'>").text(txt).attr("rowspan", x)
            if parseInt(j) == rowAttrs.length-1 and colAttrs.length !=0
              th.attr("colspan",2)
            tr.append th
        for own j, colKey of colKeys
          aggregator = @getAggregator(rowKey, colKey)
          val = aggregator.value()
          tr.append $("<td class='pvtVal row#{i} col#{j}'>")
            .text(aggregator.format val)
            .data("value", val)

        totalAggregator = @getAggregator(rowKey, [])
        val = totalAggregator.value()
        tr.append $("<td class='pvtTotal rowTotal'>")
          .text(totalAggregator.format val)
          .data("value", val)
          .data("for", "row"+i)
        result.append tr

      #finally, the row for col totals, and a grand total
      tr = $("<tr>")
      th = $("<th class='pvtTotalLabel'>").text("Totals")
      th.attr("colspan", rowAttrs.length + (if colAttrs.length == 0 then 0 else 1))
      tr.append th
      for own j, colKey of colKeys
        totalAggregator = @getAggregator([], colKey)
        val = totalAggregator.value()
        tr.append $("<td class='pvtTotal colTotal'>")
          .text(totalAggregator.format val)
          .data("value", val)
          .data("for", "col"+j)
      totalAggregator = @getAggregator([], [])
      val = totalAggregator.value()
      tr.append $("<td class='pvtGrandTotal'>")
        .text(totalAggregator.format val)
        .data("value", val)
      result.append tr

      result

  class PivotTable extends HasParent
    default_view: PivotTableView
    type: "PivotTable"
    defaults:
      title: "Pivot Table"
      description: ""
      source: null
      data: {}
      fields: []
      rows: []
      columns: []
      values: []
      filters: []
      manual_update: true
    aggregates: ["count", "counta", "countunique", "average", "max", "min", "median", "sum", "product", "stdev", "stdevp", "var", "varp"]
    renderers: ["default", "heatmap"]
    formatters: ["none"]

    mset: () ->
      if @get("manual_update")
        @set.apply(this, arguments)
      else
        @save.apply(this, arguments)

  class PivotTables extends Backbone.Collection
    model: PivotTable

  return {
    Model: PivotTable
    Collection: new PivotTables()
    View: PivotTableView
  }
