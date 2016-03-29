_ = require "underscore"

DataSource = require "./data_source"
SelectionManager = require "../../common/selection_manager"
p = require "../../core/properties"

class ColumnData extends DataSource.Model
  type: 'ColumnData'
  
  @define {
      data:              [ p.Any,      {} ]
      column_names:      [ p.Array,    [] ]
    }

  defaults: ->
    return _.extend {}, super(), {
      # overrides

      # internal
      selection_manager: new SelectionManager({'source':@})
    }

  nonserializable_attribute_names: () ->
    super().concat(['selection_manager', 'inspected'])

  get_column: (colname) ->
    return @get('data')[colname] ? null

  get_length: () ->
    data = @get('data')
    if _.keys(data).length == 0
      return null # XXX: don't guess, treat on case-by-case basis
    else
      lengths = _.uniq((val.length for key, val of data))

      if lengths.length > 1
        logger.debug("data source has columns of inconsistent lengths")

      return lengths[0]

      # TODO: this causes **a lot** of errors currently
      #
      # if lengths.length == 1
      #     return lengths[0]
      # else
      #     throw new Error("data source has columns of inconsistent lengths")

  columns: () ->
    # return the column names in this data source
    return _.keys(@get('data'))
    
module.exports = 
  Model: ColumnData