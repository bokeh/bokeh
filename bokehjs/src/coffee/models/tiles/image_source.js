/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as p from "core/properties";
import {Model} from "../../model"
;

export class ImageSource extends Model {
  static initClass() {
    this.prototype.type = 'ImageSource';

    this.define({
        url:            [ p.String, '' ],
        extra_url_vars: [ p.Any,    {} ]
      });
  }

  initialize(attrs, options) {
    super.initialize(attrs, options);
    this.images = {};
    return this.normalize_case();
  }

  normalize_case() {
    'Note: should probably be refactored into subclasses.';
    let { url } = this;
    url = url.replace('{xmin}','{XMIN}');
    url = url.replace('{ymin}','{YMIN}');
    url = url.replace('{xmax}','{XMAX}');
    url = url.replace('{ymax}','{YMAX}');
    url = url.replace('{height}','{HEIGHT}');
    url = url.replace('{width}','{WIDTH}');
    return this.url = url;
  }

  string_lookup_replace(str, lookup) {
    let result_str = str;
    for (let key in lookup) {
      const value = lookup[key];
      result_str = result_str.replace(`{${key}}`, value.toString());
    }
    return result_str;
  }

  add_image(image_obj) {
    return this.images[image_obj.cache_key] = image_obj;
  }

  remove_image(image_obj) {
    return delete this.images[image_obj.cache_key];
  }

  get_image_url(xmin, ymin, xmax, ymax, height, width) {
    const image_url = this.string_lookup_replace(this.url, this.extra_url_vars);
    return image_url.replace("{XMIN}", xmin).replace("{YMIN}", ymin).replace("{XMAX}", xmax).replace("{YMAX}", ymax).replace("{WIDTH}", width).replace("{HEIGHT}", height);
  }
}
ImageSource.initClass();
