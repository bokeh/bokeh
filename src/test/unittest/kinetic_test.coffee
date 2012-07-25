
$( ()->
  # Shouldn't they be colored somehow fancy?
  colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

  #jQuery comes to the resque
  width = $('#container').width()
  height = $('#container').height()
  # Add polygons to a layer
  addPolygon = (layer) ->
      n = layer.getChildren().length + 1
      console.log("x",  (n % 10+1) * 50, "y", (n % 3 + 1) * 50)
      
      layer.add new Kinetic.RegularPolygon
          fill: 'red'
          sides: 3
          x: (n % 10+1) * 50
          y: (n % 3 + 1) * 50
          radius: 40
          strokeWidth: 3

  $ ->
    # Get a named div sized appropriately,
    # then create a Kinetic Stage,
    # then fill it with some shapes:
    stage = new Kinetic.Stage
      container: 'container'
      width: width
      height: height
    layer = new Kinetic.Layer()
    stage.add layer

    $('#tango').click ->
      addPolygon layer
      layer.draw()
)