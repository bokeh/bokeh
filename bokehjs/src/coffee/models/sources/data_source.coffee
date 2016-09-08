_ = require "underscore"

Model = require "../../model"
Selector = require "../../common/selector"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class DataSource extends Model
  type: 'DataSource'

  @define {
      inspector: [ p.Instance, (self) -> new Selector( {source: self}) ]
      selector:  [ p.Instance, (self) -> new Selector( {source: self}) ]
      callback:  [ p.Any                                   ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
    }

  initialize: (options) ->
    super(options)
    @listenTo(@selector, 'select', () =>
      if @callback?
        @callback.execute(@)
    )

module.exports =
  Model: DataSource
