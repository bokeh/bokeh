import {ColumnarDataSource} from "./columnar_data_source"
import {logger} from "../../core/logging"
import {SelectionManager} from "../../core/selection_manager"
import * as p from "../../core/properties"
import {uniq, range} from "../../core/util/array"
import {isBoolean} from "../../core/util/types"
import {create_hit_test_result} from "../../core/hittest"

export class TableDataSource extends ColumnarDataSource
  type: 'TableDataSource'

  initialize: (options) ->
    super(options)
    if @filter.length == 0
      @indices = range(0, @cds.get_length())
    else if isBoolean(@filter[0])
      @indices = (i for i in range(0, @cds.get_length()) when @filter[i] == true)
    else
      @indices = @filter

    @subset_data()
    @indices_map_to_subset()

    @listenTo @, 'change:indices', @subset_data
    @listenTo @cds, 'change:selected', () ->
      @synchronize_selection(@cds.selected)

  @define {
    cds:          [ p.Any,   {} ]
    filter:       [ p.Array, [] ]
  }

  @internal {
    indices:      [p.Array,  [] ]
    indices_map:  [p.Any,    {} ]
    data:         [p.Any,    {} ]
  }

  subset_data: () ->
    @data = {}
    for col_name, col_data of @cds.data
      @data[col_name] = (col_data[i] for i in @indices)

  indices_map_to_subset: () ->
    @indices_map = {}
    for i in [0...@indices.length]
      @indices_map[@indices[i]] = i

  synchronize_selection: (selection) ->
    selected = create_hit_test_result()
    indices_1d = selection['1d']['indices']
    subset_indices_1d = (@indices_map[i] for i in indices_1d when i of @indices_map)
    selected['1d']['indices'] = subset_indices_1d
    @selected = selected

  convert_selection_to_cds: (selection) ->
    indices_1d = (@indices[i] for i in selection['1d']['indices'])
    selection['1d']['indices'] = indices_1d
    return selection
