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
    
      
      
    
      var element = document.getElementById("f4a45afc-4610-482f-8809-7655aadedee3");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'f4a45afc-4610-482f-8809-7655aadedee3' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;7a37906b-463a-4152-848b-0dad8131ad78&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17352&quot;}},&quot;id&quot;:&quot;17378&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17369&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17352&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17360&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;name&quot;:&quot;2015&quot;,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17361&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17363&quot;}},&quot;id&quot;:&quot;17362&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17338&quot;,&quot;type&quot;:&quot;PanTool&quot;},{&quot;attributes&quot;:{&quot;factors&quot;:[&quot;Apples&quot;,&quot;Pears&quot;,&quot;Nectarines&quot;,&quot;Plums&quot;,&quot;Grapes&quot;,&quot;Strawberries&quot;],&quot;range_padding&quot;:0.1},&quot;id&quot;:&quot;17325&quot;,&quot;type&quot;:&quot;FactorRange&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2017 imports&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17444&quot;}]},&quot;id&quot;:&quot;17456&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;17335&quot;},&quot;dimension&quot;:1,&quot;grid_line_color&quot;:null,&quot;ticker&quot;:null},&quot;id&quot;:&quot;17337&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#e34a33&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17403&quot;}},&quot;line_color&quot;:{&quot;value&quot;:&quot;#e34a33&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17404&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17410&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;,&quot;2016&quot;]},&quot;id&quot;:&quot;17357&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;17344&quot;}},&quot;id&quot;:&quot;17340&quot;,&quot;type&quot;:&quot;BoxZoomTool&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17352&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17389&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;name&quot;:&quot;2017&quot;,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17390&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17392&quot;}},&quot;id&quot;:&quot;17391&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;2015&quot;:[-1,0,-1,-3,-2,-1],&quot;2016&quot;:[-2,-1,-3,-1,-2,-2],&quot;2017&quot;:[-1,-2,-1,0,-2,-2],&quot;fruits&quot;:[&quot;Apples&quot;,&quot;Pears&quot;,&quot;Nectarines&quot;,&quot;Plums&quot;,&quot;Grapes&quot;,&quot;Strawberries&quot;]},&quot;selected&quot;:{&quot;id&quot;:&quot;17421&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;17422&quot;}},&quot;id&quot;:&quot;17402&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;17368&quot;},&quot;minor_tick_line_color&quot;:null,&quot;ticker&quot;:{&quot;id&quot;:&quot;17336&quot;}},&quot;id&quot;:&quot;17335&quot;,&quot;type&quot;:&quot;CategoricalAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17329&quot;,&quot;type&quot;:&quot;CategoricalScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17421&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;,&quot;2016&quot;,&quot;2017&quot;]},&quot;id&quot;:&quot;17408&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;17366&quot;},&quot;minor_tick_line_color&quot;:null,&quot;ticker&quot;:{&quot;id&quot;:&quot;17332&quot;}},&quot;id&quot;:&quot;17331&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#a8ddb5&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17355&quot;}},&quot;line_color&quot;:{&quot;value&quot;:&quot;#a8ddb5&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17356&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17375&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#43a2ca&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17353&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#43a2ca&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17354&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17361&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#e34a33&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17403&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#e34a33&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17404&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17411&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#fdbb84&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17405&quot;}},&quot;line_color&quot;:{&quot;value&quot;:&quot;#fdbb84&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17406&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17426&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;17331&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;17334&quot;},{&quot;id&quot;:&quot;17337&quot;},{&quot;id&quot;:&quot;17372&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;17335&quot;}],&quot;outline_line_color&quot;:null,&quot;plot_height&quot;:250,&quot;renderers&quot;:[{&quot;id&quot;:&quot;17362&quot;},{&quot;id&quot;:&quot;17377&quot;},{&quot;id&quot;:&quot;17391&quot;},{&quot;id&quot;:&quot;17412&quot;},{&quot;id&quot;:&quot;17428&quot;},{&quot;id&quot;:&quot;17444&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;17321&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;17345&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;17323&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;17327&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;17325&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;17329&quot;}},&quot;id&quot;:&quot;17320&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;,&quot;2016&quot;]},&quot;id&quot;:&quot;17406&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17332&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17352&quot;}},&quot;id&quot;:&quot;17392&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;17331&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;17334&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#fee8c8&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17407&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#fee8c8&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17408&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17443&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;,&quot;2016&quot;]},&quot;id&quot;:&quot;17407&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;2015&quot;:[2,1,4,3,2,4],&quot;2016&quot;:[5,3,4,2,4,6],&quot;2017&quot;:[3,2,4,4,5,3],&quot;fruits&quot;:[&quot;Apples&quot;,&quot;Pears&quot;,&quot;Nectarines&quot;,&quot;Plums&quot;,&quot;Grapes&quot;,&quot;Strawberries&quot;]},&quot;selected&quot;:{&quot;id&quot;:&quot;17369&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;17370&quot;}},&quot;id&quot;:&quot;17352&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17422&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17402&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17442&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;name&quot;:&quot;2017&quot;,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17443&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17445&quot;}},&quot;id&quot;:&quot;17444&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2015 imports&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17412&quot;}]},&quot;id&quot;:&quot;17424&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17402&quot;}},&quot;id&quot;:&quot;17429&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;,&quot;2016&quot;,&quot;2017&quot;]},&quot;id&quot;:&quot;17358&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;]},&quot;id&quot;:&quot;17404&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;end&quot;:16,&quot;start&quot;:-16},&quot;id&quot;:&quot;17323&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17402&quot;}},&quot;id&quot;:&quot;17445&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2016 imports&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17428&quot;}]},&quot;id&quot;:&quot;17440&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#e0f3db&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17357&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#e0f3db&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17358&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17390&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#43a2ca&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17353&quot;}},&quot;line_color&quot;:{&quot;value&quot;:&quot;#43a2ca&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17354&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17360&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17342&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17341&quot;,&quot;type&quot;:&quot;SaveTool&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[]},&quot;id&quot;:&quot;17403&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2015 exports&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17362&quot;}]},&quot;id&quot;:&quot;17373&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2017 exports&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17391&quot;}]},&quot;id&quot;:&quot;17401&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17402&quot;}},&quot;id&quot;:&quot;17413&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17370&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17366&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2016 exports&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17377&quot;}]},&quot;id&quot;:&quot;17387&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17336&quot;,&quot;type&quot;:&quot;CategoricalTicker&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17352&quot;}},&quot;id&quot;:&quot;17363&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17368&quot;,&quot;type&quot;:&quot;CategoricalTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17339&quot;,&quot;type&quot;:&quot;WheelZoomTool&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;]},&quot;id&quot;:&quot;17354&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[]},&quot;id&quot;:&quot;17353&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;]},&quot;id&quot;:&quot;17355&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;17338&quot;},{&quot;id&quot;:&quot;17339&quot;},{&quot;id&quot;:&quot;17340&quot;},{&quot;id&quot;:&quot;17341&quot;},{&quot;id&quot;:&quot;17342&quot;},{&quot;id&quot;:&quot;17343&quot;}]},&quot;id&quot;:&quot;17345&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;items&quot;:[{&quot;id&quot;:&quot;17373&quot;},{&quot;id&quot;:&quot;17387&quot;},{&quot;id&quot;:&quot;17401&quot;},{&quot;id&quot;:&quot;17424&quot;},{&quot;id&quot;:&quot;17440&quot;},{&quot;id&quot;:&quot;17456&quot;}],&quot;location&quot;:&quot;top_left&quot;},&quot;id&quot;:&quot;17372&quot;,&quot;type&quot;:&quot;Legend&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17352&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17375&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;name&quot;:&quot;2016&quot;,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17376&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17378&quot;}},&quot;id&quot;:&quot;17377&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17402&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17410&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;name&quot;:&quot;2015&quot;,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17411&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17413&quot;}},&quot;id&quot;:&quot;17412&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#a8ddb5&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17355&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#a8ddb5&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17356&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17376&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17343&quot;,&quot;type&quot;:&quot;HelpTool&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#e0f3db&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17357&quot;}},&quot;line_color&quot;:{&quot;value&quot;:&quot;#e0f3db&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17358&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17389&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;]},&quot;id&quot;:&quot;17405&quot;,&quot;type&quot;:&quot;Stack&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Fruit import/export, by year&quot;},&quot;id&quot;:&quot;17321&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17327&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#fee8c8&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17407&quot;}},&quot;line_color&quot;:{&quot;value&quot;:&quot;#fee8c8&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17408&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17442&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#fdbb84&quot;},&quot;height&quot;:{&quot;value&quot;:0.9},&quot;left&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17405&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#fdbb84&quot;},&quot;right&quot;:{&quot;expr&quot;:{&quot;id&quot;:&quot;17406&quot;}},&quot;y&quot;:{&quot;field&quot;:&quot;fruits&quot;}},&quot;id&quot;:&quot;17427&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17402&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17426&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;name&quot;:&quot;2016&quot;,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17427&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17429&quot;}},&quot;id&quot;:&quot;17428&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;17344&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{&quot;fields&quot;:[&quot;2015&quot;,&quot;2016&quot;]},&quot;id&quot;:&quot;17356&quot;,&quot;type&quot;:&quot;Stack&quot;}],&quot;root_ids&quot;:[&quot;17320&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"7a37906b-463a-4152-848b-0dad8131ad78","root_ids":["17320"],"roots":{"17320":"f4a45afc-4610-482f-8809-7655aadedee3"}}];
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