/* XXX: partial */
export class ImagePool {

  constructor() {
    this.images = [];
  }

  pop() {
    const img = this.images.pop();
    if (img != null) {
      return img;
    } else {
      return new Image();
    }
  }

  push(img) {

    if (this.images.length > 50) {
      return;
    }

    if (img.constructor === Array) {
      return Array.prototype.push.apply(this.images, img);
    } else {
      return this.images.push(img);
    }
  }
}
