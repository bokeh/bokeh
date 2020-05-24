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
    
      
      
    
      var element = document.getElementById("4198a90e-873e-4654-9d69-661df38f71e7");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '4198a90e-873e-4654-9d69-661df38f71e7' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;51fa1ac0-6656-4be2-8aa0-8e3c218bcb7e&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;21209&quot;}},&quot;id&quot;:&quot;21211&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;callback&quot;:null,&quot;tooltips&quot;:[[&quot;index&quot;,&quot;@index&quot;],[&quot;club&quot;,&quot;@club&quot;]]},&quot;id&quot;:&quot;21201&quot;,&quot;type&quot;:&quot;HoverTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21232&quot;,&quot;type&quot;:&quot;NodesOnly&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21244&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Graph Interaction Demonstration&quot;},&quot;id&quot;:&quot;21200&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21228&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;club&quot;:[&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;],&quot;index&quot;:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]},&quot;selected&quot;:{&quot;id&quot;:&quot;21244&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;21245&quot;}},&quot;id&quot;:&quot;21209&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;21209&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;21217&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;21211&quot;}},&quot;id&quot;:&quot;21210&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;21241&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{&quot;edge_renderer&quot;:{&quot;id&quot;:&quot;21214&quot;},&quot;inspection_policy&quot;:{&quot;id&quot;:&quot;21232&quot;},&quot;layout_provider&quot;:{&quot;id&quot;:&quot;21216&quot;},&quot;node_renderer&quot;:{&quot;id&quot;:&quot;21210&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;21231&quot;}},&quot;id&quot;:&quot;21207&quot;,&quot;type&quot;:&quot;GraphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21231&quot;,&quot;type&quot;:&quot;NodesOnly&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21242&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21230&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21245&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;21241&quot;}},&quot;id&quot;:&quot;21202&quot;,&quot;type&quot;:&quot;BoxZoomTool&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;21195&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;graph_layout&quot;:{&quot;0&quot;:[-0.3562290347296796,0.21308751988886535],&quot;1&quot;:[-0.34135099828821097,-0.08013710234692388],&quot;10&quot;:[-0.4520710763472277,0.5465952415606912],&quot;11&quot;:[-0.7959300606070231,0.3760834999700213],&quot;12&quot;:[-0.6682056774005914,0.21612502747248932],&quot;13&quot;:[-0.18145683996759057,-0.07526631507054249],&quot;14&quot;:[0.5868619983515113,-0.1365888249674335],&quot;15&quot;:[0.5058895137769087,-0.011971729233545442],&quot;16&quot;:[-0.4904785886926478,1.0],&quot;17&quot;:[-0.6512274635403712,0.057892692410984714],&quot;18&quot;:[0.45006018836705974,-0.5535632831639486],&quot;19&quot;:[-0.08242160329288609,0.053344711319011404],&quot;2&quot;:[-0.08283835416681691,-0.13191014873400764],&quot;20&quot;:[0.31476119767932886,-0.5884391059963974],&quot;21&quot;:[-0.6504131085895875,-0.07574497708404095],&quot;22&quot;:[0.6063255382584747,-0.304892820756343],&quot;23&quot;:[0.6470010692440744,-0.17375329158786645],&quot;24&quot;:[0.5862228769008168,0.19795046693498666],&quot;25&quot;:[0.7046108708881643,0.13743631498343087],&quot;26&quot;:[0.6309417085287187,-0.6082908845039257],&quot;27&quot;:[0.3676903785321062,-0.03046904056263397],&quot;28&quot;:[0.15619089354330484,-0.16158158137339484],&quot;29&quot;:[0.6156054897846117,-0.42626174826515206],&quot;3&quot;:[-0.418429711659322,0.02573761548161669],&quot;30&quot;:[0.01048215023852727,-0.29532148741681236],&quot;31&quot;:[0.2544815818250206,0.08813304791389485],&quot;32&quot;:[0.35778319221108235,-0.25273327838989923],&quot;33&quot;:[0.2923578517642468,-0.2573747043251722],&quot;4&quot;:[-0.6138514527407142,0.5409398560583522],&quot;5&quot;:[-0.3881642950810798,0.703985781362131],&quot;6&quot;:[-0.5211922139094934,0.6983731180361393],&quot;7&quot;:[-0.44110932399622,-0.1348082606728827],&quot;8&quot;:[0.03495071483409102,-0.06648728055339488],&quot;9&quot;:[0.013152588281414886,-0.4900890283882974]}},&quot;id&quot;:&quot;21216&quot;,&quot;type&quot;:&quot;StaticLayoutProvider&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21203&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;21213&quot;}},&quot;id&quot;:&quot;21215&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;21196&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21243&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;line_alpha&quot;:{&quot;value&quot;:0.8},&quot;line_color&quot;:{&quot;field&quot;:&quot;edge_color&quot;}},&quot;id&quot;:&quot;21222&quot;,&quot;type&quot;:&quot;MultiLine&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;edge_color&quot;:[&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;red&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;red&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;red&quot;,&quot;black&quot;,&quot;red&quot;,&quot;red&quot;,&quot;red&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;red&quot;,&quot;red&quot;,&quot;red&quot;,&quot;black&quot;,&quot;red&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;red&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;,&quot;black&quot;],&quot;end&quot;:[1,2,3,4,5,6,7,8,10,11,12,13,17,19,21,31,2,3,7,13,17,19,21,30,3,7,8,9,13,27,28,32,7,12,13,6,10,6,10,16,16,30,32,33,33,33,32,33,32,33,32,33,33,32,33,32,33,25,27,29,32,33,25,27,31,31,29,33,33,31,33,32,33,32,33,32,33,33],&quot;start&quot;:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,4,4,5,5,5,6,8,8,8,9,13,14,14,15,15,18,18,19,20,20,22,22,23,23,23,23,23,24,24,24,25,26,26,27,28,28,29,29,30,30,31,31,32]},&quot;selected&quot;:{&quot;id&quot;:&quot;21242&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;21243&quot;}},&quot;id&quot;:&quot;21213&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;21213&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;21222&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;21215&quot;}},&quot;id&quot;:&quot;21214&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#2b83ba&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:15}},&quot;id&quot;:&quot;21217&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;21201&quot;},{&quot;id&quot;:&quot;21202&quot;},{&quot;id&quot;:&quot;21203&quot;}]},&quot;id&quot;:&quot;21204&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;plot_height&quot;:400,&quot;plot_width&quot;:400,&quot;renderers&quot;:[{&quot;id&quot;:&quot;21207&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;21200&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;21204&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;21195&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;21230&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;21196&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;21228&quot;}},&quot;id&quot;:&quot;21197&quot;,&quot;type&quot;:&quot;Plot&quot;}],&quot;root_ids&quot;:[&quot;21197&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"51fa1ac0-6656-4be2-8aa0-8e3c218bcb7e","root_ids":["21197"],"roots":{"21197":"4198a90e-873e-4654-9d69-661df38f71e7"}}];
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