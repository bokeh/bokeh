
define [
  "underscore",
  "jquery",
], (_, $) ->

  bulk_save = (models) ->
    ##FIXME:hack
    doc = models[0].get('doc')
    jsondata = ({type: m.type, attributes:_.clone(m.attributes)} for m in models)
    jsondata = JSON.stringify(jsondata)
    url = Config.prefix + "/bokeh/bb/" + doc + "/bulkupsert"
    xhr = $.ajax(
      type: 'POST'
      url: url
      contentType: "application/json"
      data: jsondata
      header:
        client: "javascript"
    )
    xhr.done((data) ->
      load_models(data.modelspecs)
    )
    return xhr
