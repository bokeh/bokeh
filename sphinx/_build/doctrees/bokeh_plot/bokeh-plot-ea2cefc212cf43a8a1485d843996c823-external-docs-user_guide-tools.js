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
    
      
      
    
      var element = document.getElementById("6b954b11-78f7-475c-91f5-bb09717c54e6");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '6b954b11-78f7-475c-91f5-bb09717c54e6' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;7bd5c081-5f4d-45be-83d0-0d4da410eda0&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;mantissas&quot;:[1,2,5],&quot;max_interval&quot;:500.0,&quot;num_minor_ticks&quot;:0},&quot;id&quot;:&quot;34014&quot;,&quot;type&quot;:&quot;AdaptiveTicker&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;34007&quot;}]},&quot;id&quot;:&quot;34001&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;axis_label&quot;:&quot;Price&quot;,&quot;axis_line_color&quot;:null,&quot;formatter&quot;:{&quot;id&quot;:&quot;34010&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;33998&quot;}},&quot;id&quot;:&quot;33997&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;months&quot;:[0,6]},&quot;id&quot;:&quot;34024&quot;,&quot;type&quot;:&quot;MonthsTicker&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;33981&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;34003&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;34004&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;34006&quot;}},&quot;id&quot;:&quot;34005&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;line_alpha&quot;:0.1,&quot;line_color&quot;:&quot;#ebbd5b&quot;,&quot;line_width&quot;:2,&quot;x&quot;:{&quot;field&quot;:&quot;date&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;adj close&quot;}},&quot;id&quot;:&quot;34004&quot;,&quot;type&quot;:&quot;Line&quot;},{&quot;attributes&quot;:{&quot;months&quot;:[0,4,8]},&quot;id&quot;:&quot;34023&quot;,&quot;type&quot;:&quot;MonthsTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34025&quot;,&quot;type&quot;:&quot;YearsTicker&quot;},{&quot;attributes&quot;:{&quot;days&quot;:[1,15]},&quot;id&quot;:&quot;34020&quot;,&quot;type&quot;:&quot;DaysTicker&quot;},{&quot;attributes&quot;:{&quot;months&quot;:[0,2,4,6,8,10]},&quot;id&quot;:&quot;34022&quot;,&quot;type&quot;:&quot;MonthsTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;33998&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;background_fill_color&quot;:&quot;#f5f5f5&quot;,&quot;below&quot;:[{&quot;id&quot;:&quot;33993&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;33996&quot;},{&quot;id&quot;:&quot;34000&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;33997&quot;}],&quot;plot_height&quot;:250,&quot;renderers&quot;:[{&quot;id&quot;:&quot;34005&quot;}],&quot;sizing_mode&quot;:&quot;scale_width&quot;,&quot;title&quot;:{&quot;id&quot;:&quot;33983&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;34001&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;33985&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;33989&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;33987&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;33991&quot;}},&quot;id&quot;:&quot;33982&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;adj close&quot;:[31.68,28.26,33.05,26.56,30.82,25.0,21.22,23.28,25.14,27.78,23.68,23.31,24.56,30.36,29.15,10.85,9.78,9.51,9.85,8.54,7.29,7.2,8.36,10.55,9.57,9.42,9.51,11.12,10.72,12.02,11.66,11.3,10.53,10.94,10.71,9.72,9.48,8.79,9.02,7.65,7.85,8.9,9.03,9.22,10.24,10.03,11.33,10.1,12.02,11.96,11.4,12.13,11.89,12.16,11.65,11.64,11.66,9.95,8.33,8.42,7.39,7.31,7.84,6.9,7.09,6.95,6.86,7.81,7.93,7.54,7.19,6.84,7.1,7.26,7.0,7.23,7.16,7.05,6.99,6.49,8.9,8.91,8.16,9.27,9.92,10.11,9.91,9.88,11.16,10.76,10.11,12.07,11.52,10.86,10.08,10.31,10.1,11.54,11.22,11.17,11.09,13.46,12.4,13.28,13.51,12.93,12.99,14.0,15.72,15.05,15.66,15.22,15.01,16.77,17.12,18.81,19.33,24.46,26.62,31.15,31.12,31.13,33.67,34.41,38.39,41.47,39.42,41.65,41.17,34.54,36.13,34.86,38.94,36.94,35.8,40.41,41.48,44.83,44.48,49.99,52.36,48.99,55.23,58.58,63.18,72.02,70.13,72.34,74.0,69.88,68.36,63.68,62.23,60.93,64.4,69.65,63.2,58.13,56.03,54.48,50.82,61.66,62.31,65.95,70.53,71.0,72.18,77.76,76.14,83.49,88.62,83.12,83.31,86.07,82.42,82.5,83.95,88.63,91.08,87.87,96.74,104.57,115.51,114.27,118.54,130.39,141.99,122.92,127.47,128.15,140.19,157.02,165.74,182.71,161.82,173.95,179.34,189.49,155.26,131.64,123.96,121.59,123.13,139.56,143.72,167.51,183.0,181.31,180.54,168.49,169.47,161.7,159.68,171.01,156.79,130.41,97.35,99.09,107.99,93.79,90.13,95.57,84.23,85.3,91.61,94.16,86.74,93.71,106.85,116.29,120.5,125.64,119.14,139.9,133.6,131.68,147.35,161.01,159.5,160.76,176.88,180.26,186.04,187.12,197.67,198.59,191.04,203.3,204.34,200.29,190.81,195.15,218.67,223.07,233.36,259.16,239.49,231.23,248.93,266.55,240.16,238.84,254.66,240.84,235.84,260.7,278.99,290.35,299.59,307.4,300.26,312.2,316.24,324.57,317.75,336.99,340.94,345.61,329.99,331.83,322.74,338.64,326.91,336.03,317.78,324.87,347.95,381.07,363.44,363.46,367.12,393.2,359.65,382.09,389.25,364.65,382.22,371.72,402.09,416.01,442.63,488.43,530.22,569.5,583.09,564.21,567.95,542.9,556.56,560.35,556.33,587.84,559.19,602.85,653.3,660.53,682.44,651.28,617.92,571.02,555.09,565.02,523.86,531.9,493.22,445.09,454.14],&quot;date&quot;:{&quot;__ndarray__&quot;:&quot;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&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[327]},&quot;volume&quot;:[38478000,15845200,8568800,33618800,11678000,17852400,14530800,9020000,7320400,14211000,14720600,6697200,4803800,10669000,9706200,72795600,21495600,31649000,14611200,17586200,12327200,10910000,15121000,30562800,9795600,12451000,15840600,19422200,16334800,11813600,11603200,10037200,11613600,12190400,10818600,15878000,6644800,7443800,7746600,20375600,12238800,5956800,7043000,8238000,6470200,6204000,18910600,20246200,16730200,9291800,12464000,8603600,7108800,10691800,9724600,9486000,5347000,12482000,10757200,7388600,14521200,11909800,7229600,8077800,7355200,7782000,16760600,10565600,5061200,5122600,5885000,5537200,6673600,13323000,8167400,5512200,11980200,4371200,3825000,7332800,21013800,7382800,9284000,10977200,9169200,7086600,8908600,4774600,9601000,10335600,8432600,21789400,9538600,10714400,8754600,6540600,3703400,17412400,10966800,9119400,9867000,35963000,15293400,9111400,12306600,9412800,7010600,14254000,13936200,12463600,11562400,7558200,11536400,13448600,8309600,9768200,41536000,42624800,18167000,49671000,26482200,8783200,79551800,30058200,18730600,43546200,36480400,19693400,14815200,33754700,16006300,22740100,13356200,19559800,14942500,24560100,20074300,32715600,9323500,16171300,19520100,18125200,21776900,22815400,18275400,30608200,17111000,16050800,40527100,24718700,20571400,32595200,21622900,29135400,28387300,27559400,33455000,45749200,31362000,30382300,44639500,26251600,24920000,23399700,31997200,23754000,16677100,22836200,15424600,16658000,25340600,25770600,30259300,48731200,22197500,14281000,29960700,25462900,17928300,26854300,19018700,34089800,52801600,61476900,34810600,25164600,78093900,40192700,30958500,51092000,40674300,33695400,46135000,35789800,49391300,34338200,36596200,38542100,79065900,48059800,34074900,44838600,41308600,27430900,30181700,28114800,29234400,28210900,40728600,22212400,31992000,37920300,28264600,18105400,26549500,59866200,57477300,70732900,58503200,66217400,10634800,37184800,24500000,28514200,30764500,24106200,22495300,27444900,22009000,18955600,19313000,16713000,10642800,33273300,22675500,16485600,31242200,14136100,15398300,16751000,26929400,19270900,13411100,29228100,15852500,10230500,17488200,17888900,16508200,66682500,22603100,16448800,21293500,21349300,20463900,28336600,45923600,45818400,27082300,28022200,24780100,36588500,15287700,11372500,13688900,14576800,36965800,19948000,14033200,13698000,18551700,11497700,9497200,10729600,26942900,11494300,29144900,19504400,14621500,16431600,21782100,11191000,16154800,19810100,14257000,12590900,15376200,21215500,26498900,31119500,20171900,19509900,19123500,22187300,10793900,13283500,12757500,8411800,9286500,9347800,6671300,33734000,15418300,29481700,26108500,37528100,18076600,12593800,13589600,15549300,9876300,16761500,31332600,8739500,20190100,13971300,12020300,13240200,17022300,18897700,29404200,19895300,22345900,12605900,16202800,19267300,13990900]},&quot;selected&quot;:{&quot;id&quot;:&quot;34026&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;34027&quot;}},&quot;id&quot;:&quot;33981&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;months&quot;:[0,1,2,3,4,5,6,7,8,9,10,11]},&quot;id&quot;:&quot;34021&quot;,&quot;type&quot;:&quot;MonthsTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34026&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;base&quot;:60,&quot;mantissas&quot;:[1,2,5,10,15,20,30],&quot;max_interval&quot;:1800000.0,&quot;min_interval&quot;:1000.0,&quot;num_minor_ticks&quot;:0},&quot;id&quot;:&quot;34015&quot;,&quot;type&quot;:&quot;AdaptiveTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34012&quot;,&quot;type&quot;:&quot;DatetimeTickFormatter&quot;},{&quot;attributes&quot;:{&quot;base&quot;:24,&quot;mantissas&quot;:[1,2,4,6,8,12],&quot;max_interval&quot;:43200000.0,&quot;min_interval&quot;:3600000.0,&quot;num_minor_ticks&quot;:0},&quot;id&quot;:&quot;34016&quot;,&quot;type&quot;:&quot;AdaptiveTicker&quot;},{&quot;attributes&quot;:{&quot;line_color&quot;:&quot;#ebbd5b&quot;,&quot;line_width&quot;:2,&quot;x&quot;:{&quot;field&quot;:&quot;date&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;adj close&quot;}},&quot;id&quot;:&quot;34003&quot;,&quot;type&quot;:&quot;Line&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Hover Tooltip Formatting&quot;},&quot;id&quot;:&quot;33983&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;days&quot;:[1,8,15,22]},&quot;id&quot;:&quot;34019&quot;,&quot;type&quot;:&quot;DaysTicker&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;33981&quot;}},&quot;id&quot;:&quot;34006&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;33985&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;days&quot;:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]},&quot;id&quot;:&quot;34017&quot;,&quot;type&quot;:&quot;DaysTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;33991&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;33987&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;num_minor_ticks&quot;:5,&quot;tickers&quot;:[{&quot;id&quot;:&quot;34014&quot;},{&quot;id&quot;:&quot;34015&quot;},{&quot;id&quot;:&quot;34016&quot;},{&quot;id&quot;:&quot;34017&quot;},{&quot;id&quot;:&quot;34018&quot;},{&quot;id&quot;:&quot;34019&quot;},{&quot;id&quot;:&quot;34020&quot;},{&quot;id&quot;:&quot;34021&quot;},{&quot;id&quot;:&quot;34022&quot;},{&quot;id&quot;:&quot;34023&quot;},{&quot;id&quot;:&quot;34024&quot;},{&quot;id&quot;:&quot;34025&quot;}]},&quot;id&quot;:&quot;33994&quot;,&quot;type&quot;:&quot;DatetimeTicker&quot;},{&quot;attributes&quot;:{&quot;days&quot;:[1,4,7,10,13,16,19,22,25,28]},&quot;id&quot;:&quot;34018&quot;,&quot;type&quot;:&quot;DaysTicker&quot;},{&quot;attributes&quot;:{&quot;axis_label&quot;:&quot;Date&quot;,&quot;axis_line_color&quot;:null,&quot;formatter&quot;:{&quot;id&quot;:&quot;34012&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;33994&quot;}},&quot;id&quot;:&quot;33993&quot;,&quot;type&quot;:&quot;DatetimeAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34027&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;33989&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;callback&quot;:null,&quot;formatters&quot;:{&quot;@date&quot;:&quot;datetime&quot;,&quot;@{adj close}&quot;:&quot;printf&quot;},&quot;mode&quot;:&quot;vline&quot;,&quot;tooltips&quot;:[[&quot;date&quot;,&quot;@date{%F}&quot;],[&quot;close&quot;,&quot;$@{adj close}{%0.2f}&quot;],[&quot;volume&quot;,&quot;@volume{0.00 a}&quot;]]},&quot;id&quot;:&quot;34007&quot;,&quot;type&quot;:&quot;HoverTool&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;33997&quot;},&quot;dimension&quot;:1,&quot;grid_line_color&quot;:&quot;white&quot;,&quot;ticker&quot;:null},&quot;id&quot;:&quot;34000&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;33993&quot;},&quot;grid_line_color&quot;:&quot;white&quot;,&quot;ticker&quot;:null},&quot;id&quot;:&quot;33996&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34010&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;}],&quot;root_ids&quot;:[&quot;33982&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"7bd5c081-5f4d-45be-83d0-0d4da410eda0","root_ids":["33982"],"roots":{"33982":"6b954b11-78f7-475c-91f5-bb09717c54e6"}}];
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