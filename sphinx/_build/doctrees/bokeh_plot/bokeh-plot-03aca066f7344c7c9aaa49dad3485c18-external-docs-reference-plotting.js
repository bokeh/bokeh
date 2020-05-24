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
    
      
      
    
      var element = document.getElementById("b12d0a9b-c4da-4f22-84ed-1aec0ac466ca");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'b12d0a9b-c4da-4f22-84ed-1aec0ac466ca' but no matching script tag was found.")
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
    
        const hashes = {"https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js": "ufR9RFnRs6lniiaFvtJziE0YeidtAgBRH6ux2oUItHw5WTvE1zuk9uzhUU/FJXDp", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js": "8QM/PGWBT+IssZuRcDcjzwIh1mkOmJSoNMmyYDZbCfXJg3Ap1lEvdVgFuSAwhb/J", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js": "Jm8cH3Rg0P6UeZhVY5cLy1WzKajUT9KImCY+76hEqrcJt59/d8GPvFHjCkYgnSIn", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js": "Ozhzj+SI7ywm74aOI/UajcWz+C0NjsPunEVyVIrxzYkB+jA+2tUw8x5xJCbVtK5I"};
    
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
    
      
      var js_urls = ["https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js"];
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
                    
                  var docs_json = '{&quot;32df047e-4edd-4cdb-90c7-309ec387503e&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12272&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;12249&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null,&quot;visible&quot;:false},&quot;id&quot;:&quot;12252&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;12259&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;12261&quot;},&quot;hover_glyph&quot;:{&quot;id&quot;:&quot;12263&quot;},&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;12262&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;12265&quot;}},&quot;id&quot;:&quot;12264&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12250&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;12245&quot;},&quot;ticker&quot;:null,&quot;visible&quot;:false},&quot;id&quot;:&quot;12248&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;background_fill_color&quot;:&quot;#440154&quot;,&quot;below&quot;:[{&quot;id&quot;:&quot;12245&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;12248&quot;},{&quot;id&quot;:&quot;12252&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;12249&quot;}],&quot;match_aspect&quot;:true,&quot;renderers&quot;:[{&quot;id&quot;:&quot;12264&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;12268&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;12255&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;12237&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;12241&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;12239&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;12243&quot;}},&quot;id&quot;:&quot;12236&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12246&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12243&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.8},&quot;fill_color&quot;:{&quot;value&quot;:&quot;pink&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.8},&quot;line_color&quot;:{&quot;value&quot;:&quot;pink&quot;},&quot;q&quot;:{&quot;field&quot;:&quot;q&quot;},&quot;r&quot;:{&quot;field&quot;:&quot;r&quot;},&quot;size&quot;:0.5},&quot;id&quot;:&quot;12263&quot;,&quot;type&quot;:&quot;HexTile&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12239&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12254&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12253&quot;,&quot;type&quot;:&quot;WheelZoomTool&quot;},{&quot;attributes&quot;:{&quot;callback&quot;:null,&quot;tooltips&quot;:[[&quot;count&quot;,&quot;@c&quot;],[&quot;(q,r)&quot;,&quot;(@q, @r)&quot;]]},&quot;id&quot;:&quot;12266&quot;,&quot;type&quot;:&quot;HoverTool&quot;},{&quot;attributes&quot;:{&quot;high&quot;:16,&quot;low&quot;:0,&quot;palette&quot;:[&quot;#440154&quot;,&quot;#440255&quot;,&quot;#440357&quot;,&quot;#450558&quot;,&quot;#45065A&quot;,&quot;#45085B&quot;,&quot;#46095C&quot;,&quot;#460B5E&quot;,&quot;#460C5F&quot;,&quot;#460E61&quot;,&quot;#470F62&quot;,&quot;#471163&quot;,&quot;#471265&quot;,&quot;#471466&quot;,&quot;#471567&quot;,&quot;#471669&quot;,&quot;#47186A&quot;,&quot;#48196B&quot;,&quot;#481A6C&quot;,&quot;#481C6E&quot;,&quot;#481D6F&quot;,&quot;#481E70&quot;,&quot;#482071&quot;,&quot;#482172&quot;,&quot;#482273&quot;,&quot;#482374&quot;,&quot;#472575&quot;,&quot;#472676&quot;,&quot;#472777&quot;,&quot;#472878&quot;,&quot;#472A79&quot;,&quot;#472B7A&quot;,&quot;#472C7B&quot;,&quot;#462D7C&quot;,&quot;#462F7C&quot;,&quot;#46307D&quot;,&quot;#46317E&quot;,&quot;#45327F&quot;,&quot;#45347F&quot;,&quot;#453580&quot;,&quot;#453681&quot;,&quot;#443781&quot;,&quot;#443982&quot;,&quot;#433A83&quot;,&quot;#433B83&quot;,&quot;#433C84&quot;,&quot;#423D84&quot;,&quot;#423E85&quot;,&quot;#424085&quot;,&quot;#414186&quot;,&quot;#414286&quot;,&quot;#404387&quot;,&quot;#404487&quot;,&quot;#3F4587&quot;,&quot;#3F4788&quot;,&quot;#3E4888&quot;,&quot;#3E4989&quot;,&quot;#3D4A89&quot;,&quot;#3D4B89&quot;,&quot;#3D4C89&quot;,&quot;#3C4D8A&quot;,&quot;#3C4E8A&quot;,&quot;#3B508A&quot;,&quot;#3B518A&quot;,&quot;#3A528B&quot;,&quot;#3A538B&quot;,&quot;#39548B&quot;,&quot;#39558B&quot;,&quot;#38568B&quot;,&quot;#38578C&quot;,&quot;#37588C&quot;,&quot;#37598C&quot;,&quot;#365A8C&quot;,&quot;#365B8C&quot;,&quot;#355C8C&quot;,&quot;#355D8C&quot;,&quot;#345E8D&quot;,&quot;#345F8D&quot;,&quot;#33608D&quot;,&quot;#33618D&quot;,&quot;#32628D&quot;,&quot;#32638D&quot;,&quot;#31648D&quot;,&quot;#31658D&quot;,&quot;#31668D&quot;,&quot;#30678D&quot;,&quot;#30688D&quot;,&quot;#2F698D&quot;,&quot;#2F6A8D&quot;,&quot;#2E6B8E&quot;,&quot;#2E6C8E&quot;,&quot;#2E6D8E&quot;,&quot;#2D6E8E&quot;,&quot;#2D6F8E&quot;,&quot;#2C708E&quot;,&quot;#2C718E&quot;,&quot;#2C728E&quot;,&quot;#2B738E&quot;,&quot;#2B748E&quot;,&quot;#2A758E&quot;,&quot;#2A768E&quot;,&quot;#2A778E&quot;,&quot;#29788E&quot;,&quot;#29798E&quot;,&quot;#287A8E&quot;,&quot;#287A8E&quot;,&quot;#287B8E&quot;,&quot;#277C8E&quot;,&quot;#277D8E&quot;,&quot;#277E8E&quot;,&quot;#267F8E&quot;,&quot;#26808E&quot;,&quot;#26818E&quot;,&quot;#25828E&quot;,&quot;#25838D&quot;,&quot;#24848D&quot;,&quot;#24858D&quot;,&quot;#24868D&quot;,&quot;#23878D&quot;,&quot;#23888D&quot;,&quot;#23898D&quot;,&quot;#22898D&quot;,&quot;#228A8D&quot;,&quot;#228B8D&quot;,&quot;#218C8D&quot;,&quot;#218D8C&quot;,&quot;#218E8C&quot;,&quot;#208F8C&quot;,&quot;#20908C&quot;,&quot;#20918C&quot;,&quot;#1F928C&quot;,&quot;#1F938B&quot;,&quot;#1F948B&quot;,&quot;#1F958B&quot;,&quot;#1F968B&quot;,&quot;#1E978A&quot;,&quot;#1E988A&quot;,&quot;#1E998A&quot;,&quot;#1E998A&quot;,&quot;#1E9A89&quot;,&quot;#1E9B89&quot;,&quot;#1E9C89&quot;,&quot;#1E9D88&quot;,&quot;#1E9E88&quot;,&quot;#1E9F88&quot;,&quot;#1EA087&quot;,&quot;#1FA187&quot;,&quot;#1FA286&quot;,&quot;#1FA386&quot;,&quot;#20A485&quot;,&quot;#20A585&quot;,&quot;#21A685&quot;,&quot;#21A784&quot;,&quot;#22A784&quot;,&quot;#23A883&quot;,&quot;#23A982&quot;,&quot;#24AA82&quot;,&quot;#25AB81&quot;,&quot;#26AC81&quot;,&quot;#27AD80&quot;,&quot;#28AE7F&quot;,&quot;#29AF7F&quot;,&quot;#2AB07E&quot;,&quot;#2BB17D&quot;,&quot;#2CB17D&quot;,&quot;#2EB27C&quot;,&quot;#2FB37B&quot;,&quot;#30B47A&quot;,&quot;#32B57A&quot;,&quot;#33B679&quot;,&quot;#35B778&quot;,&quot;#36B877&quot;,&quot;#38B976&quot;,&quot;#39B976&quot;,&quot;#3BBA75&quot;,&quot;#3DBB74&quot;,&quot;#3EBC73&quot;,&quot;#40BD72&quot;,&quot;#42BE71&quot;,&quot;#44BE70&quot;,&quot;#45BF6F&quot;,&quot;#47C06E&quot;,&quot;#49C16D&quot;,&quot;#4BC26C&quot;,&quot;#4DC26B&quot;,&quot;#4FC369&quot;,&quot;#51C468&quot;,&quot;#53C567&quot;,&quot;#55C666&quot;,&quot;#57C665&quot;,&quot;#59C764&quot;,&quot;#5BC862&quot;,&quot;#5EC961&quot;,&quot;#60C960&quot;,&quot;#62CA5F&quot;,&quot;#64CB5D&quot;,&quot;#67CC5C&quot;,&quot;#69CC5B&quot;,&quot;#6BCD59&quot;,&quot;#6DCE58&quot;,&quot;#70CE56&quot;,&quot;#72CF55&quot;,&quot;#74D054&quot;,&quot;#77D052&quot;,&quot;#79D151&quot;,&quot;#7CD24F&quot;,&quot;#7ED24E&quot;,&quot;#81D34C&quot;,&quot;#83D34B&quot;,&quot;#86D449&quot;,&quot;#88D547&quot;,&quot;#8BD546&quot;,&quot;#8DD644&quot;,&quot;#90D643&quot;,&quot;#92D741&quot;,&quot;#95D73F&quot;,&quot;#97D83E&quot;,&quot;#9AD83C&quot;,&quot;#9DD93A&quot;,&quot;#9FD938&quot;,&quot;#A2DA37&quot;,&quot;#A5DA35&quot;,&quot;#A7DB33&quot;,&quot;#AADB32&quot;,&quot;#ADDC30&quot;,&quot;#AFDC2E&quot;,&quot;#B2DD2C&quot;,&quot;#B5DD2B&quot;,&quot;#B7DD29&quot;,&quot;#BADE27&quot;,&quot;#BDDE26&quot;,&quot;#BFDF24&quot;,&quot;#C2DF22&quot;,&quot;#C5DF21&quot;,&quot;#C7E01F&quot;,&quot;#CAE01E&quot;,&quot;#CDE01D&quot;,&quot;#CFE11C&quot;,&quot;#D2E11B&quot;,&quot;#D4E11A&quot;,&quot;#D7E219&quot;,&quot;#DAE218&quot;,&quot;#DCE218&quot;,&quot;#DFE318&quot;,&quot;#E1E318&quot;,&quot;#E4E318&quot;,&quot;#E7E419&quot;,&quot;#E9E419&quot;,&quot;#ECE41A&quot;,&quot;#EEE51B&quot;,&quot;#F1E51C&quot;,&quot;#F3E51E&quot;,&quot;#F6E61F&quot;,&quot;#F8E621&quot;,&quot;#FAE622&quot;,&quot;#FDE724&quot;]},&quot;id&quot;:&quot;12258&quot;,&quot;type&quot;:&quot;LinearColorMapper&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;12272&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;12246&quot;}},&quot;id&quot;:&quot;12245&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;12259&quot;}},&quot;id&quot;:&quot;12265&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12237&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;c&quot;:[1,1,1,2,1,1,1,3,3,1,1,1,1,6,4,3,1,1,1,2,6,6,4,6,1,1,1,1,8,2,6,7,7,10,5,3,1,1,4,5,10,11,10,14,10,2,3,4,6,11,16,9,10,4,5,1,2,1,3,3,7,9,13,12,8,6,2,2,1,4,6,11,13,9,9,4,3,2,2,2,1,1,4,9,5,11,10,5,7,1,2,1,1,1,3,1,3,3,6,3,2,2,1,1,1,3,1,5,1,1,4,1,2,1,2,1,3,2,1,2,1,2,1],&quot;q&quot;:[-7,-4,-3,-3,-2,-2,-2,-2,-2,-2,-2,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,9,9,9,9,9,10,10,11,11,11],&quot;r&quot;:[-2,-1,1,4,-4,-3,-2,0,1,2,5,-9,-5,-1,0,1,2,-7,-5,-3,-2,-1,0,1,2,4,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,-6,-5,-4,-3,-2,-1,0,1,2,-6,-5,-4,-3,-2,-1,0,1,2,3,-9,-7,-6,-5,-4,-3,-2,-1,0,1,2,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,-10,-9,-8,-7,-6,-5,-4,-3,-2,0,-12,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,-10,-8,-7,-6,-3,-9,-6,-8,-6,-4]},&quot;selected&quot;:{&quot;id&quot;:&quot;12274&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;12275&quot;}},&quot;id&quot;:&quot;12259&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12274&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12270&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;field&quot;:&quot;c&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;12258&quot;}},&quot;q&quot;:{&quot;field&quot;:&quot;q&quot;},&quot;r&quot;:{&quot;field&quot;:&quot;r&quot;},&quot;size&quot;:0.5},&quot;id&quot;:&quot;12261&quot;,&quot;type&quot;:&quot;HexTile&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12241&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;field&quot;:&quot;c&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;12258&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;q&quot;:{&quot;field&quot;:&quot;q&quot;},&quot;r&quot;:{&quot;field&quot;:&quot;r&quot;},&quot;size&quot;:0.5},&quot;id&quot;:&quot;12262&quot;,&quot;type&quot;:&quot;HexTile&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;12253&quot;},{&quot;id&quot;:&quot;12254&quot;},{&quot;id&quot;:&quot;12266&quot;}]},&quot;id&quot;:&quot;12255&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;&quot;},&quot;id&quot;:&quot;12268&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;12275&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;12270&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;12250&quot;}},&quot;id&quot;:&quot;12249&quot;,&quot;type&quot;:&quot;LinearAxis&quot;}],&quot;root_ids&quot;:[&quot;12236&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"32df047e-4edd-4cdb-90c7-309ec387503e","root_ids":["12236"],"roots":{"12236":"b12d0a9b-c4da-4f22-84ed-1aec0ac466ca"}}];
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