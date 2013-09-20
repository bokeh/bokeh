base = require("../base")
safebind = base.safebind

ViewState = require('./view_state').ViewState

class GridViewState extends ViewState
  setup_layout_properties: () =>
    @register_property('layout_heights', @layout_heights, true)
    @register_property('layout_widths', @layout_widths, true)
    for row in @get('childviewstates')
      for viewstate in row
        @add_dependencies('layout_heights', viewstate, 'outer_height')
        @add_dependencies('layout_widths', viewstate, 'outer_width')

  initialize: (attrs, options) ->
    super(attrs, options)
    @setup_layout_properties()
    safebind(this, this, 'change:childviewstates', @setup_layout_properties)
    @register_property('height', () ->
        return _.reduce(@get('layout_heights'), ((x, y) -> x + y), 0)
      , true)
    @add_dependencies('height', @, 'layout_heights')
    @register_property('width', () ->
        return _.reduce(@get('layout_widths'), ((x, y) -> x + y), 0)
      , true)
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
      return _.max(_.map(row, ((x) -> return x.get(dim))))

  layout_heights: () =>
    row_heights = (@maxdim('outer_height',row) for row in @get('childviewstates'))
    return row_heights

  layout_widths: () =>
    num_cols = @get('childviewstates')[0].length
    columns = ((row[n] for row in @get('childviewstates')) for n in _.range(num_cols))
    col_widths = (@maxdim('outer_width', col) for col in columns)
    return col_widths

GridViewState::defaults = _.clone(GridViewState::defaults)
_.extend(GridViewState::defaults
  ,
    childviewstates: [[]]
    border_space: 0
)



exports.GridViewState = GridViewState
