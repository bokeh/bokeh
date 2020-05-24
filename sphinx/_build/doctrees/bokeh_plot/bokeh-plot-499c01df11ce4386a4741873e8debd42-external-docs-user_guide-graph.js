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
    
      
      
    
      var element = document.getElementById("966c408e-b3dd-4cc1-b2be-3cfd5a159d70");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '966c408e-b3dd-4cc1-b2be-3cfd5a159d70' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;d754c343-8369-4bd0-9573-74447acb83c4&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;graph_layout&quot;:{&quot;0&quot;:[1.0,5.200874811222461e-09],&quot;1&quot;:[0.9829730987698075,0.18374951687777052],&quot;10&quot;:[-0.2736629534524478,0.9618256731695953],&quot;11&quot;:[-0.4457383143150295,0.8951633020694276],&quot;12&quot;:[-0.6026346669454482,0.7980172083092125],&quot;13&quot;:[-0.7390088423744644,0.6736956880896635],&quot;14&quot;:[-0.8502171619409874,0.5264321613022418],&quot;15&quot;:[-0.9324721677053746,0.3612417925562752],&quot;16&quot;:[-0.9829730970167299,0.1837495317789317],&quot;17&quot;:[-0.9999999982469223,-8.222190168562394e-08],&quot;18&quot;:[-0.9829730970167299,-0.18374946177253734],&quot;19&quot;:[-0.9324722273100193,-0.36124172254988085],&quot;2&quot;:[0.932472229063097,0.36124167334698576],&quot;20&quot;:[-0.8502171619409874,-0.5264320912958473],&quot;21&quot;:[-0.7390089019791091,-0.6736956776879138],&quot;22&quot;:[-0.6026347265500929,-0.7980171383028182],&quot;23&quot;:[-0.44573837391967425,-0.895163291667678],&quot;24&quot;:[-0.27366289384780307,-0.9618256627678456],&quot;25&quot;:[-0.0922681605182429,-0.9957342087090403],&quot;26&quot;:[0.09226818462306245,-0.9957342087090403],&quot;27&quot;:[0.27366292540320325,-0.9618256627678456],&quot;28&quot;:[0.44573837567275204,-0.895163291667678],&quot;29&quot;:[0.6026347283031706,-0.7980171383028182],&quot;3&quot;:[0.8502171040894204,0.5264321613022418],&quot;30&quot;:[0.7390087845228973,-0.6736957968972033],&quot;31&quot;:[0.8502170444847756,-0.5264322701097816],&quot;32&quot;:[0.932472229063097,-0.36124169274755846],&quot;33&quot;:[0.9829730987698075,-0.18374944687137618],&quot;4&quot;:[0.7390089037321868,0.6736956284850187],&quot;5&quot;:[0.6026346686985259,0.7980172083092125],&quot;6&quot;:[0.4457383458704297,0.8951633020694276],&quot;7&quot;:[0.27366298500784797,0.9618256731695953],&quot;8&quot;:[0.09226837088757722,0.9957341595061452],&quot;9&quot;:[-0.09226833188159647,0.9957341595061452]}},&quot;id&quot;:&quot;21055&quot;,&quot;type&quot;:&quot;StaticLayoutProvider&quot;},{&quot;attributes&quot;:{&quot;callback&quot;:null},&quot;id&quot;:&quot;21041&quot;,&quot;type&quot;:&quot;TapTool&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#abdda4&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:15}},&quot;id&quot;:&quot;21066&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;line_color&quot;:{&quot;value&quot;:&quot;#fdae61&quot;},&quot;line_width&quot;:{&quot;value&quot;:5}},&quot;id&quot;:&quot;21076&quot;,&quot;type&quot;:&quot;MultiLine&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;21048&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;21056&quot;},&quot;hover_glyph&quot;:{&quot;id&quot;:&quot;21066&quot;},&quot;muted_glyph&quot;:null,&quot;selection_glyph&quot;:{&quot;id&quot;:&quot;21061&quot;},&quot;view&quot;:{&quot;id&quot;:&quot;21050&quot;}},&quot;id&quot;:&quot;21049&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21088&quot;,&quot;type&quot;:&quot;EdgesAndLinkedNodes&quot;},{&quot;attributes&quot;:{&quot;line_alpha&quot;:{&quot;value&quot;:0.8},&quot;line_color&quot;:{&quot;value&quot;:&quot;#CCCCCC&quot;},&quot;line_width&quot;:{&quot;value&quot;:5}},&quot;id&quot;:&quot;21071&quot;,&quot;type&quot;:&quot;MultiLine&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;21048&quot;}},&quot;id&quot;:&quot;21050&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21105&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21106&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21104&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;21052&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;21071&quot;},&quot;hover_glyph&quot;:{&quot;id&quot;:&quot;21081&quot;},&quot;muted_glyph&quot;:null,&quot;selection_glyph&quot;:{&quot;id&quot;:&quot;21076&quot;},&quot;view&quot;:{&quot;id&quot;:&quot;21054&quot;}},&quot;id&quot;:&quot;21053&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;21052&quot;}},&quot;id&quot;:&quot;21054&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Graph Interaction Demonstration&quot;},&quot;id&quot;:&quot;21039&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21093&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;21102&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{&quot;edge_renderer&quot;:{&quot;id&quot;:&quot;21053&quot;},&quot;inspection_policy&quot;:{&quot;id&quot;:&quot;21088&quot;},&quot;layout_provider&quot;:{&quot;id&quot;:&quot;21055&quot;},&quot;node_renderer&quot;:{&quot;id&quot;:&quot;21049&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;21086&quot;}},&quot;id&quot;:&quot;21046&quot;,&quot;type&quot;:&quot;GraphRenderer&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;end&quot;:[1,2,3,4,5,6,7,8,10,11,12,13,17,19,21,31,2,3,7,13,17,19,21,30,3,7,8,9,13,27,28,32,7,12,13,6,10,6,10,16,16,30,32,33,33,33,32,33,32,33,32,33,33,32,33,32,33,25,27,29,32,33,25,27,31,31,29,33,33,31,33,32,33,32,33,32,33,33],&quot;start&quot;:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,4,4,5,5,5,6,8,8,8,9,13,14,14,15,15,18,18,19,20,20,22,22,23,23,23,23,23,24,24,24,25,26,26,27,28,28,29,29,30,30,31,31,32]},&quot;selected&quot;:{&quot;id&quot;:&quot;21103&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;21104&quot;}},&quot;id&quot;:&quot;21052&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;21034&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21091&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;callback&quot;:null,&quot;tooltips&quot;:null},&quot;id&quot;:&quot;21040&quot;,&quot;type&quot;:&quot;HoverTool&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;21102&quot;}},&quot;id&quot;:&quot;21042&quot;,&quot;type&quot;:&quot;BoxSelectTool&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;club&quot;:[&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Mr. Hi&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;,&quot;Officer&quot;],&quot;index&quot;:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]},&quot;selected&quot;:{&quot;id&quot;:&quot;21105&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;21106&quot;}},&quot;id&quot;:&quot;21048&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;21035&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#2b83ba&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:15}},&quot;id&quot;:&quot;21056&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;line_color&quot;:{&quot;value&quot;:&quot;#abdda4&quot;},&quot;line_width&quot;:{&quot;value&quot;:5}},&quot;id&quot;:&quot;21081&quot;,&quot;type&quot;:&quot;MultiLine&quot;},{&quot;attributes&quot;:{&quot;plot_height&quot;:400,&quot;plot_width&quot;:400,&quot;renderers&quot;:[{&quot;id&quot;:&quot;21046&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;21039&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;21043&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;21034&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;21093&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;21035&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;21091&quot;}},&quot;id&quot;:&quot;21036&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21103&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;21086&quot;,&quot;type&quot;:&quot;NodesAndLinkedEdges&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#fdae61&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:15}},&quot;id&quot;:&quot;21061&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;21040&quot;},{&quot;id&quot;:&quot;21041&quot;},{&quot;id&quot;:&quot;21042&quot;}]},&quot;id&quot;:&quot;21043&quot;,&quot;type&quot;:&quot;Toolbar&quot;}],&quot;root_ids&quot;:[&quot;21036&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"d754c343-8369-4bd0-9573-74447acb83c4","root_ids":["21036"],"roots":{"21036":"966c408e-b3dd-4cc1-b2be-3cfd5a159d70"}}];
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