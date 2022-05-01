// This file contains functions for formatting json data and displaying graphical
// representations. can possibly revise if we do not want to keep it in that format,
// and just use indices directly

import { mapInterval } from "./mapInterval.js";
import { getSeizTypeColor } from "./color.js";
import { DOMNodes } from "./DOMtree.js";
import { GFX } from "./gfx.js";
import { ElectrodeCanvas } from "./electrodecanvas.js"

// be mindful that NONE occupies index 0
const getCurrentSelectedIndex = () => {
  const { electrodeMenu } = DOMNodes;
  return electrodeMenu.selectedIndex;
};

const updateSliceLocation = (sliderControllers, volume, electrode, slices) => {
  const numSlices = volume.dimensions[0];

  // e.g. [-128, 127] for a volume w/ 256 dimensions
  const startRange = [
    -(Math.ceil(numSlices / 2)), Math.floor(numSlices / 2) - 1
  ];
  // console.log(-(Math.ceil(numSlices / 2)), Math.floor(numSlices / 2) - 1)
  // const startRange = [-128, 127]
  const endRange = [0, numSlices - 1];
  const { x, y, z } = electrode.coordinates;

  const [xSlice, ySlice, zSlice] = [x, y, z].map((coordinate) =>
    Math.round(mapInterval(coordinate, startRange, endRange))
  );

  const [xCanvas, yCanvas, zCanvas] = slices;
  

  const xSlider = sliderControllers.find(
    (controller) => controller.property === "indexX"
  );
  const ySlider = sliderControllers.find(
    (controller) => controller.property === "indexY"
  );
  const zSlider = sliderControllers.find(
    (controller) => controller.property === "indexZ"
  );

  // move to the index property that matches with the slice number of the electrode
  volume.visible = !volume.visible;

  xSlider.object.indexX = xSlice;
  ySlider.object.indexY = ySlice;
  zSlider.object.indexZ = zSlice;

  xCanvas.setSliceIndex(xSlice);
  xCanvas.setRelativeCoordinates(numSlices - ySlice, numSlices - zSlice);
  xCanvas.drawCanvas();

  yCanvas.setSliceIndex(ySlice);
  yCanvas.setRelativeCoordinates(xSlice, numSlices - zSlice);
  yCanvas.drawCanvas();

  zCanvas.setSliceIndex(zSlice);
  zCanvas.setRelativeCoordinates(xSlice, numSlices - ySlice)
  zCanvas.drawCanvas();

  volume.visible = !volume.visible;
};

// function for adding options based on electrode IDs and jumping slices when one is
// selected
// TODO: SPLIT INTO TWO FUNCTIONS AT LEAST
/**
 *
 * @param {array} elObjects
 * @param {array} idArray
 * @param {array} selectionSpheres
 * @param {JSON} data
 * @param {X.volume} volume
 */
const initializeElectrodeIDMenu = (
  data,
  selectionSpheres,
  volumeGUI,
  volume,
  slices
) => {
  const { electrodeMenu } = DOMNodes;

  electrodeMenu.addEventListener("change", (event) => {
    const id = event.target.value;
    const index = data.electrodes.findIndex((e) => e.elecID === id);
    const res = data.electrodes.find((e) => e.elecID === id);

    printElectrodeInfo(res, index, selectionSpheres, data);
    if (id !== "None" && res)
      updateSliceLocation(volumeGUI.__controllers, volume, res, slices);
  });
  // append HTML option to drop down menu
  for (const entry of data.electrodes) {
    const newOption = document.createElement("option");
    newOption.value = entry.elecID;
    newOption.innerText = entry.elecID;
    electrodeMenu.appendChild(newOption);
  }
};

/**
 *
 * @param {JSON} data
 * @param {array} spheres
 * @param {array} fmaps
 */
const initSeizureTypeMenu = (data, spheres, fmaps, slices) => {
  const seizureTypes = data.SeizDisplay;
  const { seizTypeMenu } = DOMNodes;

  // make ALL fmaps visible if user selects "Fun Mapping"
  seizTypeMenu.addEventListener("change", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const selectedType = event.target.value;

    const selectedSeizType = getAttributeArray(data.electrodes, selectedType);
    spheres.forEach((sphere, index) => {
      sphere.color = getSeizTypeColor(selectedSeizType[index]);
    });
    
    slices.forEach(s => s.setSeizType(selectedType))
    slices.forEach(s => s.drawCanvas());
    const index = getCurrentSelectedIndex() - 1
    updateLabels(data.electrodes[index], index, data);
  });

  // create the menu options for all of patients seizure types
  seizureTypes.slice(0, seizureTypes.length - 1).forEach((type) => {
    const newOption = document.createElement("option");
    newOption.value = type;
    newOption.innerText = type;
    seizTypeMenu.appendChild(newOption);
  });
};

/**
 *
 * @param {array} data - electrode data
 * @param {array} connections - the X.cylinders
 * @param {array} fmapHighlights - the X.cylinders which highlight
 */
const addEventsToFmapMenu = (data, connections, fmapHighlights) => {
  const { fmapMenu, fmapCaption } = DOMNodes;
  fmapMenu.addEventListener("change", (event) => {
    const selected = getAttributeArray(data.functionalMaps, event.target.value);
    if (selected !== "None") {
      GFX.redrawFmaps(connections, selected);
      fmapCaption.innerText = "No Functional Mapping Selected";
    } else {
      fmaps.forEach((fmap) => (fmap.visible = false));
    }
    fmapHighlights.forEach((fmap) => (fmap.visible = false));
  });
};

// find the electrode in the options and display the info on the panel
/**
 *
 *  @param {object} selectedElectrode
 * @param {number} index - index in the data
 * @param {array} selectionSpheres - opaque blue spheres that surround an electrode
 * @param {JSON} data
 */
const printElectrodeInfo = (
  selectedElectrode,
  index,
  selectionSpheres,
  data
) => {
  if (selectedElectrode) {
    updateLabels(selectedElectrode, index, data);
    GFX.highlightSelectedElectrode(selectionSpheres, index);
  } else {
    console.log(`Could not find electrode with ID of ${ID}`);
  }
};

// changes the mosue to a crosshair for responsive selection
const addMouseHover = (renderer) => {
  renderer.interactor.onMouseMove = (e) => {
    let hoverObject = renderer.pick(e.clientX, e.clientY);
    if (hoverObject !== 0) {
      let selectedSphere = renderer.get(hoverObject);
      if (selectedSphere.g === "sphere" || selectedSphere.g === "cylinder") {
        document.body.style.cursor = "crosshair";
      } else {
        selectedSphere.visible = true;
        selectedSphere = null;
        hoverObject = 0;
      }
    } else {
      document.body.style.cursor = "auto";
    }
  };
};
/**
 *
 * @param {object} electrode - the selected electrode object
 * @param {number} index
 * @param {JSON} data - the JSON
 *
 * It might be a bit foolish to have the data in two different formats like this. It would
 * be better if we could have it all as one form, but there are times when having the ready
 * made arrays from the JSON is very useful
 */

const updateLabels = (electrode, index, data) => {
  const { electrodeMenu } = DOMNodes;
  if (electrodeMenu.selectedIndex === 0) {
    return;
  }
  const { elecID, elecType, intPopulation, coordinates } = electrode;
  const { x, y, z } = coordinates;

  const {
    seizTypeMenu,
    intPopulationLabel,
    seizTypeLabel,
    IDLabel,
    elecTypeLabel,
    coordinateLabel,
  } = DOMNodes;

  const selectedSeizType = seizTypeMenu.selectedOptions[0].value;
  const seizureTypeValues = getAttributeArray(
    data.electrodes,
    selectedSeizType
  );

  IDLabel.innerText = elecID;
  elecTypeLabel.innerText = elecType;
  coordinateLabel.innerText = `(${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)})`;

  if (selectedSeizType === "intPopulation") {
    intPopulationLabel.innerText = intPopulation;
    seizTypeLabel.innerText = "";
  } else {
    const currentElecSeizType = seizureTypeValues[index];
    const editOption = document.getElementById('seiz-type-edit');
    if (editOption)
      editOption.value = currentElecSeizType;
    seizTypeLabel.innerText = currentElecSeizType;
    intPopulationLabel.innerText = "";
  }
};

/**
 *
 * @param {JSON} data               - Original JSON data
 * @param {X.renderer3D} renderer   - The main renderer
 * @param {object} datGUI           - GUI controller
 * @param {array} spheres           - Array of X.spheres that represent electrodes
 * @param {array} selections        - Opaque blue spheres that highlight an electrode
 * @param {array} fmaps             - Array of X.cylinders
 * @param {array} fmapHighlights    - Opaque blue cylinders that surround fmaps
 * @param {X.volume} volumeRendered - The volume displayed on slices
 *
 * This function is responsible for way too much. Would be good to find a way to break
 * it down into more reasonable components. It adds an event listener to the canvas,
 * does object picking, highlights an electrode, jumps the slices, and displays
 * captions on the panel
 */

const jumpSlicesOnClick = (
  data,
  renderer,
  datGUI,
  spheres,
  selections,
  fmapConnections,
  fmapHighlights,
  volumeRendered,
  slices
) => {
  // get the main canvas
  const { canvases, electrodeMenu, fmapCaption } = DOMNodes;
  canvases[0].addEventListener("click", (e) => {
    // need to handle mouse dragging event too
    const clickedObject = renderer.pick(e.clientX, e.clientY);
    // check if it actually has an ID
    if (clickedObject !== 0) {
      const selectedObject = renderer.get(clickedObject);
      // ".g" is an object property that corresponds to the selected X.object's name
      if (selectedObject.g === "sphere") {
        // find the actual electrode in the array of XTK spheres
        const sphereIndex = spheres.indexOf(selectedObject);

        if (sphereIndex >= 0) {
          const target = data.electrodes[sphereIndex];

          // highlight and show the needed captions on the menu
          GFX.highlightSelectedElectrode(selections, sphereIndex);
          
          // sync with electrode menu options
          const electrodeIDMenuOptions = electrodeMenu.options;
          electrodeIDMenuOptions.selectedIndex = sphereIndex + 1;
          updateLabels(target, sphereIndex, data);

          updateSliceLocation(datGUI.__controllers, volumeRendered, target, slices);
        }
      } else if (selectedObject.g === "cylinder") {
        const cylinderIndex = fmapConnections.indexOf(selectedObject);
        if (cylinderIndex >= 0) {
          fmapCaption.innerText = selectedObject.caption;
          GFX.highlightSelectedFmap(fmapHighlights, cylinderIndex);
        }
      }
    }
  }); // end of event listener
};

const setupEditMenu = (renderer, data, spheres, selectionSpheres, slices) => {
  const { canvases, electrodeMenu } = DOMNodes;
  canvases[0].addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const clickedObject = renderer.pick(e.clientX, e.clientY);
    if (clickedObject !== 0) {
      const selectedObject = renderer.get(clickedObject);
      const objectIndex = spheres.indexOf(selectedObject);
      const selectedElectrode = data.electrodes[objectIndex];
      const menu = document.getElementById("edit-menu");

      menu.innerHTML = insertMenuHTML(selectedElectrode);
      menu.style.display = "grid";
      menu.style.left = `${e.pageX}px`;
      menu.style.top = `${e.pageY}px`;

      document.getElementById('seiz-type-edit').value = selectedElectrode[getSelectedSeizType()];
      document.getElementById('int-pop-edit').value = selectedElectrode.intPopulation;

      GFX.highlightSelectedElectrode(selectionSpheres, objectIndex);
      updateLabels(selectedElectrode, objectIndex, data);
      electrodeMenu.options.selectedIndex = objectIndex + 1;

      document.getElementById("edit-btn").addEventListener("click", () => {
        const type = getSelectedSeizType();
        editElectrode(data, objectIndex, type);

        spheres.forEach((sphere, index) => {
          sphere.color = getSeizTypeColor(data.electrodes[index][type]);
        });
        slices.forEach(s => s.setData(data.electrodes));
        slices.forEach(s => s.initSliceMap())
        slices.forEach(s => s.drawCanvas())
        hideMenu();
      });

      document
        .getElementById("cancel-btn")
        .addEventListener("click", () => hideMenu());
    }
  });
};

const insertMenuHTML = (electrode) => {
  const { elecID, elecType, intPopulation, coordinates } = electrode;
  const type = getSelectedSeizType();
  const seizType = type === "intPopulation" ? "" : electrode[type];
  const { x, y, z } = coordinates;
  const markUp = `
    <label>Electrode ID: </label>
    <input id="elec-id-edit" type="text" value="${elecID}">
    
    <label>Electrode Type: </label>
    <input id="elec-type-edit" type="text" value="${elecType}">

    <label>Interical Population: </label>
    <select id="int-pop-edit" value="${intPopulation}">
      <option value="0">0</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
      <option value="8">8</option>
    </select>

    <label>Seizure Type: </label>
    <select id="seiz-type-edit" value="${seizType}">
      <option value="">None</option>
      <option value="Onset">Onset</option>
      <option value="Very Early Spread">Very Early Spread</option>
      <option value="Early Spread">Early Spread</option>
      <option value="Late Spread">Late Spread</option>
      <option value="Rapid Spread">Rapid Spread</option>
      <option value="Early Onset">Early Onset</option>
    </select>
    
    <label>Coordinates: </label>
    <input id="coord-edit" type="text" value="${x}, ${y}, ${z}">
  
    <button id="edit-btn">Update</button>
    <button id="cancel-btn">Cancel</button> 
    `;
  return markUp;
};

const editElectrode = (data, index, type) => {
  const newID = document.getElementById("elec-id-edit").value;
  const newElecType = document.getElementById("elec-type-edit").value;
  const newIntPop = document.getElementById("int-pop-edit").value;
  const newSeizType = document.getElementById("seiz-type-edit").value;
  const coordinates = document.getElementById("coord-edit").value;
  const [newX, newY, newZ] = coordinates.split(",").map((c) => Number(c));

  const currentElectrode = data.electrodes[index];
  const newElectrode = {
    ...currentElectrode,
    elecID: newID,
    coordinates: {
      x: newX,
      y: newY,
      z: newZ,
    },
    elecType: newElecType,
    intPopulation: Number(newIntPop),
  };

  if (type !== "intPopulation") newElectrode[type] = newSeizType;

  data.electrodes[index] = newElectrode;
  updateLabels(newElectrode, index, data);
};

const createElectrodeTags = (spheres) => {
    for (const sphere of spheres) {
    const captionDiv = document.createElement("div");
    captionDiv.className = 'elec-tag';
    captionDiv.id = `${sphere.caption}-tag`;
    document.body.appendChild(captionDiv);
  }
}

const showElectrodeTags = (showTags, spheres, renderer, bbox) => {
   if (showTags) {
      const canvas = document.getElementsByTagName("canvas")[0];
      const vWidth = canvas.clientWidth;
      const vHeight = canvas.clientHeight;
      const view = renderer.camera.view;
      const fov = 45;
      const near = 1;
      const far = 10000;

      const perspective = X.matrix.makePerspective(
        X.matrix.identity(),
        fov,
        vWidth / vHeight,
        near,
        far,
      );

      for (const sphere of spheres) {

        const composed = new Float32Array(16);
        const [G1x, G1y, G1z] = sphere.u;
        const [bx, by, bz] = bbox;

        X.matrix.multiply(perspective, view, composed);

        const input = [G1x - bx, G1y - by, G1z - bz, 1.0];
        const output = new Float32Array(4);
 
        X.matrix.multiplyByVec4(composed, input, output);
        output[0] /= output[3];
        output[1] /= output[3];

        const xs = (vWidth / 2) * output[0] + vWidth / 2;
        const ys = (-vHeight / 2) * output[1] + vHeight / 2;

        const electrodeDiv = document.getElementById(`${sphere.caption}-tag`);
        electrodeDiv.innerHTML = sphere.caption;
        electrodeDiv.style.left = `${xs}px`;
        electrodeDiv.style.top = `${ys}px`;
        electrodeDiv.style.position = "absolute";
        electrodeDiv.style.width = `0px`;
        electrodeDiv.style.height = `0px`;

        if (xs > vWidth - 8 || ys > vHeight - 8) {
          electrodeDiv.style.display = 'none';
        } else {
          electrodeDiv.style.display = 'block'
        }
      }
    } else {
      for (const sphere of spheres) {
        const electrodeDiv = document.getElementById(`${sphere.caption}-tag`);
        electrodeDiv.style.display = 'none';
      }
    }
};

// https://stackoverflow.com/questions/3749231/download-file-using-javascript-jquery
const downloadJSON = (data) => {
  const formatSpaces = 4;
  const exportJSON = [JSON.stringify(data, null, formatSpaces)];
  const url = window.URL.createObjectURL(
    new Blob(exportJSON, { type: "application/json" })
  );
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "testing.json";
  document.body.append(a);
  a.click();
  window.URL.revokeObjectURL(url);
};

const hideMenu = () => {
  const menu = document.getElementById("edit-menu");
  menu.style.display = "none";
};

const getSelectedSeizType = () => {
  const { seizTypeMenu } = DOMNodes;
  return seizTypeMenu.selectedOptions[0].value;
};

const getAttributeArray = (data, attr) => {
  return data.map((datum) => datum[attr]);
};

const loadElectrodes = (
  renderer,
  volumeGUI,
  volume,
  mode,
  subject,
  playSignalController
) => {
  (async () => {
    // for 'NYU' or build mode
    const protocol = window.location.protocol;
    const baseURL = `ievappwpdcpvm01.nyumc.org`;
    const directory = `?file=sub-${subject}_ntoolsbrowser.json&bids=ieeg`;

    // initial data load
    const data =
      mode === "demo"
        ? await (await fetch(`./data/${subject}/JSON/${subject}.json`)).json()
        : await (await fetch(`${protocol}//${baseURL}/${directory}`)).json();

    const sliceX = new ElectrodeCanvas(`${subject}`, "sagittal", "sliceX" );
    const sliceY = new ElectrodeCanvas(`${subject}`, "coronal", "sliceY");
    const sliceZ = new ElectrodeCanvas(`${subject}`, "axial", "sliceZ");

    const slices = [sliceX, sliceY, sliceZ]

    // this is a work-around from a glitch with the "show all tags" button. we have to offset each coordinate
    // by the bounding box, then reset it. hopefully this can be fixed one day
    const oldBoundingBox = renderer.u;
    const defaultSeizType = data.SeizDisplay[0];

    const { subjectIDLabel, numSeizTypeLabel, tagsBtn } = DOMNodes;
    const loadingText = document.getElementById('loading-text');

    subjectIDLabel.innerText = data.subjID;
    numSeizTypeLabel.innerText = data.totalSeizType;

    // arrays of objects
    const electrodeSpheres = data.electrodes.map((el) =>
      GFX.drawElectrodeFx(el, false, defaultSeizType, oldBoundingBox)
    );
    const selectionSpheres = data.electrodes.map((el) =>
      GFX.drawElectrodeFx(el, true, defaultSeizType, oldBoundingBox)
    );
    const fmapConnections = GFX.drawFmapFx(
      data.functionalMaps,
      data.electrodes,
      oldBoundingBox
    );
    const fmapHighlights = fmapConnections.map((fmap) =>
      GFX.drawFmapHighlightFx(fmap)
    );

    // add XTK's graphical representation of data to renderer
    electrodeSpheres.forEach((el) => renderer.add(el));
    selectionSpheres.forEach((el) => renderer.add(el));
    fmapConnections.forEach((connection) => renderer.add(connection));
    fmapHighlights.forEach((highlight) => renderer.add(highlight));

    //setup electrode signal display
    let electrodeSignals = [];
    let signalHeader;
    if (mode === "demo" && subject === "fsMNI") {
      signalHeader = await (await fetch(`./data/${subject}/edf/signal_header.json`)).json();
      const sampleSize = signalHeader.length;
      const numBytes = 4;
      const signalPath = `./data/${subject}/edf/signals/${subject}.bin`;

      loadingText.innerText = `Loading Electrode Signals...`

      electrodeSignals = await fetch(signalPath)
        .then((response) => response.blob())
        .then((content) => content.arrayBuffer(content.size))
        .then((data) => {
          const dataView = new DataView(data);
          const sizePerSample = dataView.byteLength / sampleSize;
          const signals = [];

          let currentChunkIndex = 0;
          for (let j = 0; j < sampleSize; j++) {
            const view = [];
            for (
              let i = sizePerSample * currentChunkIndex;
              i < sizePerSample * (currentChunkIndex + 1);
              i += numBytes
            ) {
              view.push(dataView.getFloat32(i, true));
            }
            signals.push(view);
            currentChunkIndex += 1;
          }

          return signals;
        });

      loadingText.innerText = "";
    }
    
    let signalIndex = 0;
    let playSignal = false;

    playSignalController["start / stop"] = function () {
      if (!electrodeSignals.length) {
        alert("Electrode signal display is not yet implemented for this subject");
        return;
      }
      let signalFrequency = 10;

      playSignal = !playSignal;

      function applySignal() {
        if (!playSignal) return;

        if(signalIndex == electrodeSignals[0].length)
          signalIndex = 0;

        let max = electrodeSignals[0][signalIndex];
        let min = electrodeSignals[0][signalIndex];

        for(let i = 0; i < electrodeSignals.length; i++){
          
          if(electrodeSignals[i][signalIndex] > max)
            max = electrodeSignals[i][signalIndex];

          if(electrodeSignals[i][signalIndex] < min)
            min = electrodeSignals[i][signalIndex];          
        }

        let colors = [];
        for(let i = 0; i < electrodeSignals.length; i++){
          let normalizedSignal = 0;

          normalizedSignal = (electrodeSignals[i][signalIndex] - min) / (max - min);

          colors[i] = [normalizedSignal, 0, 1 - normalizedSignal];
        }

        electrodeSpheres.forEach(
          (sphere, i) =>{
            sphere.color = colors[i];
          }
        );

        signalIndex++;
        setTimeout(applySignal, signalFrequency);
      }

      if (playSignal) applySignal();
    };

    // //* adds the seizure types to the first drop down menu on the panel
    initSeizureTypeMenu(data, electrodeSpheres, fmapConnections, slices);

    // //* adds the IDs to the electrode ID menu and sets up event listeners
    initializeElectrodeIDMenu(data, selectionSpheres, volumeGUI, volume, slices);

    // //* this needs to be refactored
    jumpSlicesOnClick(
      data,
      renderer,
      volumeGUI,
      electrodeSpheres,
      selectionSpheres,
      fmapConnections,
      fmapHighlights,
      volume,
      slices
    );

    // adds functionality for hovering over particular electrodes on the scene
    addMouseHover(renderer);

    // //* adds the event listners to the functional map menu
    addEventsToFmapMenu(data, fmapConnections, fmapHighlights);

    // adds event listener to the show-all-tags button on the menu
    let showTags = false;
    tagsBtn.addEventListener("click", () => {
      showTags = !showTags;
    });

    createElectrodeTags(electrodeSpheres);
    setupEditMenu(renderer, data, electrodeSpheres, selectionSpheres, slices);

    // TODO: change the fmap connections if needed
    document
      .getElementById("download-btn")
      .addEventListener("click", () => downloadJSON(data));

    document
      .getElementsByTagName("canvas")[0]
      .addEventListener("mousedown", () => hideMenu());

    renderer.onRender = () => {
      showElectrodeTags(showTags, electrodeSpheres, renderer, oldBoundingBox);
    };

    document.getElementById('slice-brightness').oninput = (event) => {
      slices.forEach(s => s.setBrightness(event.target.value));
      slices.forEach(s => s.drawCanvas())
      
    }
  })();
};

export { loadElectrodes };
