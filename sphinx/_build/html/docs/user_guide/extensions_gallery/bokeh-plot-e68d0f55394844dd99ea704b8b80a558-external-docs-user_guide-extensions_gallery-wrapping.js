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
    
      
      
    
      var element = document.getElementById("aeec3910-3efa-4295-92f8-dd95a5080327");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'aeec3910-3efa-4295-92f8-dd95a5080327' but no matching script tag was found.")
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
                "Surface3d": require("custom/bokeh_app_7fb95b24daea4f5885658d5843f56e70.surface3d").Surface3d
              };
              require("base").register_models(models);
              module.exports = models;
            },
            "custom/bokeh_app_7fb95b24daea4f5885658d5843f56e70.surface3d": function(require, module, exports) {
          "use strict";
          // This custom model wraps one part of the third-party vis.js library:
          //
          //     http://visjs.org/index.html
          //
          // Making it easy to hook up python data analytics tools (NumPy, SciPy,
          // Pandas, etc.) to web presentations using the Bokeh server.
          var __importStar = (this && this.__importStar) || function (mod) {
              if (mod && mod.__esModule) return mod;
              var result = {};
              if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
              result["default"] = mod;
              return result;
          };
          Object.defineProperty(exports, "__esModule", { value: true });
          const layout_dom_1 = require("models/layouts/layout_dom");
          const layout_1 = require("core/layout");
          const p = __importStar(require("core/properties"));
          // This defines some default options for the Graph3d feature of vis.js
          // See: http://visjs.org/graph3d_examples.html for more details.
          const OPTIONS = {
              width: '600px',
              height: '600px',
              style: 'surface',
              showPerspective: true,
              showGrid: true,
              keepAspectRatio: true,
              verticalRatio: 1.0,
              legendLabel: 'stuff',
              cameraPosition: {
                  horizontal: -0.35,
                  vertical: 0.22,
                  distance: 1.8,
              },
          };
          // To create custom model extensions that will render on to the HTML canvas
          // or into the DOM, we must create a View subclass for the model.
          //
          // In this case we will subclass from the existing BokehJS ``LayoutDOMView``
          class Surface3dView extends layout_dom_1.LayoutDOMView {
              initialize() {
                  super.initialize();
                  const url = "https://cdnjs.cloudflare.com/ajax/libs/vis/4.16.1/vis.min.js";
                  const script = document.createElement("script");
                  script.onload = () => this._init();
                  script.async = false;
                  script.src = url;
                  document.head.appendChild(script);
              }
              _init() {
                  // Create a new Graph3s using the vis.js API. This assumes the vis.js has
                  // already been loaded (e.g. in a custom app template). In the future Bokeh
                  // models will be able to specify and load external scripts automatically.
                  //
                  // BokehJS Views create <div> elements by default, accessible as this.el.
                  // Many Bokeh views ignore this default <div>, and instead do things like
                  // draw to the HTML canvas. In this case though, we use the <div> to attach
                  // a Graph3d to the DOM.
                  this._graph = new vis.Graph3d(this.el, this.get_data(), OPTIONS);
                  // Set a listener so that when the Bokeh data source has a change
                  // event, we can process the new data
                  this.connect(this.model.data_source.change, () => {
                      this._graph.setData(this.get_data());
                  });
              }
              // This is the callback executed when the Bokeh data has an change. Its basic
              // function is to adapt the Bokeh data source to the vis.js DataSet format.
              get_data() {
                  const data = new vis.DataSet();
                  const source = this.model.data_source;
                  for (let i = 0; i < source.get_length(); i++) {
                      data.add({
                          x: source.data[this.model.x][i],
                          y: source.data[this.model.y][i],
                          z: source.data[this.model.z][i],
                      });
                  }
                  return data;
              }
              get child_models() {
                  return [];
              }
              _update_layout() {
                  this.layout = new layout_1.LayoutItem();
                  this.layout.set_sizing(this.box_sizing());
              }
          }
          exports.Surface3dView = Surface3dView;
          Surface3dView.__name__ = "Surface3dView";
          class Surface3d extends layout_dom_1.LayoutDOM {
              constructor(attrs) {
                  super(attrs);
              }
              static init_Surface3d() {
                  // This is usually boilerplate. In some cases there may not be a view.
                  this.prototype.default_view = Surface3dView;
                  // The @define block adds corresponding "properties" to the JS model. These
                  // should basically line up 1-1 with the Python model class. Most property
                  // types have counterparts, e.g. ``bokeh.core.properties.String`` will be
                  // ``p.String`` in the JS implementatin. Where the JS type system is not yet
                  // as rich, you can use ``p.Any`` as a "wildcard" property type.
                  this.define({
                      x: [p.String],
                      y: [p.String],
                      z: [p.String],
                      data_source: [p.Instance],
                  });
              }
          }
          exports.Surface3d = Surface3d;
          // The ``__name__`` class attribute should generally match exactly the name
          // of the corresponding Python class. Note that if using TypeScript, this
          // will be automatically filled in during compilation, so except in some
          // special cases, this shouldn't be generally included manually, to avoid
          // typos, which would prohibit serialization/deserialization of this model.
          Surface3d.__name__ = "Surface3d";
          Surface3d.init_Surface3d();
          //# sourceMappingURL=extensions_example_wrapping.py:Surface3d.js.map
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
                    
                  var docs_json = '{&quot;cb26a687-d6d6-425b-82ea-27dce53403fb&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20363&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAAAAAAAAoAAAAUAAAAHgAAACgAAAAyAAAAPAAAAEYAAABQAAAAWgAAAGQAAABuAAAAeAAAAIIAAACMAAAAlgAAAKAAAACqAAAAtAAAAL4AAADIAAAA0gAAANwAAADmAAAA8AAAAPoAAAAEAQAADgEAABgBAAAiAQAA&quot;,&quot;dtype&quot;:&quot;int32&quot;,&quot;shape&quot;:[900]},&quot;y&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAARgAAAEYAAABGAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAUAAAAFAAAABQAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAWgAAAFoAAABaAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAZAAAAGQAAABkAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAbgAAAG4AAABuAAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAjAAAAIwAAACMAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAqgAAAKoAAACqAAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAtAAAALQAAAC0AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAvgAAAL4AAAC+AAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA0gAAANIAAADSAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA3AAAANwAAADcAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA5gAAAOYAAADmAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAA+gAAAPoAAAD6AAAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAABAEAAAQBAAAEAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAADgEAAA4BAAAOAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAGAEAABgBAAAYAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAAIgEAACIBAAAiAQAA&quot;,&quot;dtype&quot;:&quot;int32&quot;,&quot;shape&quot;:[900]},&quot;z&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAASUApE+LUe/dNQDN6ioEjXlFAh408HduOU0CI/xIcindVQA2J3we1BFdAgElSa4YmWEDl5zZrcNFYQBWaE7Ki/lhAktyt+k+sWEBs6rlzwN1XQP+7BkEwm1ZA4H0AcHvxVEA9tEq5mvFSQOFW6Er2r1BArLVtBSuHTEDLKazNZ4pHQCZGXHWJnEJA/NvrAr3fO0ALEx4QOGgzQCAgsCrbUShAOIorCVKvGUBAgB+Y8lsDQICHT29UMNQ/AJBvpueLyD8AhYh+J24AQMCZ9CIfTxdAAK+Dpzq5JkAMICR7yW8yQB9hGJQXxTpAAAAAAAAASUAzeoqBI95NQI7L1oNMRVFA3rzOztZqU0BKC44SyElVQISkskMIz1ZAeTiLuRLrV0DL8bKOlJJYQDxi8jLgvlhAQMLmkjFuWEBJTNodwKNXQCY03fGdZ1ZAHrgofWXGVEBganTduNBSQIrHAB6YmlBAxmu+MSp1TEDn/WQ92pFHQOYLkScjvUJAqE9rfaVQPEAI9iFMVQQ0QJz1aJIM1ClAMAC40NcoHUCggiBQV/IKQGB5hhKx5PQ/AHZyDDL08j9AFihgfhMIQEjQJYfE1BpAhEbhQ5FDKEBLHO1z2hAzQHMQZWOiOztAAAAAAAAASUDyg8syHZNNQMR/CQ7F+1BAUUkoeTkAU0DaYW72VMJUQLa6OcQlMFZAzkwTZxY7V0DQskaBgthXQPYZhm8jAlhA8tEeVlC2V0D7CwoRD/hWQGdI/Fn1zlVApiBRX9tGVEBqy97hYm9SQGRJa6tXW1BAUNf4c98/TEDeTaOL5adHQJlfvoajHUNA0zFYmN6ePUBvt4G2c9I1QAjM71U7Sy5AJFHbYfm4I0BQ3knJCrQYQGDmN+Qy8xBA8CyCN4x+EEA4K/5KvVoXQDT/cErhoCJAyHHpg9zSLECgkzGKoe00QLRJa/yImjxAAAAAAAAASUBVhYiaZhlNQLw/t457hFBAwCSpNUNTUkC9+NMql+ZTQCQKzxljLlVADDX1i5UdVkD6dOZHpapWQIYic6Tyz1ZAsWOp7QCMVkARzkCSheFVQHr4fX5M11RAtFuyvvJ3U0Cp/0ctetFRQBPftPt06U9A4HS7sGrpS0D+OFK9qMtHQOVaPrAxukNA8yaTRhW9P0DUIS73JsA4QDTlOh7qxDJAGLs40tQQLECkI+///HUlQIA2FV61/CFADLoM1nHIIUAYECjOR9skQESf1eXYFStA/295jUkcMkBD5nLKHPM3QFHE+hvO0z5AAAAAAAAASUCG+6Lq2XVMQE7Px+liyE9AKO9iQNlqUUAKzQlZUb9SQBNzj/IG1FNATzKi+vGdVEDDpCGvBRVVQLS+CcaCNFVApR6V4Cf7VEAwUB1bPmtUQF3h9vaCilNAftd0TOthUkDS/61aSv1QQGvhdLSv1U5AwkAORT51S0DjgVbVtvtHQOJs3dmPjERA41Kp39VKQUC9VEyui688QF6ZUrXzojdAdM5E7WujM0A0gdRlwtkwQIjq32PVxC5AIDB8ELeYLkDaoTELdpgwQHX4VM98OTNACP1o+5oUN0CpoEIfdgI8QATIT+tf6EBAAAAAAAAASUD5ST9P/K5LQF5a+k2VQk5A8Y9EmD9QUEB/aR4ISVhRQDb13DngLlJAyuK7FXfLUkAJfMV4zydTQOKgQ+s6QFNANKt9M8ATU0DxMUtFJaRSQDMvFCnd9VFAfIXyktoPUUAUkc7ykfZPQFRhtf5dhk1Ab+4P2fvnSkCjdJlhJTZIQOR5wQRbjEVAxQO6DcsFQ0Cqjrs+PLxAQP09Vn0Njj1AA70Kskt0OkDjMT0f2Eo4QAj+Bz/DJzdAFjob0qcWN0B1CH9wNBg4QEHPr5MkIjpAJCkeYakfPUBk08oDH3lAQBnvFJxvuUJAAAAAAAAASUDYXldju8xKQI6aAJYYh0xADE9x3XQdTkA5cC/ynH9PQDbZSiu5T1BA8D4AuL24UEDp3t1RrPZQQIpoOeYMB1FALrT5TzjpUEA3inQBX55QQBDWRuF8KVBAgEANrHUeT0CnbD5vfqtNQBqeaRfeCExANpVAG0VHSkBu5noIoHhIQIcLdpVgr0ZAqLXTY8H9REBm+D71C3VDQHygFz3oJEJAtVCn17waQUDqHJ9FJmFAQLV2aD8V/z9Aau5IJ5zzP0C+s0wtK1BAQJIcJIEw/0BAgTzuz+P/QUBUswI9CUhDQHLnYcCLykRAAAAAAAAASUCUUMFGHNhJQIVTzvKap0pA5OqmVzZmS0B5LsojVQxMQK4Ddu5Xk0xAqqrZztz1TEDhVuhK9i9NQGvkJ21TP01AGo9gaFcjTUCasOrXH91MQIj2zVx5b0xA0A3nC8PeS0CFTajQwTBLQImgyYtlbEpAGJbURoKZSUAZLB1PgMBIQDMijWcG6kdAJwD7fKEeR0B8xy9ibWZGQBwqOw7CyEVA5F6xqehLRUAe87xn2/REQByVv7kSx0RADVLz42HERECMD4lc5OxEQJ4IY7P8PkVAVbuXDWW3RUCOUIWMUFFGQIz2jUucBkdAAAAAAAAASUCt9HaP39pIQOqgZwg6t0hA8jInOXuWSEBYfu1T8XlIQLYmDpy/YkhArdxdydJRSEBB0UWY10dIQOYU1uYzRUhApiwfpQJKSEAxcUXCElZIQEgSRCHpaEhAiwNpgcWBSECxQXIoqp9IQINFEwBmwUhAbDemv6DlSEDd0eal6ApJQLogojbBL0lABzTpZbJSSUDfMfeVV3JJQOWFyc5tjUlAhsxQnuCiSUAY19Ed1bFJQNIJ/KuyuUlAdS2kAim6SUDwpglqM7NJQFGu/OgYpUlArhz6b2mQSUCO/iIc+HVJQAi9oMzSVklAAAAAAAAASUBWUKbBHd9HQBrUz9W/yUZAXzSuBPXKRUAwK2ux5exEQFhX1S5sOERAT016Zbq0Q0CzmktlEGdDQH4ZPdCGUkNA//a6QO93Q0BWjnjuy9VDQDZ+4OZeaERAK0bPPdApRUCL+9OwaRJGQJTYTlzlGEdASYElX8wySEANLCun4VRJQLHjQqSUc0pAclKeT3eDS0Bv8oLSsnlMQEjUDCZ2TE1AGP7pQlrzTUA644/it2dOQG9vtmbrpE5As14SMoSoTkA4zBePXXJOQP66oCagBE5AifGH96tjTUAmiRWw65VMQOqk8DCTo0tAAAAAAAAASUBu31hG4O5GQMvj7L3Y8kRAWMwTTiogQ0BfDZbfb4lBQMlR13rgPkBAvSqGlVObPkAYK+M60349QJn5YH6XMz1AXPYsM6C8PUAHCKzKdhQ/QDnCAwuzlkBANXZLFgP5QUAO3atxC6NDQFA35g/Qg0VANc3TQyaIR0Adk4FdeJtJQMRdJ8CXqEtAGqLcEJWaTUDa9LPflV1PQFG1UaPPb1BAfvUltaYIUUA4S+dFOHNRQA0cU7REq1FAGQeV+Y+uUUBguVR3+HxRQLiH0U54GFFAuxNeMxGFUEDml1UMR5FPQFHMablk1U1AAAAAAAAASUB1k0b8uhNGQKvXnL5KRUNAy7zUmFOxQEDh5f8uSuQ8QMmWB/daPTlACjSdZR+TNkDt7k9JygA1QHbulc1lljRAoBOXxy9YNUAeXkNsbj43QAX4gSm/NTpAN7LAfdwfPkD7sV11aWpBQK7RMFlMEkRAJElCDnzsRkDt/s9c3NtJQIVRG8p4wkxALgA9ULaCT0AmjX7CQABRQMeF+ZE2EVJAfQHEx1rpUkDuHzF4D4BTQJoaIYxSz1NAFaaeEvvTU0C1qNqA2Y1TQJ1vYpe5/1JA5lo42UUvUkBRNQi4zSRRQAzoSofh1U9AAAAAAAAASUA++EN4alZFQHVsLtc10kFAiPwREIsuPUCj9YRpIo03QFx27p6o+TJA/LWiVaNFL0DY7p/wY1UrQPARDCXFSipAeKxYDWgwLECiA20meHkwQOiL/NPkMDRAkG+m54sYOUB6m8pMXv4+QM7DuXMV00JAZgMtcgJmRkCNB9x6fBNKQFWh5ez6tU1A3OQdnzKUUEBwCz7KxiNSQFHZ8ObLeVNAOLAEVZ+IVEDe0P0NdUVVQPWpfNbFqFVANbxmE5yuVUBQXKwyvFZVQOJ7QQunpFRAMpEMHHafU0D6ArMWk1FSQImdwplNyFBAAAAAAAAASUAA2efaer5EQNYesEFlqEBA9FQ45ubOOUABjQCA6UMzQKhznToy5StAdHNCY3YiJEAY1B3Qpx0fQLh8mcUAshxA7PG34lWNIEAACMvcVBUmQFj2IsmJuC5AJnUGo2YPNUA3k17k4+k7QHN/YT/l0kFAN4JT4BX6RUDQpUICIUBKQL5//O5oeU5ABVySGGk9UUAHMZDDvQ1TQOE1SY0vm1RAtKgqLebVVUA/OlCzVbFWQHtyQ5W+JFdAMmCK9oYrV0Bjj82dacVWQOZ9Vrd49lVA9iO8SPTGVEBs+cb99UJTQNAE4qn1eVFAAAAAAAAASUCZJmzJ+lFEQAwuq+1wpz9AJs5O8yhmN0AoGQKaXTQwQMSgZiX4tiRAeE8TmsVcGEAADL1VS5gMQDAo65aSRQdA2DN+ZNp7EEAAwgG+3qUcQIja3npY0idA055J4ZwtMkCY2P7U0rY5QAMIyV7yG0FA3SF3zwOtRUBq+nNUAmBKQIG8gUb4BE9AC4zwmz+2UUB0hp3b0bRTQGkAygnYaVVA6L+U6+XDVkBQSnC0L7VXQHrwXdMWNFhAqEWqH4w7WEDGgTR7Q8tXQHY3SNu251ZAHuYQmfiZVUDOJevbVu9TQAa4fM7T+FFAAAAAAAAASUAGvu2bPRVEQKrdxgJUuT5APvJ0oecMNkAIIwMMd/ssQGRmcMbrsSBAMMFNXlLqDkDAPaxVnIfzP8DoGU76r+A/4MgdEPG3/D/g2KWg4fUTQFQocVif9SNAstBnb5iQMECkG326nXs4QLIOlfqHtUBANoDp0t6BRUCROLYT23FKQMCSWJ0YU09AsghM5uT5UUBsWyriWRJUQHwQ6TmI3VVABqIPkSFJV0AldqILp0ZYQH0d1z79y1hAEBIIWNPTWEC87SRd2V1YQP7p7lzDbldATDl3bhkQVkC6pMZp1k9UQKHIfzrZP1JAAAAAAAAASUA8SPc3rwpEQD1Apevxjz5ACqF5lebQNUCMGFbV/2IsQCDlX/wm/h9AgBlxEPLRC0CAvVxwFvjpPwBmO3+DRrs/YIirFxpA9j/QAOg2XHMSQEyzQzTJSSNA+BBshdBIMECEFZOP1UQ4QAIGX1G7o0BAZyXUPl96RUCPGM4b9XRKQHCNzJmsYE9AwhjmlKYFUkC4kpdEmyJUQAj9b2mj8VVAucb2WUlgV0A0dXYb719YQLqXTJBj5lhAkcVRfEruWEBIesI5U3dYQJLvU/A7hldAmqikLaEkVkAi3AvNm2BUQMSK7BcxTFJAAAAAAAAASUAZ4uRZuzJEQNhToQLxLD9ARlrbNIq0NkCYESCdaaUuQIj4AZOQpSJAQJxEmwDIE0DQ1ZQBWOgCQMDyzCgo5Po/YPi6AfRkB0DQb8xNty0YQBD62s2v1SVAdh5NuiFZMUBeAa1tqRQ5QHOhCAxC50BAW55DmtGWRUBKeurEMGlKQFG3QagpLU9AwNAxqwzZUUBeuisc8ORTQPVIpWRcpVVAONDW83AIV0BO6KDeBQBYQEYd8Vg8glhA8v8GcuOJWEBnx4APrRZYQOM4eAoxLVdAZpLoTr7WVUCmjsrb+yBUQAotdW1dHVJAAAAAAAAASUCwYVlJyYtEQB7vf34HRUBAnLu3O7+uOEBESrGT0tUxQCxtkmxWiihAoOdKDyprIEBIQWzXB0IXQIj5qvOLuRRAcMoU0rpWGUC8t9WyPnUiQJDBPOdVfytAbG0uz7C2M0DeS8tC0OI6QAUZu/9qfUFAVvYekhPWRUAgPbcmBk9KQFaOgYGduk5ARX1mW951UUD7hj/LzVtTQIyNkqa9+1RAi2pP6RhFVkBKeFExvipXQIZQW8CFo1dAHR8g7J6qV0CNvrxCwT9XQDpqFW4vZ1ZA7R6euIspVUBP41Hvf5NTQKhIKiQ8tVFAAAAAAAAASUAEDZskTBJFQJGV5GWwTEFAOM7VW1erO0Bi6XCjNaE1QM7B1VGfuDBAqD+mClpHKkDsLrsI2g0mQIDnpk/c7yRAYHY8rMf4JkDU7mCp1xMsQELMq0F4BjJAK44cfFlJN0Aanvdg3Zw9QM76e6c5YEJAyrcujJ81RkBmCrZOgCdKQFaAQjWZDU5AaH3O4A/gUEByUM3lq4xSQJGo6U+K+1NAoDUN5AoeVUDE0gnLmOhVQCB6gMQgU1ZAIg8RkWNZVkDxwbRKIftVQJik4vAbPFVAI7t+DvEjVEDy2P0AzL1SQMfl9/nzF1FAAAAAAAAASUDiM4sc58BFQAQFBlTwokJA6liCM9eLP0DDRfoZJI46QKTSenK3fzZAd+WNTveJM0BEg0s3GcsxQEgUkd3tVDFAkbj+RyssMkCWK1++PEg0QNSkLl2akzdA8fx006TsO0D4myREfpNAQNBt7zyjhkNA3g4TZKaxRkAC+7maMvRJQNx20Y4CLU1AWhMIJZodUED8nnhlzH9RQIb4RyP5rlJAyhCkMQqfU0B2Nzx3bUZUQF6Rv5t2nlRA9BwVI6OjVEAs9TY/vlVUQNkSHuvit1NAml5COVzQUkCcvSQZZahRQIxoZSPKS1BAAAAAAAAASUD/92ovpJBGQMbKZ1AiOkRAyUAYs1YUQkAWIUaBLDVAQG1pshZ8Xz1AFTZzpCMnO0BKYsEn+Nc5QBnIdldWfzlArgTSxcYgOkD65XzQ2bU7QEhcKFBpLj5ATKettJ64QEA+HS72hq5CQAawuwDr5ERACbF6SzZFR0BXey6kKLdJQF2hh6/NIUxACLolmHtsTkBsu4Ji5z9QQDUHM0dMI1FAXPp2tlvXUUBkz1kC6FRSQEna0NXvllJAaHflSdGaUkDcbX7DZGBSQC6vlof+6VFAUBXE9VY8UUA27qlbWl5QQBmPAJrEsU5AAAAAAAAASUDkltwzO3lHQMUzfY4KAkZAZ7/sN2OpRECeUnSxAn1DQM9SQpriiEJAIPPyd77WQUB1PU9isG1BQFgpAYjoUUFAwHr6b4KEQUCwms2reQNCQODHVG6+yUJA6MyHNGnPQ0Bbu0RxCwpFQHVguQQabUZAfxzXQG3qR0BlV0hg0XJJQIC+gq2h9kpAg/F8KmhmTEB2ippbe7NNQIR6Y+uT0E5An4vRL1SyT0AvnQsV3idQQG61f7BCUVBAMSs6drFTUEBqMUWSES9QQKjgSJyxyU9AkH38U/nvTkCEPj9TqNlNQPJ/IRPXkUxAAAAAAAAASUDFOxJfZnFIQIOLYRt86EdAlkXZjLZqR0Ac8ehQGf1GQAMRDh4DpEZANPVXKgFjRkBOaxPsqjxGQCNUjqaHMkZAq8Hl0P5ERkCdzxD2U3NGQG85QTiuu0ZA6tvrKisbR0AdEBND/I1HQNEnYLGND0hA0AaHGbWaSECqXytK5ilJQIynPdtrt0lA8473cKE9SkAy9dpQLbdKQLAHBv02H0tAMMCMqJhxS0C4Vx2MCatLQDTc6Wo/yUtA5t6+8QXLS0BXW8ABS7BLQA+CWWkfektAjvT/A6wqS0AcIcqvG8VKQDG2yvl6TUpAAAAAAAAASUCg9ITnQG9JQJhNbl0S2klAO71dNDI8SkD/A3P5tpFKQIWT/uA310pANokuku8JS0DoC5du2CdLQKYD+DTBL0tABqmkLFkhS0BwYFldM/1KQK3jp7LAxEpAqHzMRkF6SkBjSAdrrSBKQHq24FeXu0lA/Gq0ugZPSUD3VnyUT99IQBswoA3mcEhAOKubATEISEApDGMSXalHQNk6BA4yWEdAxNNRWewXR0D/YV/pG+tGQLzL3ByK00ZAI+E1gCfSRkAb/o02AudGQDhvd2lFEUdAlSUnxUFPR0A3bIuqfp5HQEhKxmfT+0dAAAAAAAAASUDUEVz+q2hKQFgmgQD3wktAAQwIyhIBTUCkX3PEUBZOQDJ8k22j905AOao9JQ+cT0CPIRPbBf1PQGWwVvpUC1BAa6JrwfXnT0AVvTvpxXJPQKmj5GvGu05AJlDD8kLKTUAFI5pb3KdMQI+LW3QmYEtAoQbW0jEASkBtOyl+BpZIQKRa2roUMEdAUK0Lr6HcRUDg8MS+NalEQD7Yrm4SokNAqdzWTrXRQkDIRxHqbEBCQPBmq/4D9EFA8uqrYYbvQUAE9eznITNCQKKhW5IkvEJA4uYCEBiFQ0DATiN9+YVEQMUIZiaLtEVAAAAAAAAASUC4MfwYtlNLQDzQ9Wqsj01AwciWkBWdT0AaQhSff7NQQCw7WQSUbVFARgo821z1UUCO/6lVcEVSQCpgwzOdWlJAbTqiWAs0UkDScvtnRNNRQMeUqxQkPFFAAyVZwLB0UEBRkxf8uwlPQCxzj9Z27ExAAFzQNyanSkBNCjT59lBIQKO4lB/CAUZASqADeBnRQ0BleVcLV9VBQLCSl/+4IkBAgpjc/iWVPUAxw0XIOrU7QP3NwF3SuDpAoPXEzPypOkDxHPN6UYk7QF3Z8BzpTT1AnZWvlLjlP0Bug92LJJtBQL5bEiPjjkNAAAAAAAAASUBpvplsACdMQCHUEanULU9AOCSLb8z6UEC772pq9jBSQEaOhsMKLVNAnWVkx/zkU0Co2XUhd1FUQJaJ9bMmblRAxgEJu+Y5VECq8K94zLZTQABGYvIR6lJAXbZVmeDbUUAWzdP9/ZZQQMRjjL+7UE5A2Hbt/Ds9S0A12TvZ4RJIQPVPXbb78URAt4Tge3f6QUA3hKxxOZU+QNHaLTiv+zlAPi/HKUJXNkDs1nqIHs0zQPTqs5cvdzJACRVcFRdjMkDz5NsZopEzQElv6+rA9jVAeRKmFAJ6OUCUr43gi/c9QIuFPBzFoEFAAAAAAAAASUBoohWQHtpMQE0bXXB2RlBAaXWo9lX5UUBicP2TV3RTQCoadi1fqFRApl3ACSWJVUCj768lsw1WQEJ7u6jAMFZA0D8D1OfwVUDy1G9FtFBVQD0SWv2IVlRAEu7cL18MU0CUHhB7YH9RQNmdBSLBfk9A9+D3YHe8S0B/vBa6QN5HQEylhzWXC0RAxvEv935rQEB+8T8Z8EU6QByORJwJpzRARBnMwaczMEAMrmrybTIqQAg8LIDG7iZAoLSVyam9JkDQzqgKDaEpQDQ8IiN2ey9ATInJNpQINECyFmQ1Q4U5QDXVofnH+z9AAAAAAAAASUAyeCB07GVNQI5cKup6z1BAeWfPlAHAUkDan7O5vnBUQMQ/N9px0FVAMqTBixXRVkBD/wWRbmhXQN+lvUV0kFdAcE4iM45HV0BmYa1YpJBWQAZ96oIBc1VAdnoU3wj6U0Dp7wvDwTRSQDDdxUs+NVBAgOMu38UfTEAMrUO9LLVHQFJe6frDV0NAnzKOjC9oPkBw7fcYzug2QOov3qLofTBAvGtl1/zRJkBAgZ3lsXcfQHAZMRlxAxhAcME5wEqTF0CwTQBytyseQMwCZaKzxCVAoESeZPiRL0Dirt1P0Aw2QObkR6HlbT1A&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[900]}},&quot;selected&quot;:{&quot;id&quot;:&quot;20362&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20363&quot;}},&quot;id&quot;:&quot;20360&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20360&quot;},&quot;height&quot;:600,&quot;width&quot;:600,&quot;x&quot;:&quot;x&quot;,&quot;y&quot;:&quot;y&quot;,&quot;z&quot;:&quot;z&quot;},&quot;id&quot;:&quot;20361&quot;,&quot;type&quot;:&quot;Surface3d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20362&quot;,&quot;type&quot;:&quot;Selection&quot;}],&quot;root_ids&quot;:[&quot;20361&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"cb26a687-d6d6-425b-82ea-27dce53403fb","root_ids":["20361"],"roots":{"20361":"aeec3910-3efa-4295-92f8-dd95a5080327"}}];
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