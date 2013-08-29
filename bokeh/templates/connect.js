window.docid = "{{ docid }}";
utility = rrequire("./serverutils").utility;
headers = {'BOKEH-API-KEY' : '{{ docapikey }}',
          };
$.ajaxSetup({'headers' : headers});
BokehConfig = rrequire("./base").Config;
BokehConfig.prefix = "{{ root_url }}";
BokehConfig.ws_conn_string = "{{ ws_conn_string }}";
wswrapper = utility.make_websocket();
utility.load_doc(window.docid);

