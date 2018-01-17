/* XXX: partial */
import {Renderer, RendererView} from "../renderers/renderer";
import {logger} from "core/logging";
import * as p from "core/properties"

export class DynamicImageView extends RendererView {

  connect_signals(): void {
    super.connect_signals();
    this.connect(this.model.change, () => this.request_render())
  }

  get_extent() {
    return [this.x_range.start, this.y_range.start, this.x_range.end, this.y_range.end];
  }

  _set_data() {
    this.map_plot = this.plot_view.model.plot;
    this.map_canvas = this.plot_view.canvas_view.ctx;
    this.map_frame = this.plot_view.frame;
    this.x_range = this.map_plot.x_range;
    this.y_range = this.map_plot.y_range;
    this.lastImage = undefined;
    return this.extent = this.get_extent();
  }

  _map_data() {
    return this.initial_extent = this.get_extent();
  }

  _on_image_load(e) {
    const { image_data } = e.target;
    image_data.img = e.target;
    image_data.loaded = true;
    this.lastImage = image_data;

    if (this.get_extent().join(':') === image_data.cache_key) {
      return this.request_render();
    }
  }

  _on_image_error(e) {
    logger.error(`Error loading image: ${e.target.src}`);
    const { image_data } = e.target;
    return this.model.image_source.remove_image(image_data);
  }

  _create_image(bounds) {
    const image = new Image();
    image.onload = this._on_image_load.bind(this);
    image.onerror = this._on_image_error.bind(this);
    image.alt = '';
    image.image_data = {
      bounds,
      loaded : false,
      cache_key : bounds.join(':')
    };

    this.model.image_source.add_image(image.image_data);
    image.src = this.model.image_source.get_image_url(bounds[0], bounds[1], bounds[2], bounds[3], Math.ceil(this.map_frame._height.value), Math.ceil(this.map_frame._width.value));
    return image;
  }

  render(): void {
    if ((this.map_initialized == null)) {
      this._set_data();
      this._map_data();
      this.map_initialized = true;
    }

    const extent = this.get_extent();

    if (this.render_timer) {
      clearTimeout(this.render_timer);
    }

    const image_obj = this.model.image_source.images[extent.join(':')];
    if ((image_obj != null) && image_obj.loaded) {
      this._draw_image(extent.join(':'));
      return;
    }

    if (this.lastImage != null) {
      this._draw_image(this.lastImage.cache_key);
    }

    if ((image_obj == null)) {
      return this.render_timer = setTimeout((() => this._create_image(extent)), 125);
    }
  }

  _draw_image(image_key) {
    const image_obj = this.model.image_source.images[image_key];
    if (image_obj != null) {
      this.map_canvas.save();
      this._set_rect();
      this.map_canvas.globalAlpha = this.model.alpha;
      let [sxmin, symin] = this.plot_view.map_to_screen([image_obj.bounds[0]], [image_obj.bounds[3]]);
      let [sxmax, symax] = this.plot_view.map_to_screen([image_obj.bounds[2]], [image_obj.bounds[1]]);
      sxmin = sxmin[0];
      symin = symin[0];
      sxmax = sxmax[0];
      symax = symax[0];
      const sw = sxmax - sxmin;
      const sh = symax - symin;
      const sx = sxmin;
      const sy = symin;
      this.map_canvas.drawImage(image_obj.img, sx, sy, sw, sh);
      return this.map_canvas.restore();
    }
  }

  _set_rect() {
    const outline_width = this.plot_model.plot.properties.outline_line_width.value();
    const l = this.map_frame._left.value + (outline_width/2);
    const t = this.map_frame._top.value + (outline_width/2);
    const w = this.map_frame._width.value - outline_width;
    const h = this.map_frame._height.value - outline_width;
    this.map_canvas.rect(l, t, w, h);
    return this.map_canvas.clip();
  }
}

export class DynamicImageRenderer extends Renderer {
  static initClass() {
    this.prototype.default_view = DynamicImageView;
    this.prototype.type = 'DynamicImageRenderer';

    this.define({
        alpha:          [ p.Number, 1.0 ],
        image_source:   [ p.Instance    ],
        render_parents: [ p.Bool, true ]
      });

    this.override({
      level: 'underlay'
    });
  }
}
DynamicImageRenderer.initClass();
