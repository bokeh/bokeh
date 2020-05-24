(function() {
  var fn = function() {
    
    (function(root) {
      function now() {
        return new Date();
      }
    
      var force = false;
    
      if (typeof root._bokeh_onload_callbacks === "undefined" || force === true) {
        root._bokeh_onload_callbacks = [];
        root._bokeh_is_loading = undefined;
      }
    
      
      
    
      var element = document.getElementById("ccbcc8db-292e-4309-bd36-9d6c624aef1b");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'ccbcc8db-292e-4309-bd36-9d6c624aef1b' but no matching script tag was found.")
        }
      
    
      function run_callbacks() {
        try {
          root._bokeh_onload_callbacks.forEach(function(callback) {
            if (callback != null)
              callback();
          });
        } finally {
          delete root._bokeh_onload_callbacks
        }
        console.debug("Bokeh: all callbacks have finished");
      }
    
      function load_libs(css_urls, js_urls, callback) {
        if (css_urls == null) css_urls = [];
        if (js_urls == null) js_urls = [];
    
        root._bokeh_onload_callbacks.push(callback);
        if (root._bokeh_is_loading > 0) {
          console.debug("Bokeh: BokehJS is being loaded, scheduling callback at", now());
          return null;
        }
        if (js_urls == null || js_urls.length === 0) {
          run_callbacks();
          return null;
        }
        console.debug("Bokeh: BokehJS not loaded, scheduling load and callback at", now());
        root._bokeh_is_loading = css_urls.length + js_urls.length;
    
        function on_load() {
          root._bokeh_is_loading--;
          if (root._bokeh_is_loading === 0) {
            console.debug("Bokeh: all BokehJS libraries/stylesheets loaded");
            run_callbacks()
          }
        }
    
        function on_error() {
          console.error("failed to load " + url);
        }
    
        for (var i = 0; i < css_urls.length; i++) {
          var url = css_urls[i];
          const element = document.createElement("link");
          element.onload = on_load;
          element.onerror = on_error;
          element.rel = "stylesheet";
          element.type = "text/css";
          element.href = url;
          console.debug("Bokeh: injecting link tag for BokehJS stylesheet: ", url);
          document.body.appendChild(element);
        }
    
        const hashes = {"https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js": "ufR9RFnRs6lniiaFvtJziE0YeidtAgBRH6ux2oUItHw5WTvE1zuk9uzhUU/FJXDp", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js": "8QM/PGWBT+IssZuRcDcjzwIh1mkOmJSoNMmyYDZbCfXJg3Ap1lEvdVgFuSAwhb/J", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js": "Jm8cH3Rg0P6UeZhVY5cLy1WzKajUT9KImCY+76hEqrcJt59/d8GPvFHjCkYgnSIn", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js": "Ozhzj+SI7ywm74aOI/UajcWz+C0NjsPunEVyVIrxzYkB+jA+2tUw8x5xJCbVtK5I", "https://cdn.bokeh.org/bokeh/release/bokeh-api-2.0.2.min.js": "Zat0VmMWmxj1LsoPt4eZNROXIBlbHawNk70+fMuyPdrkf4bxPfol5eSjkM+2+Aql"};
    
        for (var i = 0; i < js_urls.length; i++) {
          var url = js_urls[i];
          var element = document.createElement('script');
          element.onload = on_load;
          element.onerror = on_error;
          element.async = false;
          element.src = url;
          if (url in hashes) {
            element.crossOrigin = "anonymous";
            element.integrity = "sha384-" + hashes[url];
          }
          console.debug("Bokeh: injecting script tag for BokehJS library: ", url);
          document.head.appendChild(element);
        }
      };
    
      function inject_raw_css(css) {
        const element = document.createElement("style");
        element.appendChild(document.createTextNode(css));
        document.body.appendChild(element);
      }
    
      
      var js_urls = ["https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-api-2.0.2.min.js"];
      var css_urls = [];
      
    
      var inline_js = [
        function(Bokeh) {
          Bokeh.set_log_level("info");
        },
        
        function(Bokeh) {
          (function() {
            var fn = function() {
              Bokeh.safely(function() {
                (function(root) {
                  function embed_document(root) {
                    
                  var docs_json = '{&quot;f1d984a4-4fbc-49f1-baa2-59383e982a75&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20928&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20943&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20904&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;20902&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20945&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;club&quot;:[&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;],&quot;index&quot;:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]},&quot;selected&quot;:{&quot;id&quot;:&quot;20944&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20945&quot;}},&quot;id&quot;:&quot;20919&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Networkx Integration Demonstration&quot;},&quot;id&quot;:&quot;20898&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20919&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;20918&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;20921&quot;}},&quot;id&quot;:&quot;20920&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20923&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;20922&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;20925&quot;}},&quot;id&quot;:&quot;20924&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20944&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20930&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20909&quot;}},&quot;id&quot;:&quot;20908&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;end&quot;:[1,2,3,4,5,6,7,8,10,11,12,13,17,19,21,31,2,3,7,13,17,19,21,30,3,7,8,9,13,27,28,32,7,12,13,6,10,6,10,16,16,30,32,33,33,33,32,33,32,33,32,33,33,32,33,32,33,25,27,29,32,33,25,27,31,31,29,33,33,31,33,32,33,32,33,32,33,33],&quot;start&quot;:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,4,4,5,5,5,6,8,8,8,9,13,14,14,15,15,18,18,19,20,20,22,22,23,23,23,23,23,24,24,24,25,26,26,27,28,28,29,29,30,30,31,31,32]},&quot;selected&quot;:{&quot;id&quot;:&quot;20942&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20943&quot;}},&quot;id&quot;:&quot;20923&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20912&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;20915&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;20916&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20928&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20913&quot;}},&quot;id&quot;:&quot;20912&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20908&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;20911&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20932&quot;,&quot;type&quot;:&quot;NodesOnly&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20930&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20922&quot;,&quot;type&quot;:&quot;MultiLine&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20918&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20923&quot;}},&quot;id&quot;:&quot;20925&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;20908&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;20911&quot;},{&quot;id&quot;:&quot;20915&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;20912&quot;}],&quot;renderers&quot;:[{&quot;id&quot;:&quot;20917&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;20898&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;20916&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;20900&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;20904&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;20902&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;20906&quot;}},&quot;id&quot;:&quot;20897&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;graph_layout&quot;:{&quot;0&quot;:[0.16104888647038693,-0.6638366649822077],&quot;1&quot;:[0.225692742378286,-0.3610222503028287],&quot;10&quot;:[0.49661133770334276,-1.2462839880477192],&quot;11&quot;:[0.8290597348944305,-0.9828651966476024],&quot;12&quot;:[-0.3297914486632469,-0.9957183675736742],&quot;13&quot;:[-0.054293974197756785,-0.15950467468339768],&quot;14&quot;:[0.18686688423912448,1.2347189528853417],&quot;15&quot;:[-0.1735135939107981,1.1873967755350352],&quot;16&quot;:[0.3982777319663491,-2.0],&quot;17&quot;:[0.25185657859165234,-0.9032785178209852],&quot;18&quot;:[0.34060023437701986,1.122627666910243],&quot;19&quot;:[0.32440816780494003,-0.045163089395070716],&quot;2&quot;:[-0.07841223229675381,0.023087255357178087],&quot;20&quot;:[-0.0011017105520160434,1.2797624479063374],&quot;21&quot;:[0.6577449564450181,-0.6213212535204665],&quot;22&quot;:[0.4379048638275693,0.9387608361567521],&quot;23&quot;:[-0.5810156888836411,0.8132019388680317],&quot;24&quot;:[-1.029503452905586,0.27267230417973587],&quot;25&quot;:[-0.989863487437429,0.5497270991953623],&quot;26&quot;:[-0.4521749576450602,1.361173848772633],&quot;27&quot;:[-0.6076975436113009,0.4445442967626936],&quot;28&quot;:[-0.3395720172603435,0.39849015584739],&quot;29&quot;:[-0.41781286540054485,1.083020448442799],&quot;3&quot;:[-0.20682794767324483,-0.5479891264497162],&quot;30&quot;:[0.26349404405417254,0.32375617696608305],&quot;31&quot;:[-0.4282858772650152,0.18190958268800467],&quot;32&quot;:[-0.020278826603781167,0.7695847998079326],&quot;33&quot;:[-0.06961959075354701,0.6697858067160979],&quot;4&quot;:[0.17838306471077647,-1.290028612540015],&quot;5&quot;:[0.42194876819452487,-1.4967217774583006],&quot;6&quot;:[0.19544584627740838,-1.5276727444822293],&quot;7&quot;:[-0.06315967232997365,-0.48121085956450366],&quot;8&quot;:[0.1116261677274159,0.1605537235742164],&quot;9&quot;:[0.3619548777276248,0.5078430068968464]}},&quot;id&quot;:&quot;20926&quot;,&quot;type&quot;:&quot;StaticLayoutProvider&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20933&quot;,&quot;type&quot;:&quot;NodesOnly&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;20900&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20906&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;edge_renderer&quot;:{&quot;id&quot;:&quot;20924&quot;},&quot;inspection_policy&quot;:{&quot;id&quot;:&quot;20933&quot;},&quot;layout_provider&quot;:{&quot;id&quot;:&quot;20926&quot;},&quot;node_renderer&quot;:{&quot;id&quot;:&quot;20920&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20932&quot;}},&quot;id&quot;:&quot;20917&quot;,&quot;type&quot;:&quot;GraphRenderer&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20919&quot;}},&quot;id&quot;:&quot;20921&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20913&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20909&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20942&quot;,&quot;type&quot;:&quot;Selection&quot;}],&quot;root_ids&quot;:[&quot;20897&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"f1d984a4-4fbc-49f1-baa2-59383e982a75","root_ids":["20897"],"roots":{"20897":"ccbcc8db-292e-4309-bd36-9d6c624aef1b"}}];
                  root.Bokeh.embed.embed_items(docs_json, render_items);
                
                  }
                  if (root.Bokeh !== undefined) {
                    embed_document(root);
                  } else {
                    var attempts = 0;
                    var timer = setInterval(function(root) {
                      if (root.Bokeh !== undefined) {
                        clearInterval(timer);
                        embed_document(root);
                      } else {
                        attempts++;
                        if (attempts > 100) {
                          clearInterval(timer);
                          console.log("Bokeh: ERROR: Unable to run BokehJS code because BokehJS library is missing");
                        }
                      }
                    }, 10, root)
                  }
                })(window);
              });
            };
            if (document.readyState != "loading") fn();
            else document.addEventListener("DOMContentLoaded", fn);
          })();
        },
        function(Bokeh) {
        
        
        }
      ];
    
      function run_inline_js() {
        
        for (var i = 0; i < inline_js.length; i++) {
          inline_js[i].call(root, root.Bokeh);
        }
        
      }
    
      if (root._bokeh_is_loading === 0) {
        console.debug("Bokeh: BokehJS loaded, going straight to plotting");
        run_inline_js();
      } else {
        load_libs(css_urls, js_urls, function() {
          console.debug("Bokeh: BokehJS plotting callback run at", now());
          run_inline_js();
        });
      }
    }(window));
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();