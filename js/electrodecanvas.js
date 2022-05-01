// inspired by https://github.com/rii-mango/NIFTI-Reader-JS/blob/master/tests/canvas.html

import { renderer } from "./sliceRenderer.js";
export class ElectrodeCanvas {
  electrodeData;
  defaultType;
  currentType;

  // for .nii parsing and access
  niftiBuffer;
  niftiHeader;
  niftiImage;
  dims;

  // axial/sagittal/coronal
  orientation;
  container;

  // subject name
  subject;

  // canvas where rendering will happen
  canvas;

  // 2D context for this canvas
  ctx;

  // maps slice# -> [electrodes at slice]
  sliceMap;

  // middle slice by default
  currentSlice;

  constructor(subject, orientation, container, transforms) {
    this.subject = subject;
    this.orientation = orientation || "axial";
    this.container = container || "sliceX";
    this.canvas = document.getElementById(`${this.container}`);
    this.ctx = this.canvas.getContext("2d");
    this.sliceMap = new Map();

    this.initData();
  }

  initData() {
    (async () => {
      this.electrodeData = await fetch(
        `../data/${this.subject}/JSON/${this.subject}.json`
      )
        .then((response) => response.json())
        .then((data) => {
          // side effect?
          this.currentType = data.SeizDisplay[0];
          return data.electrodes;
        });

      this.niftiBuffer = await fetch(
        `../data/${this.subject}/volume/${this.subject}_T1.nii`
      )
        .then((response) => response.blob())
        .then((content) => content.arrayBuffer())
        .then((buffer) => buffer);
      this.parseNifti(`${this.subject}`, this.niftiBuffer, this.electrodeData);
      // .catch((error) => console.log(error));
      this.initSliceMap();
      this.initEvents();
      this.drawCanvas();
    })();
  }

  parseNifti(name, data, electrodes) {
    if (nifti.isCompressed(data)) data = nifti.decompress(data);
    if (nifti.isNIFTI(data)) {
      this.niftiHeader = nifti.readHeader(data);
      this.niftiImage = nifti.readImage(this.niftiHeader, data);
      this.dims = this.niftiHeader.dims;
      this.currentSlice = Math.round(this.dims[1] / 2);
    }
  }

  initSliceMap() {
    const oldInterval = [(this.dims[1] - 1) / -2, (this.dims[1] - 1) / 2];
    const newInterval = [0, this.dims[1] - 1];
    for (const e of this.electrodeData) {
      const sliceIndex =
        this.orientation === "axial"
          ? Math.round(mapInterval(e.coordinates.z, oldInterval, newInterval))
          : this.orientation === "coronal"
          ? Math.round(mapInterval(e.coordinates.y, oldInterval, newInterval))
          : this.orientation === "sagittal"
          ? Math.round(mapInterval(e.coordinates.x, oldInterval, newInterval))
          : null;

      if (this.sliceMap.has(sliceIndex)) {
        const current = this.sliceMap.get(sliceIndex);
        current.push(e);
      } else {
        this.sliceMap.set(sliceIndex, [e]);
      }
    }
  }

  /*
   **/
  calculateOffset(row, col) {
    if (this.orientation === "axial")
      return (
        this.dims[1] ** 2 * (this.dims[1] - this.currentSlice) +
        this.dims[1] * row +
        col
      );
    if (this.orientation === "coronal")
      return (
        this.dims[1] ** 2 * row +
        this.dims[1] * (this.dims[1] - this.currentSlice) +
        col
      );
    if (this.orientation === "sagittal")
      return (
        this.dims[1] ** 2 * row +
        this.dims[1] * col +
        (this.dims[1] - this.currentSlice)
      );
  }

  drawCanvas() {
    // const coordinates = this.electrodeData.map((e) => e.coordinates);
    this.canvas.width = this.dims[1];
    this.canvas.height = this.dims[2];

    const typedData = new Uint8Array(this.niftiImage);
    const canvasImageData = this.ctx.createImageData(
      this.canvas.width,
      this.canvas.height
    );

    for (let row = 0; row < this.dims[1]; row++) {
      const rowOffset = row * this.dims[1];
      for (let col = 0; col < this.dims[1]; col++) {
        const offset = typedData.length - this.calculateOffset(row, col);
        const value = typedData[offset];

        canvasImageData.data[(rowOffset + col) * 4] = value & 0xff;
        canvasImageData.data[(rowOffset + col) * 4 + 1] = value & 0xff;
        canvasImageData.data[(rowOffset + col) * 4 + 2] = value & 0xff;
        canvasImageData.data[(rowOffset + col) * 4 + 3] = 0xff;
      }
    }

    this.ctx.putImageData(canvasImageData, 0, 0);

    if (this.sliceMap.has(this.currentSlice)) {
      const electrodesAtSlice = this.sliceMap.get(this.currentSlice);
      const previousElectrodes = this.sliceMap.get(this.currentSlice - 1);
      const nextElectrodes = this.sliceMap.get(this.currentSlice + 1);

      this.draw2DElectrodes(electrodesAtSlice);
      if (previousElectrodes) this.draw2DElectrodes(previousElectrodes);
      if (nextElectrodes) this.draw2DElectrodes(nextElectrodes);
    }
  }

  draw2DElectrodes(electrodes, size = 2) {
    const oldInterval = [(this.dims[1] - 1) / -2, (this.dims[1] - 1) / 2];
    const newInterval = [0, this.dims[1] - 1];
    for (const e of electrodes) {
      this.ctx.beginPath();
      const { x, y, z } = e.coordinates;
      let mappedX, mappedY;
      if (this.orientation === "axial") {
        mappedX = Math.round(mapInterval(x, oldInterval, newInterval));
        mappedY = Math.round(mapInterval(y, oldInterval, newInterval));
        this.ctx.arc(mappedX, this.dims[1] - mappedY, size, 0, 2 * Math.PI);
      } else if (this.orientation === "coronal") {
        mappedX = Math.round(mapInterval(x, oldInterval, newInterval));
        mappedY = Math.round(mapInterval(z, oldInterval, newInterval));
        this.ctx.arc(mappedX, this.dims[1] - mappedY, size, 0, 2 * Math.PI);
      } else if (this.orientation === "sagittal") {
        mappedX = Math.round(mapInterval(y, oldInterval, newInterval));
        mappedY = Math.round(mapInterval(z, oldInterval, newInterval));
        this.ctx.arc(
          this.dims[1] - mappedX,
          this.dims[1] - mappedY,
          size,
          0,
          2 * Math.PI
        );
      }

      this.ctx.stroke();
      this.ctx.fillStyle = getColor(e[this.currentType]);
      this.ctx.fill();
    }
  }

  initEvents() {
    this.canvas.onwheel = (e) => {
      if (e.ctrlKey) return;

      if (this.currentSlice < this.dims[1] && e.wheelDelta > 0) {
        this.currentSlice += 1;
        this.drawCanvas();
        return;
      }

      if (this.currentSlice > -1 && e.wheelDelta < 0) {
        this.currentSlice -= 1;
        this.drawCanvas();
        return;
      }
    };
  }

  rotate() {
    this.canvas.style.transform = "rotate(180deg)";
  }

  setSliceIndex(index) {
    this.currentSlice = index;
  }

  setSeizType(type) {
    this.currentType = type;
  }

  setData(newData) {
    this.electrodeData = newData
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
  
  // console.log(formattedType)
  const colors = {
    // seizure type X
    "": "#ffffff",
    "onset": "#ff0000",
    "very early spread": "#ffa600",
    "early spread": "#ffff00",
    "late spread": "#00ff30",
    "rapid spread": "#0000ff",
    "early onset": "#00ffff",

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

  return colors[formattedType];
};

const mapInterval = (input, inputRange, outputRange) => {
  const [inputStart, inputEnd] = inputRange;
  const [outputStart, outputEnd] = outputRange;
  return (
    outputStart +
    ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart)
  );
};


/*
        The following code for panning and zooming takes inspiration from
        https://betterprogramming.pub/implementation-of-zoom-and-pan-in-69-lines-of-javascript-8b0cb5f221c1
        //https://github.com/kwdowik/zoom-pan
      */

window.onload = function () {
  (() => {
    document.querySelectorAll(".container").forEach((c) => {
      const instance = renderer({
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

        instance.zoom({
          deltaScale: Math.sign(event.deltaY) > 0 ? -5 : 5,
          x: event.pageX,
          y: event.pageY,
        });
      });

      c.addEventListener("dblclick", () => {
        instance.panTo({
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
        instance.panBy({
          originX: event.movementX,
          originY: event.movementY,
        });
      });
    });
  })();
};
