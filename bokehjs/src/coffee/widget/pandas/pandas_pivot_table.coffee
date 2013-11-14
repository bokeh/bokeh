
define [
  "underscore",
  "backbone",
  "common/has_parent",
  "common/continuum_view",
  "./pandas_pivot_template"
], (_, Backbone, HasParent, ContinuumView, pandaspivot) ->

  ENTER = 13

  class PandasPivotView extends ContinuumView.View

    template: pandaspivot

    initialize: (options) ->
      super(options)
      @listenTo(@model, 'destroy', @remove)
      @listenTo(@model, 'change', @render)
      @render()

    events:
      "keyup .pandasgroup": 'pandasgroup'
      "keyup .pandasoffset": 'pandasoffset'
      "keyup .pandassize": 'pandassize'
      "change .pandasagg": 'pandasagg'
      "change .tablecontrolstate": 'tablecontrolstate'
      "click .pandasbeginning": 'pandasbeginning'
      "click .pandasback": 'pandasback'
      "click .pandasnext": 'pandasnext'
      "click .pandasend": 'pandasend'
      "click .controlsmore": 'toggle_more_controls'
      "click .pandascolumn": 'sort'
      "click .pandasrow": 'rowclick'
      "click .filterselected": 'toggle_filterselected'
      "click .clearselected": 'clearselected'
      "keyup .computedtxtbox": 'computedtxtbox'
      "click .column_del": "column_del"
      "keyup .search": 'search'

    search: (e) =>
      if e.keyCode == ENTER
        code = $(e.currentTarget).val()
        source = @model.get_obj('source')
        source.rpc('search', [code])
        e.preventDefault()

    column_del: (e) =>
      source = @model.get_obj('source')
      old = source.get('computed_columns')
      name = $(e.currentTarget).attr('name')
      computed_columns = _.filter(old, (x) ->
        return x.name != name
      )
      source.rpc('set_computed_columns', [computed_columns])

    computedtxtbox: (e) =>
      if e.keyCode == ENTER
        name = @$('.computedname').val()
        code = @$('.computedtxtbox').val()
        source = @model.get_obj('source')
        old = source.get('computed_columns')
        old.push(name: name, code: code)
        source.rpc('set_computed_columns', [old])
        e.preventDefault()

    clearselected: (e) =>
      @model.rpc('setselect', [[]])

    toggle_filterselected: (e) =>
      checked = @$('.filterselected').is(":checked")
      @mset('filterselected', checked)
      @model.save()

    rowclick: (e) =>
      counts = @counts()
      selected = @selected()
      ratios = (select/count for [select,count] in _.zip(selected, counts))
      selected = (idx for ratio, idx in ratios when ratio > 0.5)
      rownum = Number($(e.currentTarget).attr('rownum'))
      index = selected.indexOf(rownum)
      if index == -1
        resp = @model.rpc('select', [[rownum]])
      else
        resp = @model.rpc('deselect', [[rownum]])
      return null

    sort: (e) =>
      colname = $(e.currentTarget).text()
      @model.toggle_column_sort(colname)

    toggle_more_controls: () =>
      if @controls_hide
        @controls_hide = false
      else
        @controls_hide = true
      @render()

    pandasbeginning: () =>
      @model.go_beginning()

    pandasback: () =>
      @model.go_back()

    pandasnext: () =>
      @model.go_forward()

    pandasend: () =>
      @model.go_end()

    pandasoffset: (e) ->
      if e.keyCode == ENTER
        offset = @$el.find('.pandasoffset').val()
        offset = Number(offset)
        if _.isNaN(offset)
          offset = @model.defaults.offset
        @model.save('offset', offset, {wait: true})
        e.preventDefault()

    pandassize: (e) ->
      if e.keyCode == ENTER
        sizetxt = @$el.find('.pandassize').val()
        size = Number(sizetxt)
        if _.isNaN(size) or sizetxt == ""
          size = @model.defaults.length
        if size + @mget('offset') > @mget('maxlength')
          size = @mget('maxlength') - @mget('offset')
        @model.save('length', size, {wait:true})
        e.preventDefault()

    tablecontrolstate: () ->
      @mset('tablecontrolstate', @$('.tablecontrolstate').val())

    pandasagg: () ->
      @model.save('agg', @$el.find('.pandasagg').val(), {'wait':true})

    fromcsv: (str) ->
      #string of csvs, to list of those values
      if not str
        return []
      return _.map(str.split(","), (x) -> return x.trim())

    pandasgroup: (e) ->
      if e.keyCode == ENTER
        @model.set(
          group: @fromcsv(@$el.find(".pandasgroup").val())
          offset: 0
        )
        @model.save()
        e.preventDefault()
        return false

    counts: () ->
      @mget('tabledata').data._counts

    selected: () ->
      @mget('tabledata').data._selected

    colors: () =>
      counts = @counts()
      selected = @selected()
      if counts and selected
        return _.map(_.zip(counts, selected), (temp) ->
          [count, selected] = temp
          alpha = 0.3 * selected / count
          return "rgba(0,0,255,#{alpha})"
        )
      else
        return null

    render: () ->
      group = @mget('group')
      if _.isArray(group)
        group = group.join(",")
      sort = @mget('sort')
      if _.isArray(sort)
        sort = sort.join(",")
      colors = @colors()
      sort_ascendings = {}
      for obj in  @mget('sort')
        sort_ascendings[obj['column']] = obj['ascending']
      source = @mget_obj('source')
      template_data =
        skip:
          _counts: true
          _selected: true
          index: true
        tablecontrolstate: @mget('tablecontrolstate')
        computed_columns: @mget_obj('source').get('computed_columns')
        columns: @mget('tabledata').column_names
        data: @mget('tabledata').data
        group: group
        sort_ascendings: sort_ascendings
        height: @mget('height')
        width: @mget('width')
        offset: @mget('offset')
        length: @model.length()
        filterselected: @mget('filterselected')
        totallength: @mget('totallength')
        counts: @mget('tabledata').data._counts
        selected: @mget('tabledata').data._selected
        controls_hide: @controls_hide
        colors: colors
        index: @mget('tabledata').data.index

      @$el.empty()
      html = @template(template_data)
      @$el.html(html)
      @$(".pandasagg")
        .find("option[value=\"#{@mget('agg')}\"]")
        .attr('selected', 'selected')
      @$(".tablecontrolstate")
        .find("option[value=\"#{@mget('tablecontrolstate')}\"]")
        .attr('selected', 'selected')
      @$el.addClass("bokehtable")


  class PandasPivotTable extends HasParent

    type: 'PandasPivotTable'

    initialize: (attrs, options)->
      super(attrs, options)
      @throttled_fetch = _.throttle((() => @fetch()), 500)

    dinitialize: (attrs, options) =>
      super(attrs, options)

    fetch: (options) ->
      super(options)

    length: () ->
      _.values(@get('tabledata').data)[0].length

    toggle_column_sort: (colname) =>
      sorting = @get('sort')
      @unset('sort', {'silent': true})
      sort = _.filter(sorting, (x) -> return x['column'] == colname)
      if sort.length > 0
        sort = sort[0]
      else
        sorting = _.clone(sorting)
        sorting.push(column: colname, ascending: true)
        @save('sort', sorting, {'wait':true})
        return
      if sort['ascending']
        sort['ascending'] = false
        @save('sort', sorting, {'wait':true})
        return
      else
        sorting = _.filter(sorting, (x) -> return x['column'] != colname)
        @save('sort', sorting, {'wait':true})
        return

    go_beginning: () ->
      @set('offset', 0)
      @save()

    go_back: () ->
      offset = @get('offset')
      offset = offset - @length()
      if offset < 0
        offset = 0
      @set('offset', offset)
      @save()

    go_forward: () ->
      offset = @get('offset')
      offset = offset + @length()
      maxoffset = @get('maxlength') - @length()
      if offset > maxoffset
        offset = maxoffset
      @set('offset', offset)
      @save()

    go_end: () ->
      maxoffset = @get('maxlength') - @length()
      @set('offset', maxoffset)
      @save()

    default_view: PandasPivotView

    defaults: () ->
      return {
        sort: []
        group: []
        agg: 'sum'
        offset: 0
        length: 100
        maxlength: 1000
        tabledata: null
        columns_names: []
        width: null
        tablecontrolstate: 'groupby'
      }

  class PandasPivotTables extends Backbone.Collection
    model: PandasPivotTable

  return {
    "Model" : PandasPivotTable,
    "Collection": new PandasPivotTables(),
    "View": PandasPivotView
  }

