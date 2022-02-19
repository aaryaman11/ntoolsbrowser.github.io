class SIMPLEVIEWER {
  constructor(element, dimensions, data) {

    this._element = element;
    this._dimensions = dimensions;
    this._data = data;
    this._slice_number = Math.floor(this._dimensions[2] / 2);

    return this.create_();

  }
  create_() {

    var ren3d = new X.renderer3D();
    ren3d.container = this._element;
    ren3d.init();
    ren3d.interactor.config.MOUSEWHEEL_ENABLED = false;
    ren3d.interactor.init();

    document.getElementById(this._element).onmousewheel = e => {
      if (e.wheelDelta < 0) {
        this._slice_number = Math.max(0, --this._slice_number);
      } else {
        this._slice_number = Math.min(this._dimensions[2] - 1, ++this._slice_number);
      }
      slice.texture.rawData = new Uint8Array(this._data[this._slice_number]);
      slice.modified();
      return false;
    }

    var slice = new X.slice();
    slice.width = slice.texture.rawDataWidth = this._dimensions[0];
    slice.height = slice.texture.rawDataHeight = this._dimensions[1];
    slice.texture.grayscale = true;
    slice.texture.rawData = new Uint8Array(this._data[this._slice_number]);
    slice.create();

    ren3d.add(slice);
    ren3d.camera.position = [0, 0, 200];
    ren3d.onclick = null
    ren3d.render();

    return ren3d;
  }
}


