
define [
  "underscore",
  "./has_properties",
  "./safebind",
], (_, HasProperties, safebind) ->

  class GridViewState extends HasProperties

    setup_layout_properties: () =>
      @register_property('layout_heights', @layout_heights, false)
      @register_property('layout_widths', @layout_widths, false)
      for row in @get('childviewstates')
        for viewstate in row
          @add_dependencies('layout_heights', viewstate, 'height')
          @add_dependencies('layout_widths', viewstate, 'width')

    initialize: (attrs, options) ->
      super(attrs, options)
      @setup_layout_properties()
      safebind(this, this, 'change:childviewstates', @setup_layout_properties)
      @register_property('height', () ->
          return _.reduce(@get('layout_heights'), ((x, y) -> x + y), 0)
        , false)
      @add_dependencies('height', @, 'layout_heights')
      @register_property('width', () ->
          return _.reduce(@get('layout_widths'), ((x, y) -> x + y), 0)
        , false)
      @add_dependencies('width', @, 'layout_widths')

    #compute a childs position in the underlying device
    position_child_x: (offset, childsize) ->
      return offset
    position_child_y: (offset, childsize) ->
      return @get('height') - offset - childsize

    maxdim: (dim, row) ->
      if row.length == 0
        return 0
      else
        return _.max(_.map(row, (x) ->
          if x?
            return x.get(dim)
          return 0
        ))

    layout_heights: () =>
      row_heights = (@maxdim('height',row) for row in @get('childviewstates'))
      return row_heights

    layout_widths: () =>
      num_cols = @get('childviewstates')[0].length
      columns = ((row[n] for row in @get('childviewstates')) for n in _.range(num_cols))
      col_widths = (@maxdim('width', col) for col in columns)
      return col_widths

    defaults: () ->
      return {
        childviewstates: [[]]
        border_space: 0
      }

  return GridViewState