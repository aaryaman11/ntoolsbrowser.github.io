import { renderer } from "./sliceRenderer.js";
import { mapInterval } from "./mapInterval.js";

class ElectrodeCanvas {
  electrodeData;
  defaultType;
  currentType;

  // for .nii parsing and access
  volume;
  dims;

  // axial/sagittal/coronal
  orientation;
  container;
  brightness;
  windowLow;
  windowHigh;

  // canvas where rendering will happen
  canvas;
  ctx;
  showDetails;

  // maps slice# -> [electrodes at slice]
  sliceMap;
  oldInterval;
  newInterval;

  // middle slice by default
  currentSlice;

  relativeX;
  relativeY;
  relativeSlice;

  constructor(data, volume, container) {
    this.electrodeData = data.electrodes;
    this.currentType = data.SeizDisplay[0];
    this.container = container || "sliceX";
    this.canvas = document.getElementById(`${this.container}`);
    this.ctx = this.canvas.getContext("2d");
    this.brightness = 1;
    this.volume = volume;
    this.dims = volume.dimensions;
    this.showDetails = false;
    this.currentSlice = Math.round(this.dims[1] / 2);
    this.oldInterval = [
      -Math.ceil(this.dims[1] / 2),
      Math.floor(this.dims[1] / 2) - 1,
    ];
    this.newInterval = [0, this.dims[1] - 1];
    this.windowLow = 0;
    this.windowHigh = this.dims[1];
  }

  // draw a crosshair over the users selected target
  drawMark(x, y) {
    this.ctx.strokeStyle = "#98ff98";
    this.ctx.lineWidth = 0.5;

    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.canvas.width);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.height, y);
    this.ctx.stroke();
  }

  // methods for having the slice 'know' where the crosshair should be
  setRelativeCoordinates(x, y) {
    this.relativeX = x;
    this.relativeY = y;
  }

  setSliceIndex(index) {
    this.currentSlice = index;
  }

  setUserPosition(index) {
    this.relativeSlice = index;
  }

  // will tell the slice whether to draw intPopulation or SeizureType color map
  setSeizType(type) {
    this.currentType = type;
  }

  // update the slice data for initializing map
  setData(newData) {
    this.electrodeData = newData;
  }

  setBrightness(value) {
    this.brightness = value;
  }

  setWindowLow(value) {
    this.windowLow = value;
  }

  setWindowHigh(value) {
    this.windowHigh = value;
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }
} // end Class ElectrodeCanvas

// will add comments to this one since the others are the same, just with different x,y
export class SagittalCanvas extends ElectrodeCanvas {
  constructor(data, volume, container) {
    super(data, volume, container);
    this.initSliceMap();
    this.initEvents();
    this.drawCanvas();
  }

  // contains key value pairs of the slice index and the electrodes at that slice
  // the different canvases will use different coordinates
  initSliceMap() {
    this.sliceMap = new Map();
    for (const e of this.electrodeData) {
      const sliceIndex = Math.round(
        mapInterval(e.coordinates.x, this.oldInterval, this.newInterval)
      );
      if (this.sliceMap.has(sliceIndex)) {
        const current = this.sliceMap.get(sliceIndex);
        current.push(e);
      } else {
        this.sliceMap.set(sliceIndex, [e]);
      }
    }
  }

  // add the scroll wheel
  initEvents() {
    this.canvas.onwheel = (e) => {
      if (e.ctrlKey) return;

      // prevent going out of bounds
      if (this.currentSlice < this.dims[0] && e.wheelDelta > 0) {
        this.currentSlice += 1;
        this.volume.indexX += 1;
        this.drawCanvas();
        return;
      }
      if (this.currentSlice > -1 && e.wheelDelta < 0) {
        this.currentSlice -= 1;
        this.volume.indexX -= 1;
        this.drawCanvas();
        return;
      }
    }
  }

  // reset to the last place a user clicked
  resetPosition() {
    if (this.relativeSlice == null) return;
    this.currentSlice = this.relativeSlice;
    this.volume.indexX = this.relativeSlice;
  }

  // gets the offset of the data from the raw NIfTI data
  calculateOffset(row, col) {
    return (this.dims[0] ** 2) * row + this.dims[0] * col + (this.dims[0] - this.currentSlice);
  }

  drawCanvas() {
    this.canvas.width = this.dims[1];
    this.canvas.height = this.dims[2];

    // volume.K is XTK's nifti image buffer
    const typedData = this.volume.K;
    const canvasImageData = this.ctx.createImageData(
      this.canvas.width,
      this.canvas.height
    );

    // inspired by https://github.com/rii-mango/NIFTI-Reader-JS/blob/master/tests/canvas.html
    for (let row = 0; row < this.dims[0]; row++) {
      const rowOffset = row * this.dims[0];
      for (let col = 0; col < this.dims[0]; col++) {
        const offset = typedData.length - this.calculateOffset(row, col);
        let value = typedData[offset];
        if (value < this.windowLow) value = 0;
        if (value > this.windowHigh) value = 0xff;

        canvasImageData.data[(rowOffset + col) * 4] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 1] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 2] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 3] = 0xff;
      }
    }
    this.ctx.putImageData(canvasImageData, 0, 0);
    this.ctx.drawImage(this.canvas, 0, 0);

    if (this.sliceMap.has(this.currentSlice)) {
      const electrodesAtSlice = this.sliceMap.get(this.currentSlice);
      const previousElectrodes = this.sliceMap.get(this.currentSlice - 1);
      const nextElectrodes = this.sliceMap.get(this.currentSlice + 1);

      this.draw2DElectrodes(electrodesAtSlice);

      // also draw on the two adjacent slices
      if (!this.showDetails) {
        if (previousElectrodes) this.draw2DElectrodes(previousElectrodes, 1);
        if (nextElectrodes) this.draw2DElectrodes(nextElectrodes, 1);
      }

      // if the current scroll wheel selected slice passes the user selected slice, draw
      // the crosshair
      if (this.currentSlice === this.relativeSlice) {
        this.drawMark(this.relativeX, this.relativeY);
      }
    }

  }

  // draw the 2D electrodes over the current image in the current slice
  draw2DElectrodes(electrodes, size = 2) {
    // const canvas2 = document.createElement('canvas');
    // const ctx2 = canvas2.getContext("2d");

    for (const e of electrodes) {
      const mappedX = this.dims[0] - Math.round(mapInterval(e.coordinates.y, this.oldInterval, this.newInterval));
      const mappedY = this.dims[0] - Math.round(mapInterval(e.coordinates.z, this.oldInterval, this.newInterval));
      this.ctx.beginPath();
      this.ctx.arc(mappedX, mappedY, size, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.fillStyle = getColor(e[this.currentType]);
      this.ctx.fill();
    }

    // this.ctx.drawImage(canvas2, 0, 0);
  }
}

export class CoronalCanvas extends ElectrodeCanvas {
  constructor(data, volume, container) {
    super(data, volume, container);
    this.initSliceMap()
    this.initEvents();
    this.drawCanvas();
  }

  initSliceMap() {
    this.sliceMap = new Map();
    for (const e of this.electrodeData) {
      const sliceIndex = Math.round(
        mapInterval(e.coordinates.y, this.oldInterval, this.newInterval)
      );
      if (this.sliceMap.has(sliceIndex)) {
        const current = this.sliceMap.get(sliceIndex);
        current.push(e);
      } else {
        this.sliceMap.set(sliceIndex, [e]);
      }
    }
  }

  initEvents() {
    this.canvas.onwheel = (e) => {
      if (e.ctrlKey) return;

      if (this.currentSlice < this.dims[1] && e.wheelDelta > 0) {
        this.currentSlice += 1;
        this.volume.indexY += 1;
        this.drawCanvas();
        return;
      }
      if (this.currentSlice > -1 && e.wheelDelta < 0) {
        this.currentSlice -= 1;
        this.volume.indexY -= 1;
        this.drawCanvas();
        return;
      }
    }
  }

  resetPosition() {
    if (this.relativeSlice == null) return;
    this.currentSlice = this.relativeSlice;
    this.volume.indexY = this.relativeSlice;
  }

  calculateOffset(row, col) {
    return (this.dims[1] ** 2) * row + this.dims[1] * (this.dims[1] - this.currentSlice) + col;
  }

  drawCanvas() {
    this.canvas.width = this.dims[1];
    this.canvas.height = this.dims[2];

    // volume.K is XTK's nifti image buffer
    const typedData = this.volume.K;
    const canvasImageData = this.ctx.createImageData(
      this.canvas.width,
      this.canvas.height
    );

    // inspired by https://github.com/rii-mango/NIFTI-Reader-JS/blob/master/tests/canvas.html
    for (let row = 0; row < this.dims[1]; row++) {
      const rowOffset = row * this.dims[1];
      for (let col = 0; col < this.dims[1]; col++) {
        const offset = typedData.length - this.calculateOffset(row, col);
        let value = typedData[offset];
        if (value < this.windowLow) value = 0;
        if (value > this.windowHigh) value = 0xff;

        canvasImageData.data[(rowOffset + col) * 4] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 1] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 2] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 3] = 0xff;
      }
    }
    this.ctx.putImageData(canvasImageData, 0, 0);
    this.ctx.drawImage(this.canvas, 0, 0);

    if (this.sliceMap.has(this.currentSlice)) {
      const electrodesAtSlice = this.sliceMap.get(this.currentSlice);
      const previousElectrodes = this.sliceMap.get(this.currentSlice - 1);
      const nextElectrodes = this.sliceMap.get(this.currentSlice + 1);

      this.draw2DElectrodes(electrodesAtSlice);

      if (!this.showDetails) {
        if (previousElectrodes) this.draw2DElectrodes(previousElectrodes, 1);
        if (nextElectrodes) this.draw2DElectrodes(nextElectrodes, 1);
      }

      if (this.currentSlice === this.relativeSlice) {
        this.drawMark(this.relativeX, this.relativeY);
      }
    }
  }

  draw2DElectrodes(electrodes, size = 2, textOffset = 30) {
    for (const e of electrodes) {
      const mappedX = Math.round(mapInterval(e.coordinates.x, this.oldInterval, this.newInterval));
      const mappedY = this.dims[0] - Math.round(mapInterval(e.coordinates.z, this.oldInterval, this.newInterval));
      this.ctx.beginPath();
      this.ctx.arc(mappedX, mappedY, size, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.fillStyle = getColor(e[this.currentType]);
      this.ctx.fill();
    }
  }
}

export class AxialCanvas extends ElectrodeCanvas {
  constructor(data, volume, container) {
    super(data, volume, container);
    this.initSliceMap();
    this.initEvents();
    this.drawCanvas();
  }

  initSliceMap() {
    this.sliceMap = new Map();
    for (const e of this.electrodeData) {
      const sliceIndex = Math.round(
        mapInterval(e.coordinates.z, this.oldInterval, this.newInterval)
      );
      if (this.sliceMap.has(sliceIndex)) {
        const current = this.sliceMap.get(sliceIndex);
        current.push(e);
      } else {
        this.sliceMap.set(sliceIndex, [e]);
      }
    }
  }

  initEvents() {
    this.canvas.onwheel = (e) => {
      if (e.ctrlKey) return;

      if (this.currentSlice < this.dims[2] && e.wheelDelta > 0) {
        this.currentSlice += 1;
        this.volume.indexZ += 1;
        this.drawCanvas();
        return;
      }
      if (this.currentSlice > -1 && e.wheelDelta < 0) {
        this.currentSlice -= 1;
        this.volume.indexZ -= 1;
        this.drawCanvas();
        return;
      }
    }
  }

  resetPosition() {
    if (this.relativeSlice == null) return;
    this.currentSlice = this.relativeSlice;
    this.volume.indexZ = this.relativeSlice;
  }

  calculateOffset(row, col) {
    return (this.dims[2] ** 2) * (this.dims[2] - this.currentSlice) + this.dims[2] * row + col;
  }

  drawCanvas() {
    this.canvas.width = this.dims[1];
    this.canvas.height = this.dims[2];

    // volume.K is XTK's nifti image buffer
    const typedData = this.volume.K;
    const canvasImageData = this.ctx.createImageData(
      this.canvas.width,
      this.canvas.height
    );

    // inspired by https://github.com/rii-mango/NIFTI-Reader-JS/blob/master/tests/canvas.html
    for (let row = 0; row < this.dims[2]; row++) {
      const rowOffset = row * this.dims[2];
      for (let col = 0; col < this.dims[2]; col++) {
        const offset = typedData.length - this.calculateOffset(row, col);
        let value = typedData[offset];
        if (value < this.windowLow) value = 0;
        if (value > this.windowHigh) value = 0xff;

        canvasImageData.data[(rowOffset + col) * 4] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 1] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 2] =
          (value & 0xff) * this.brightness;
        canvasImageData.data[(rowOffset + col) * 4 + 3] = 0xff;
      }
    }
    this.ctx.putImageData(canvasImageData, 0, 0);
    this.ctx.drawImage(this.canvas, 0, 0);

    if (this.sliceMap.has(this.currentSlice)) {
      const electrodesAtSlice = this.sliceMap.get(this.currentSlice);
      const previousElectrodes = this.sliceMap.get(this.currentSlice - 1);
      const nextElectrodes = this.sliceMap.get(this.currentSlice + 1);

      this.draw2DElectrodes(electrodesAtSlice);

      if (!this.showDetails) {
        if (previousElectrodes) this.draw2DElectrodes(previousElectrodes, 1);
        if (nextElectrodes) this.draw2DElectrodes(nextElectrodes, 1);
      }

      if (this.currentSlice === this.relativeSlice) {
        this.drawMark(this.relativeX, this.relativeY);
      }
    }
  }

  draw2DElectrodes(electrodes, size = 2, textOffset = 30) {
    for (const e of electrodes) {
      const mappedX = Math.round(mapInterval(e.coordinates.x, this.oldInterval, this.newInterval));
      const mappedY = this.dims[1] - Math.round(mapInterval(e.coordinates.y, this.oldInterval, this.newInterval));
      this.ctx.beginPath();
      this.ctx.arc(mappedX, mappedY, size, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.fillStyle = getColor(e[this.currentType]);
      this.ctx.fill();
    }
  }
}

const getColor = (type) => {
  if (!type) {
    return "#ffffff";
  }
  const formattedType = type
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const colors = {
    // seizure type X
    "": "#ffffff",
    onset: "#ff0000",
    "very early spread": "#ffa600",
    "early spread": "#ffff00",
    "late spread": "#00ff30",
    "rapid spread": "#0000ff",
    "early onset": "#00ffff",
    "variable": "#ff69b4",

    // int pop
    0: "#ffffff",
    1: "#00ff30", // electric green
    2: "#0000ff", // blue
    3: "#ff00ff", // magenta
    4: "#00ffff", // cyan
    5: "#457533", // sap green
    6: "#662b91", // eminence
    7: "#c2c2c2", // silver sand
    8: "#758ca6", // shadow blue
  };

  return colors[formattedType] ?? "#ffffff";
};

/*
  The following code for panning and zooming takes inspiration from
  https://betterprogramming.pub/implementation-of-zoom-and-pan-in-69-lines-of-javascript-8b0cb5f221c1
  https://github.com/kwdowik/zoom-pan
*/

window.onload = function () {
  (() => {
    document.querySelectorAll(".container").forEach((c) => {
      const instanceForSlice = renderer({
        minScale: 0.1,
        maxScale: 30,
        element: c.children[0],
        scaleSensitivity: 500,
      });

      c.addEventListener("wheel", (event) => {
        if (!event.ctrlKey) {
          return;
        }
        event.preventDefault();

        instanceForSlice.zoom({
          deltaScale: Math.sign(event.deltaY) > 0 ? -15 : 15,
          x: event.pageX,
          y: event.pageY,
        });
      });

      c.addEventListener("dblclick", () => {
        instanceForSlice.panTo({
          originX: 0,
          originY: 0,
          scale: 1,
        });
      });

      c.addEventListener("mousemove", (event) => {
        if (!event.buttons) {
          return;
        }
        event.preventDefault();
        instanceForSlice.panBy({
          originX: event.movementX,
          originY: event.movementY,
        });
      });
    });

    const editMenu = document.getElementById("edit-menu")
    const instanceForEdit = renderer({
      minScale: 0.1,
      maxScale: 30,
      element: editMenu,
      scaleSensitivity: 500,
    });


    editMenu.addEventListener("mousemove", (event) => {
      if (!event.buttons) {
        return;
      }
      event.preventDefault();
      instanceForEdit.panBy({
        originX: event.movementX,
        originY: event.movementY,
      });
    })
  })();
};
