_ = require "underscore"
Transform = require "./transform"
p = require "../../core/properties"
{logger} = require "../../core/logging"

class Interpolator extends Transform.Model

  initialize: (attrs, options) ->
    super(attrs, options)
    @_x_sorted = []
    @_y_sorted = []
    @_sorted_dirty = true

    @bind 'change', () ->
      @_sorted_dirty = true

  @define {
    x:    [ p.Any]
    y:    [ p.Any]
    data: [ p.Any]
    clip: [ p.Bool, true]
    }

  sort: (descending = false) ->
    # Verify that all necessary objects exist...
    if typeof(@get('x')) != typeof(@get('y'))
      throw Error('The parameters for x and y must be of the same type, either both strings which define a column in the data source or both arrays of the same length')
      return

    else
      if typeof(@get('x')) == 'string' and @get('data') == null
        throw Error('If the x and y parameters are not specified as an array, the data parameter is reqired.')
        return

    # Stop processing this if the dirty flag is not set
    if(@_sorted_dirty == false)
      return

    tsx = []
    tsy = []

    # Populate the tsx and tsy variables correctly depending on the method by which the user populated the interpolation
    # data.
    if typeof(@get('x')) == 'string'
      data = @get('data')

      column_names = data.columns()
      if @get('x') not in column_names
        throw Error('The x parameter does not correspond to a valid column name defined in the data parameter')

      if @get('y') not in column_names
        throw Error('The x parameter does not correspond to a valid column name defined in the data parameter')

      tsx = data.get_column(@get('x'))
      tsy = data.get_column(@get('y'))
    else
      tsx = @get('x')
      tsy = @get('y')

    if tsx.length != tsy.length
      throw Error('The length for x and y do not match')

    if tsx.length < 2
      throw Error('x and y must have at least two elements to support interpolation')

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

    @_sorted_dirty = false

module.exports =
  Model: Interpolator
