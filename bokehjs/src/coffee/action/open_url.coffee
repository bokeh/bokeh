define [
  "underscore"
  "util/util"
  "common/collection"
  "common/has_properties"
], (_, Util, Collection, HasProperties) ->

  class OpenURL extends HasProperties
    type: 'OpenURL'

    execute: (data_source) ->
      indices = data_source.get("selected")
      for i in indices
        url = Util.replace_placeholders(@get("url"), data_source, i)
        window.open(url)

    defaults: ->
      return _.extend {}, super(), {
        url: 'http://'
      }

  class OpenURLs extends Collection
    model: OpenURL

  return {
    Model: OpenURL,
    Collection: new OpenURLs()
  }
