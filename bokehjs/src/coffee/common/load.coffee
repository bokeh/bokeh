define [
  "jquery"
], ($) ->
  _gmap_isloaded = $.Deferred()
  gmap_isloaded = _gmap_isloaded.promise()
  init_gmap = (callback) ->
    url = "https://maps.googleapis.com/maps/api/js?sensor=false"
    if _gmap_isloaded.state() == 'pending'
      $.getScript(url, () ->
        console.log('gmap loaded')
        _gmap_isloaded.resolve())
    gmap_isloaded.done(callback)

  return {'init_gmap' : init_gmap}