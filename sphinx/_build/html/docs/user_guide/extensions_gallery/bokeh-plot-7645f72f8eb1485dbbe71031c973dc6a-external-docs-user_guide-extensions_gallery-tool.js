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
    
      
      
    
      var element = document.getElementById("89d60276-e8f6-4c5a-8fb3-7eaafbcfdab0");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '89d60276-e8f6-4c5a-8fb3-7eaafbcfdab0' but no matching script tag was found.")
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
          (function(root, factory) {
              factory(root["Bokeh"]);
          })(this, function(Bokeh) {
            var define;
            return (function outer(modules, entry) {
            if (Bokeh != null) {
              return Bokeh.register_plugin(modules, entry);
            } else {
              throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
            }
          })
          ({
            "custom/main": function(require, module, exports) {
              var models = {
                "DrawTool": require("custom/bokeh_app_375ef34155174bf6be3b13265a1d7053.draw_tool").DrawTool
              };
              require("base").register_models(models);
              module.exports = models;
            },
            "custom/bokeh_app_375ef34155174bf6be3b13265a1d7053.draw_tool": function(require, module, exports) {
          "use strict";
          var __importStar = (this && this.__importStar) || function (mod) {
              if (mod && mod.__esModule) return mod;
              var result = {};
              if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
              result["default"] = mod;
              return result;
          };
          Object.defineProperty(exports, "__esModule", { value: true });
          const gesture_tool_1 = require("models/tools/gestures/gesture_tool");
          const p = __importStar(require("core/properties"));
          class DrawToolView extends gesture_tool_1.GestureToolView {
              //this is executed when the pan/drag event starts
              _pan_start(_ev) {
                  this.model.source.data = { x: [], y: [] };
              }
              //this is executed on subsequent mouse/touch moves
              _pan(ev) {
                  const { frame } = this.plot_view;
                  const { sx, sy } = ev;
                  if (!frame.bbox.contains(sx, sy))
                      return;
                  const x = frame.xscales.default.invert(sx);
                  const y = frame.yscales.default.invert(sy);
                  const { source } = this.model;
                  source.get_array("x").push(x);
                  source.get_array("y").push(y);
                  source.change.emit();
              }
              // this is executed then the pan/drag ends
              _pan_end(_ev) { }
          }
          exports.DrawToolView = DrawToolView;
          DrawToolView.__name__ = "DrawToolView";
          class DrawTool extends gesture_tool_1.GestureTool {
              constructor(attrs) {
                  super(attrs);
                  this.tool_name = "Drag Span";
                  this.icon = "bk-tool-icon-lasso-select";
                  this.event_type = "pan";
                  this.default_order = 12;
              }
              static init_DrawTool() {
                  this.prototype.default_view = DrawToolView;
                  this.define({
                      source: [p.Instance],
                  });
              }
          }
          exports.DrawTool = DrawTool;
          DrawTool.__name__ = "DrawTool";
          DrawTool.init_DrawTool();
          //# sourceMappingURL=extensions_example_tool.py:DrawTool.js.map
          }
          }, "custom/main");
          ;
          });
    
        },
        
        function(Bokeh) {
          (function() {
            var fn = function() {
              Bokeh.safely(function() {
                (function(root) {
                  function embed_document(root) {
                    
                  var docs_json = '{&quot;610e8d4b-7c45-446f-b7c8-0897cd3c18e9&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20206&quot;}},&quot;id&quot;:&quot;20232&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20237&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20218&quot;}},&quot;id&quot;:&quot;20217&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20239&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;end&quot;:10},&quot;id&quot;:&quot;20211&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20215&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20235&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20206&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;20229&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;20230&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;20232&quot;}},&quot;id&quot;:&quot;20231&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:[],&quot;y&quot;:[]},&quot;selected&quot;:{&quot;id&quot;:&quot;20239&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20240&quot;}},&quot;id&quot;:&quot;20206&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20218&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;line_alpha&quot;:0.1,&quot;line_color&quot;:&quot;#1f77b4&quot;,&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;20230&quot;,&quot;type&quot;:&quot;Line&quot;},{&quot;attributes&quot;:{&quot;end&quot;:10},&quot;id&quot;:&quot;20209&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20240&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20217&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;20220&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20235&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20222&quot;}},&quot;id&quot;:&quot;20221&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20213&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20237&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;20217&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;20220&quot;},{&quot;id&quot;:&quot;20224&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;20221&quot;}],&quot;renderers&quot;:[{&quot;id&quot;:&quot;20231&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;20227&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;20225&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;20209&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;20213&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;20211&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;20215&quot;}},&quot;id&quot;:&quot;20208&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;20207&quot;}]},&quot;id&quot;:&quot;20225&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20222&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;line_color&quot;:&quot;#1f77b4&quot;,&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;20229&quot;,&quot;type&quot;:&quot;Line&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Drag to draw on the plot&quot;},&quot;id&quot;:&quot;20227&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20221&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;20224&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20206&quot;}},&quot;id&quot;:&quot;20207&quot;,&quot;type&quot;:&quot;DrawTool&quot;}],&quot;root_ids&quot;:[&quot;20208&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"610e8d4b-7c45-446f-b7c8-0897cd3c18e9","root_ids":["20208"],"roots":{"20208":"89d60276-e8f6-4c5a-8fb3-7eaafbcfdab0"}}];
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