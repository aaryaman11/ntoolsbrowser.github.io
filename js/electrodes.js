// This file contains functions for formatting json data and displaying graphical
// representations. can possibly revise if we do not want to keep it in that format,
// and just use indices directly

import { mapInterval } from "./mapInterval.js";
import { getSeizTypeColor } from "./color.js";
import { DOM } from "./DOM.js";
import { CreateElectrodeSignalWindow } from "./signaldisplay.js";
import { GFX } from "./gfx.js";
import { SagittalCanvas } from "./electrodecanvas.js";
import { CoronalCanvas } from "./electrodecanvas.js";
import { AxialCanvas } from "./electrodecanvas.js";

// be mindful that NONE occupies index 0
const getSelectedIndex = () => {
  return DOM.electrodeMenu.selectedIndex;
};

/**
* This will move the 3D volume slices, and the three electrode canvases
* to the location of the clicked electrode
*
* @param {X.volume} volume
* @param {object} electrode // single electrode datum
* @param {array} slices     // our three electrode canvases
*/
const updateSliceLocation = (volume, electrode, slices) => {
  const numSlices = volume.dimensions[0];

  // e.g. [-128, 127] for a volume w/ 256 dimensions
  const startRange = [
    -(Math.ceil(numSlices / 2)), Math.floor(numSlices / 2) - 1
  ];
  const endRange = [0, numSlices - 1];
  const { x, y, z } = electrode.coordinates;

  // get the slice index in which each coordinate of the electrode resides
  // keep in mind this can never be perfect if we're going from a continuous 
  // to discrete variable
  const [xSlice, ySlice, zSlice] = [x, y, z].map((coordinate) =>
    Math.round(mapInterval(coordinate, startRange, endRange))
  );

  const [xCanvas, yCanvas, zCanvas] = slices;

  // update the slice canvases
  // since each 'relative coordinate' is so different, it is difficult
  // to abstract this to its own function
  xCanvas.setSliceIndex(xSlice);
  xCanvas.setUserPosition(xSlice);
  xCanvas.setRelativeCoordinates(numSlices - ySlice, numSlices - zSlice);
  xCanvas.drawCanvas();
  volume.indexX = xSlice;

  yCanvas.setSliceIndex(ySlice);
  yCanvas.setUserPosition(ySlice);
  yCanvas.setRelativeCoordinates(xSlice, numSlices - zSlice);
  yCanvas.drawCanvas();
  volume.indexY = ySlice;

  zCanvas.setSliceIndex(zSlice);
  zCanvas.setUserPosition(zSlice);
  zCanvas.setRelativeCoordinates(xSlice, numSlices - ySlice)
  zCanvas.drawCanvas();
  volume.indexZ = zSlice;

};

// function for adding options based on electrode IDs 
// calls update slice location
/**
 *
 * @param {array} elObjects
 * @param {array} idArray
 * @param {array} selectionSpheres
 * @param {JSON} data
 * @param {X.volume} volume
 */
const initElecIDMenu = (data, selectionSpheres, volume, slices) => {
  DOM.electrodeMenu.addEventListener("change", (event) => {
    // the index of the selected options will be the same as the electrode array
    const index = getSelectedIndex() - 1;
    const res = data.electrodes[index];

    printElectrodeInfo(res, index, selectionSpheres, data);
    if (event.target.value !== "None" && res)
      updateSliceLocation(volume, res, slices);
  });
  // append HTML option to drop down menu
  for (const entry of data.electrodes) {
    const newOption = document.createElement("option");
    newOption.value = entry.elecID;
    newOption.innerText = entry.elecID;
    DOM.electrodeMenu.appendChild(newOption);
  }
};

/**
 *
 * @param {JSON} data
 * @param {array} spheres
 * @param {array} fmaps
 */
const initSeizureTypeMenu = (data, spheres, slices) => {
  const seizureTypes = data.SeizDisplay;

  DOM.seizTypeMenu.addEventListener("change", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const selectedType = event.target.value;
    const selectedSeizType = getAttrArray(data.electrodes, selectedType);

    // update colors on 3D and 2D
    spheres.forEach((sphere, index) => {
      sphere.color = getSeizTypeColor(selectedSeizType[index]);
    });

    slices.forEach(s => s.setSeizType(selectedType))
    slices.forEach(s => s.drawCanvas());

    // update display panel info
    const index = getSelectedIndex() - 1
    updateLabels(data.electrodes[index], index, data);
  });

  // create the menu options for all of patients seizure types
  // if fmaps is ever removed entirely from SeizDisplay in the JSON, remove the slice
  seizureTypes.slice(0, seizureTypes.length - 1).forEach((type) => {
    const newOption = document.createElement("option");
    newOption.value = type;
    newOption.innerText = type;
    DOM.seizTypeMenu.appendChild(newOption);
  });
};

/**
 *
 * @param {array} data - electrode data
 * @param {array} connections - the X.cylinders
 * @param {array} fmapHighlights - the X.cylinders which highlight
 */
const addEventsToFmapMenu = (data, connections, fmapHighlights) => {
  DOM.fmapMenu.addEventListener("change", (event) => {
    // build an array with functional map type e.g. "motor"
    const selected = getAttrArray(data.functionalMaps, event.target.value);
    if (selected !== "None") {
      GFX.redrawFmaps(connections, selected);
      DOM.fmapCaption.innerText = "No Functional Mapping Selected";
      DOM.fmapThreshold.innerText = "";
      DOM.fmapDischarge.innerText = "";
    } else {
      fmaps.forEach((fmap) => (fmap.visible = false));
    }
    fmapHighlights.forEach((fmap) => (fmap.visible = false));
  });
};

// find the electrode in the options and display the info on the panel
/**
 *
 * @param {object} selectedElectrode
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
  if (!selectedElectrode) {
    return;
  }
  updateLabels(selectedElectrode, index, data);
  GFX.highlightSelectedElectrode(selectionSpheres, index);
};

// changes the mouse to a crosshair for responsive selection
// 'g' is the property which cooresponds to 'name' in the minified version of XTK 
const addMouseHover = (renderer) => {
  renderer.interactor.onMouseMove = (e) => {
    const hoverObject = renderer.pick(e.clientX, e.clientY);
    if (hoverObject !== 0) {
      const selectedSphere = renderer.get(hoverObject);
      if (selectedSphere.g === "sphere" || selectedSphere.g === "cylinder") {
        document.body.style.cursor = "crosshair";
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
 */

const updateLabels = ({ elecID, elecType, intPopulation, coordinates }, index, data) => {
  if (elecID == null) { 
    return; 
  }

  const { x, y, z } = coordinates;
  const selectedSeizType = DOM.seizTypeMenu.selectedOptions[0].value;
  const seizureTypeValues = getAttrArray(data.electrodes, selectedSeizType);

  const roundedCoordinates = `(${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)})`;
  DOM.IDLabel.innerText = elecID;
  DOM.elecTypeLabel.innerText = elecType;
  DOM.coordinateLabel.innerText = roundedCoordinates;

  // chooses whether to display intpop or seizure type info on the display and edit menus
  if (selectedSeizType === "intPopulation") {
    DOM.intPopulationLabel.innerText = intPopulation;
    DOM.seizTypeLabel.innerText = "";
  } else {
    const currentElecSeizType = seizureTypeValues[index];
    const editOption = document.getElementById('seiz-type-edit');
    if (editOption) {
      editOption.value = currentElecSeizType;
    }
    DOM.seizTypeLabel.innerText = currentElecSeizType;
    DOM.intPopulationLabel.innerText = "";
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
 * @param {X.volume} volume - The volume displayed on slices
 *
 * This function is responsible for way too much. Would be good to find a way to break
 * it down into more reasonable components. It adds an event listener to the canvas,
 * does object picking, highlights an electrode, jumps the slices, and displays
 * captions on the panel
 */

const jumpSlicesOnClick = (
  data,
  renderer,
  spheres,
  selections,
  fmapConnections,
  fmapHighlights,
  volume,
  slices
) => {
  // the main canvas
  DOM.canvases[0].addEventListener("click", (e) => {

    // gets the 'uniqueID' from XTK, which is just an integer
    const clickedObject = renderer.pick(e.clientX, e.clientY);
    // check if it actually has an ID (0 is XTK's way of saying 'no ID')
    if (clickedObject === 0) return;

    const selectedObject = renderer.get(clickedObject);

    // ".g" is an object property that corresponds to the selected X.object's name (minified)
    if (selectedObject.g === "sphere") {

      // find the actual electrode in the array of XTK spheres
      const sphereIndex = spheres.indexOf(selectedObject);
      if (sphereIndex >= 0) {
        hideEditMenu()
        updateView(sphereIndex, selections, data, volume, slices);
      }
    // same ideas as above, just with fmaps
    } else if (selectedObject.g === "cylinder") {
      const cylinderIndex = fmapConnections.indexOf(selectedObject);
      if (cylinderIndex >= 0) {
        const threshold = getAttrArray(data.functionalMaps, 'fmapThreshold')
        const discharge = getAttrArray(data.functionalMaps, 'fmapAfterDischarge');
        DOM.fmapCaption.innerText = selectedObject.caption;
        DOM.fmapThreshold.innerText = `Threshold: ${threshold[cylinderIndex]}`;
        DOM.fmapDischarge.innerText = `Discharge: ${discharge[cylinderIndex]}`;
        GFX.highlightSelectedFmap(fmapHighlights, cylinderIndex);
      }
    }
  }); // end of event listener
};

const setupEditMenu = (
  renderer, 
  data, 
  spheres, 
  selectionSpheres, 
  slices, 
  fmapConnections,
  fmapHighlights,
  bbox,
) => {
  DOM.canvases[0].addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const clickedObject = renderer.pick(e.clientX, e.clientY);
    if (clickedObject === 0) return;

    const selectedObject = renderer.get(clickedObject);
    const objectIndex = spheres.indexOf(selectedObject);
    const selectedElectrode = data.electrodes[objectIndex];

    // draw menu over users mouse position
    DOM.editMenu.innerHTML = insertMenuHTML(selectedElectrode);
    DOM.editMenu.style.display = "grid";
    DOM.editMenu.style.left = `${e.pageX}px`;
    DOM.editMenu.style.top = `${e.pageY}px`;

    // unfortunately, the DOM.js file wont help us here. these values only exist if the menu is visible
    document.getElementById('seiz-type-edit').value = selectedElectrode[getSelectedSeizType()];
    document.getElementById('int-pop-edit').value = selectedElectrode.intPopulation;

    updateView(objectIndex, selectionSpheres, data);

    document.getElementById("edit-btn").addEventListener("click", () => {
      const type = getSelectedSeizType();
      editElectrode(data, objectIndex, type);
      addFmap(data, renderer, fmapConnections, fmapHighlights, bbox);

      spheres.forEach((sphere, index) => {
        sphere.color = getSeizTypeColor(data.electrodes[index][type]);
      });

      // changing the data requires regeneration of each electrode slices map
      slices.forEach(s => s.setData(data.electrodes));
      slices.forEach(s => s.initSliceMap())
      slices.forEach(s => s.drawCanvas())
      hideEditMenu();
    });

    document
      .getElementById("cancel-btn")
      .addEventListener("click", () => hideEditMenu());
  });
};

const insertMenuHTML = (electrode) => {
  const { elecType, intPopulation } = electrode;
  const type = getSelectedSeizType();
  const seizType = type === "intPopulation" ? "" : electrode[type];
  const markUp = `
    <label>${electrode.elecID}</label>
    <br />
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
    <hr>
    <hr>
    <label>Add Functional Map</label>
    <br>
    <label>Create Map With: </label>
    <input id="connection-edit-id"/>
    <label>Annotation: </label>
    <textarea id="annotation-text" style="resize: none;" cols="40" rows="4"></textarea>

    <label>Threshold: </label>
    <input id="threshold-edit-id"/>
    <label>After Discharge?</label>
    <input type="checkbox" id="discharge-edit">
    <button id="edit-btn">Update</button>
    <button id="cancel-btn">Cancel</button>`
  return markUp;
};
  
const editElectrode = (data, index, type) => {
  const newElecType = document.getElementById("elec-type-edit").value;
  const newIntPop = document.getElementById("int-pop-edit").value;
  const newSeizType = document.getElementById("seiz-type-edit").value;

  const currentElectrode = data.electrodes[index];
  const newElectrode = {
    ...currentElectrode,
    elecType: newElecType,
    intPopulation: Number(newIntPop),
  };

  if (type !== "intPopulation") {
    newElectrode[type] = newSeizType;
  }

  data.electrodes[index] = newElectrode;
  updateLabels(newElectrode, index, data);
}; 

const addFmap = (
  data, 
  renderer, 
  fmapConnections, 
  fmapHighlights,
  bbox
) => {

  // using DOM.js wont help much here since these DOM elements dont exist until a click happens
  const connectionStart = data.electrodes[getSelectedIndex() - 1]
  const connectionEndID = document.getElementById("connection-edit-id").value;
  const connectionCaptionText = document.getElementById("annotation-text").value;
  const thresholdValue = parseFloat(document.getElementById("threshold-edit-id").value);
  const hasDischarge = document.getElementById("discharge-edit").checked;
  const connectionEnd = data.electrodes.find( elec => elec.elecID === connectionEndID);

  const connectionEndIndex = data.electrodes.indexOf(connectionEnd);
  if (!connectionCaptionText) return;
  if (!connectionEnd) {
    alert(`Could not find electrode with ID of ${connectionEndID}`)
    return;
  }
  if (DOM.fmapMenu.selectedIndex === 0) {
    alert("Select Functional Map Type Other Than 'None'");
    return;
  }

  // create a new fmap connection represented by an X.cylinder object
  const threshold = thresholdValue;
  const { x: x1, y: y1, z: z1 } = connectionStart.coordinates;
  const { x: x2, y: y2, z: z2 } = connectionEnd.coordinates;
  const [ xOffset, yOffset, zOffset ] = bbox;
  const newConnection = new X.cylinder();
  newConnection.caption = connectionCaptionText;
  newConnection.start = [x1 + xOffset, y1 + yOffset, z1 + zOffset];
  newConnection.end = [x2 + xOffset, y2 + yOffset, z2 + zOffset];
  newConnection.radius = 0.3;

  const newFmapData = {
    fmapG1: {
      index: getSelectedIndex() - 1,
      elecID: connectionStart.elecID,
    }, 
    fmapG2: {
      index: connectionEndIndex,
      elecID: connectionEndID
    },
    [`${DOM.fmapMenu.value}`]: connectionCaptionText,
    fmapThreshold: threshold || 0,
    fmapAfterDischarge: hasDischarge ? "Yes" : "No",
  }
  data.functionalMaps.push(newFmapData);

  const newHighlight = GFX.drawFmapHighlightFx(newConnection);
  fmapHighlights.push(newHighlight);
  fmapConnections.push(newConnection);
  renderer.add(newConnection);
  renderer.add(newHighlight);
}

// add a new blank seizure type to the subject
const addNewSeizType = (data) => {
  const numTypes = DOM.seizTypeMenu.options.length;
  const newSeizType = data.electrodes.map(datum => ({ ...datum, [`Seizure Type ${numTypes}`]: ""}));
  const newOption = document.createElement('option');
  data.totalSeizType = numTypes;
  DOM.numSeizTypeLabel.innerText = numTypes;
  newOption.value = `Seizure Type ${numTypes}`;
  newOption.innerText = `Seizure Type ${numTypes}`; 
  DOM.seizTypeMenu.appendChild(newOption);
  DOM.seizTypeMenu.selectedIndex = numTypes;
  data.electrodes = newSeizType;
}

const createElectrodeTags = (spheres) => {
  for (const sphere of spheres) {
    const captionDiv = document.createElement("div");
    captionDiv.className = 'elec-tag';
    captionDiv.id = `${sphere.caption}-tag`;
    document.body.appendChild(captionDiv);
  }
}

const showElectrodeTags = (showTags, spheres, renderer, bbox) => {
  if (!showTags) {
    for (const sphere of spheres) {
      const electrodeDiv = document.getElementById(`${sphere.caption}-tag`);
      electrodeDiv.style.display = 'none';
    }
    return;
  } 

  const vWidth = DOM.canvases[0].clientWidth;
  const vHeight = DOM.canvases[0].clientHeight;
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
    const input = [G1x - bx, G1y - by, G1z - bz, 1.0];
    const output = new Float32Array(4);

    X.matrix.multiplyByVec4(
      X.matrix.multiply(perspective, view, composed), input, output
    );

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
};

// https://stackoverflow.com/questions/3749231/download-file-using-javascript-jquery
const downloadJSON = (data, subject) => {
  const formatSpaces = 4;
  const exportJSON = [JSON.stringify(data, null, formatSpaces)];
  const url = window.URL.createObjectURL(
    new Blob(exportJSON, { type: "application/json" })
  );
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `${subject}_ntoolsbrowser`;
  document.body.append(a);
  a.click();
  window.URL.revokeObjectURL(url);
};

const hideEditMenu = () => {
  DOM.editMenu.style.display = "none";
};

const getSelectedSeizType = () => {
  return DOM.seizTypeMenu.selectedOptions[0].value;
};

const getAttrArray = (data, attr) => {
  return data.map((datum) => datum[attr]);
};

const updateView = (selectedIndex, selections, data, volume, slices) => {
  const target = data.electrodes[selectedIndex];
  GFX.highlightSelectedElectrode(selections, selectedIndex);
  DOM.electrodeMenu.options.selectedIndex = selectedIndex + 1;
  updateLabels(target, selectedIndex, data);
  if (volume) {
    updateSliceLocation(volume, target, slices);
  }
}

// Main Entry Point. Function that calls all other functions
const loadElectrodes = async (
  renderer,
  volume,
  mode,
  subject,
  playSignalController
) => {
  // for 'NYU' or build mode
  const protocol = window.location.protocol;
  const baseURL = `ievappwpdcpvm01.nyumc.org/?bids=ieeg&file=sub-${subject}`;

  // initial data load
  const draggedData = sessionStorage.getItem("draggedJSON");
  const data =
    draggedData 
    ? JSON.parse(draggedData)
    : mode === "demo" 
      ? await (await fetch(`./data/${subject}/JSON/${subject}.json`)).json()
      : await (await fetch(`${protocol}//${baseURL}_ntoolsbrowser.json`)).json();

  // otherwise the JSON data will remain between loads
  sessionStorage.clear();

  const sliceX = new SagittalCanvas(data, volume, "sliceX");
  const sliceY = new CoronalCanvas(data, volume, "sliceY");
  const sliceZ = new AxialCanvas(data, volume, "sliceZ");

  // put in array for easy function passing
  const slices = [sliceX, sliceY, sliceZ];

  // tags need the original bounding box.
  const oldBoundingBox = renderer.u;
  const defaultSeizType = data.SeizDisplay[0];
  const loadingText = document.getElementById('loading-text');

  DOM.subjectIDLabel.innerText = data.subjID;
  DOM.numSeizTypeLabel.innerText = data.totalSeizType;

  // (MODEL) arrays of objects
  const electrodeSpheres = data.electrodes.map((el) =>
    GFX.drawElectrodeFx(el, false, defaultSeizType, oldBoundingBox)
  );
  const highlightSpheres = data.electrodes.map((el) =>
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

  // (VIEW) add XTK's graphical representation of data to renderer
  electrodeSpheres.forEach((el) => renderer.add(el));
  highlightSpheres.forEach((el) => renderer.add(el));
  fmapConnections.forEach((connection) => renderer.add(connection));
  fmapHighlights.forEach((highlight) => renderer.add(highlight));

  // setup electrode signal display
  const signalHeaderURL =
    mode === "demo"
      ? `./data/${subject}/edf/${subject}_signal_header.json`
      : `${protocol}//${baseURL}_functionalmapping.json`;

  const signalHeader = await fetch(signalHeaderURL)
    .then(response => response.json())
    .catch(error => console.log("This current subject does not have a signal or bin file."));

  const sampleSize = signalHeader ? signalHeader.length : null;

  // binary file is Float32. change to 8 if Float64 is used
  const numBytes = 4;
  const signalPath =
    mode === "demo"
      ? `./data/${subject}/edf/signals/${subject}.bin`
      : `${protocol}//${baseURL}_functionalmapping.bin`;

  loadingText.innerText = `Loading Electrode Signals...`

  const electrodeSignals = await fetch(signalPath)
    .then((response) => response.blob())
    .then((content) => content.arrayBuffer(content.size))
    .then((data) => {
      // dataview can decode the binary data inside the signal file
      const dataView = new DataView(data);
      const sizePerSample = dataView.byteLength / sampleSize;
      const signals = [];

      // chunk the array into equal parts. the binary data for each signal is listed in order
      // the bin file has no metadata
      for (let j = 0; j < sampleSize; j++) {
        const view = [];
        for (
          let i = sizePerSample * j;
          i < sizePerSample * (j + 1);
          i += numBytes
        ) {
          // true means data is little-endian
          view.push(dataView.getFloat32(i, true));
        }
        signals.push(view);
      }
      return signals;
    })
    .catch(error => console.log(error)) ;

  loadingText.innerText = "";
  
  let signalIndex = 0;
  let playSignal = false;

  function changeElectrodeColors(){
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

    for(let i = 0; i < electrodeSignals.length; i++){
      let normalizedSignal = 0;

      let signalsPerEntry = electrodeSignals[0].length;
      let percentage = parseFloat((signalIndex / signalsPerEntry) * 100).toFixed(2);
      DOM.signalBar.style.width = `${percentage}%`;

      normalizedSignal = (electrodeSignals[i][signalIndex] - min) / (max - min);
      electrodeSpheres[i].color = [normalizedSignal, 0, 1 - normalizedSignal];
    }
  };

  playSignalController["start / stop"] = function () {
    if (!electrodeSignals.length) {
      console.error("Electrode signal display is not yet implemented for this subject");
      return;
    }
    let signalFrequency = 10;

    playSignal = !playSignal;

    if (playSignal) 
      DOM.signalProgress.style.visibility = "visible";

    function applySignal() {
      if (!playSignal) return;
      
      changeElectrodeColors();
      signalIndex++;
      setTimeout(applySignal, signalFrequency);
    }

    if (playSignal) applySignal();
  };

  playSignalController["sin wave"] = function (){
    CreateElectrodeSignalWindow(electrodeSignals, function(i){
      signalIndex = i;
      changeElectrodeColors();
    });
  };

  // CONTROLLER
  // adds the seizure types to the first drop down menu on the panel
  initSeizureTypeMenu(data, electrodeSpheres, slices);

  // adds the IDs to the electrode ID menu and sets up event listeners
  initElecIDMenu(data, highlightSpheres, volume, slices);

  jumpSlicesOnClick(
    data,
    renderer,
    electrodeSpheres,
    highlightSpheres,
    fmapConnections,
    fmapHighlights,
    volume,
    slices
  );

  // adds functionality for hovering over particular electrodes on the scene
  addMouseHover(renderer);

  // adds the event listeners to the functional map menu
  addEventsToFmapMenu(data, fmapConnections, fmapHighlights);

  // adds event listener to the show-all-tags button on the menu
  let showTags = false;
  DOM.tagsBtn.addEventListener("click", () => {
    showTags = !showTags;
  });

  createElectrodeTags(electrodeSpheres);
  
  setupEditMenu(
    renderer, 
    data, 
    electrodeSpheres, 
    highlightSpheres, 
    slices, 
    fmapConnections, 
    fmapHighlights,
    oldBoundingBox
  );

  // continuously executes while renderer is active 
  renderer.onRender = () => {
    showElectrodeTags(showTags, electrodeSpheres, renderer, oldBoundingBox);
  };

  // each slider and button for the slices must call the slices draw method
  DOM.downloadBtn.addEventListener("click", () => downloadJSON(data, subject));
  DOM.newSeizTypeBtn.addEventListener("click", () => addNewSeizType(data));
  DOM.brightCtrl.oninput = (event) => {
    slices.forEach(s => s.setBrightness(event.target.value));
    slices.forEach(s => s.drawCanvas())
  }
  DOM.sliceXCtrl.oninput = (event) => {
    volume.indexX = (parseInt(event.target.value));
    sliceX.setSliceIndex(parseInt(event.target.value));
    sliceX.drawCanvas();
  }
  DOM.sliceYCtrl.oninput = (event) => {
    volume.indexY = (parseInt(event.target.value));
    sliceY.setSliceIndex(parseInt(event.target.value));
    sliceY.drawCanvas();
  }
  DOM.sliceZCtrl.oninput = (event) => {
    volume.indexZ = (parseInt(event.target.value));
    sliceZ.setSliceIndex(parseInt(event.target.value));
    sliceZ.drawCanvas();
  }
  DOM.syncBtn.addEventListener('click', () => {
    slices.forEach(s => s.resetPosition())
    slices.forEach(s => s.drawCanvas());
  });
  DOM.windowLow.oninput = (event) => {
    slices.forEach(s => s.setWindowLow(parseInt(event.target.value)));
    slices.forEach(s => s.drawCanvas());
  }
  DOM.windowHigh.oninput = (event) => {
    slices.forEach(s => s.setWindowHigh(parseInt(event.target.value)));
    slices.forEach(s => s.drawCanvas());
  }
  DOM.sliceDetails.onclick = () => {
    slices.forEach(s => s.toggleDetails());
    slices.forEach(s => s.drawCanvas());
  }
};

export { loadElectrodes };
