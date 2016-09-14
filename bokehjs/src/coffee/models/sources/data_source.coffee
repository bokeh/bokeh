_ = require "underscore"

Model = require "../../model"
Selector = require "../../common/selector"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class DataSource extends Model
  type: 'DataSource'

  @define {
      # selected and inspected are here for compatibility, should be removed
      selected:  [ p.Any, () -> hittest.create_hit_test_result() ]
      callback:  [ p.Any                                         ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
    }

  @internal {
      # selected and inspected are here for compatibility, should be removed
      inspected: [ p.Any, () -> hittest.create_hit_test_result()       ]
      inspector: [ p.Instance, (self) -> new Selector( {source: self}) ]
      selector:  [ p.Instance, (self) -> new Selector( {source: self}) ]
    }

  initialize: (options) ->
    super(options)
    @listenTo(@, 'select', () =>
      if @callback?
        @callback.execute(@)
    )

module.exports =
  Model: DataSource
