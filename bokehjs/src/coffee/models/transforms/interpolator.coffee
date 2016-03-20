_ = require "underscore"
Transform = require "./transform"
p = require "../../core/properties"

class Interpolator extends Transform.Model


  initialize: (attrs, options) ->
    super(attrs, options)
    @_x_sorted = []
    @_y_sorted = []
    @_sorted_dirty = true

    @bind 'change', () ->
      console.log 'Changed the configuration'
      @_sorted_dirty = true

  props: ->
    return _.extend {}, super(), {
      x: [ p.String, '']
      y: [ p.String, '']
      data: [ p.Any, null]
    }

  sort: (descending = false) ->
    # Verify that all necessary objects exist...
    if @get('x').length == 0
      return

    if @get('y').length == 0
      return

    if @get('data') == null
      return

    # Stop processing this if the dirty flag is not set
    if(_sorted_dirty == false)
      return

    data = @get('data')

    tsx = data.get_column(@get('x'))
    tsy = data.get_column(@get('y'))

    # The following sorting code is referenced from:
    # http://stackoverflow.com/questions/11499268/sort-two-arrays-the-same-way
    list = [];
    for j of tsx
      list.push({'x': tsx[j], 'y': tsy[j]})

    if descending == true
      list.sort((a, b) ->
        return ((a.x < b.x) ? -1 : ((a.x == b.x) ? 0 : 1));
      )
    else
      list.sort((a, b) ->
        return ((a.x > b.x) ? -1 : ((a.x == b.x) ? 0 : 1));
      )

    for k in [0..list.length-1]
        @_x_sorted[k] = list[k].x;
        @_y_sorted[k] = list[k].y;

    _sorted_dirty = false

module.exports =
  Model: Interpolator