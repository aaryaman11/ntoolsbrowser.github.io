// This file contains functions for formatting json data and displaying graphical 
// representations. can possibly revise if we do not want to keep it in that format,
// and just use indices directly

// ONE MAJOR POTENTIAL POINT OF CONFUSION.
// This file is large, and since I didn't want to use many globals, many functions 
// take lots of parameters and it can be a bit confusing to keep track of which parameter
// represents which data. The most confusing part you may run into is keeping straight what an 
// "electrodeObject" is vs an "electrodeSphere"
// An electrodeObject is a bundled javascript object that contains a data point for each property of an electrode.
// I know that "object" is a very ambiguous name. I am open to suggestions. Electrode Objects look like this
// for example

// {
//    elecID: G01
//    xCoor: 50,
//    yCoor: 70,
//    zCoor:, 90,
//      ...
// }

// an Electrode Sphere, on the other hand, reads from an electrode object to make an XTK sphere rendered to the screen
// with those properties. In general, I just find it so much easier to work with an array of objects, rather than
// one giant object full of arrays.

import { mapInterval } from './mapInterval.js';
import { getSeizTypeColor } from './color.js';

// package each electrode together as an object for readability and easier iteration
/**
 * 
 * @param {JSON} jsonData
 * @param {number} index 
 * @param {array} bBox - original bounding box for electrodes. will be reset after call
 * @returns {object} - an object with all of the JSON properties shared at an index
 */
function getElectrodeObject(jsonData, index, bBox) {
  // set default to first seizure display
  const defaultSeizType = jsonData.SeizDisplay[0];
  const [xOffset, yOffset, zOffset] = bBox;

  // creates an electrode object based on the index of the JSON properties.
  // coordinates are offset by the bounding box
  var electrodeObject = {
    "elecID": jsonData.elecID[index],
    "xCoor": (jsonData.coorX[index] + xOffset),
    "yCoor": (jsonData.coorY[index] + yOffset),
    "zCoor": (jsonData.coorZ[index] + zOffset),
    "elecType": jsonData.elecType[index],
    "intPopulation": jsonData.intPopulation[index],
    "seizType": jsonData[defaultSeizType][index],
    "visible": true, // a default value for later filtering
  };

  // the slice in which the electrode appears, based on the coordinates
  // have to redo the offset of the particular object
  // the arrays should be changed from 0 to num slices in volume - 1
  electrodeObject.xSlice = Math.round(mapInterval(
    (electrodeObject.xCoor - xOffset), [-127.5, 127.5], [0, 255]
  ));

  electrodeObject.ySlice = Math.round(mapInterval(
    (electrodeObject.yCoor - yOffset), [-127.5, 127.5], [0, 255]
  ));

  electrodeObject.zSlice = Math.round(mapInterval(
    (electrodeObject.zCoor - zOffset), [-127.5, 127.5], [0, 255]
  ));

  return electrodeObject
}

// create the graphical electrode on the canvas
const drawElectrodeFx = (electrodeDatum) => {
  // destructuring object properties. it is more readable for me, 
  const { xCoor, yCoor, zCoor, 
          elecID, seizType, elecType } = electrodeDatum;

  const electrodeXSphere = new X.sphere();

  electrodeXSphere.center = [xCoor, yCoor, zCoor];
  // create the smaller magenta electrodes of this particular type
  if (elecType === "EG" || elecType === "MG") {
    electrodeXSphere.color = [1, 0, 1];
    electrodeXSphere.radius = 1 / 3;
  } else {
    electrodeXSphere.color = getSeizTypeColor(seizType);
    electrodeXSphere.radius = 1;
  }
  electrodeXSphere.visible = electrodeDatum.visible;
  electrodeXSphere.caption = elecID;
 
  return electrodeXSphere;
}

// this function draws the opaque blue shperes around a selected node
const drawElectrodeHighlightFx = (electrodeDatum) => {
  const { xCoor, yCoor, zCoor, elecID, elecType } = electrodeDatum;
  const electrodeXSphere = new X.sphere();

  electrodeXSphere.center = [xCoor, yCoor, zCoor];

  electrodeXSphere.color = [0, 0, 1];
  electrodeXSphere.opacity = 0.5;

  if (elecType === "EG" || elecType === "MG") {
    electrodeXSphere.radius = 1.3 / 5;
  } else {
    electrodeXSphere.radius = 1.3;
  }
  electrodeXSphere.visible = false;
  electrodeXSphere.caption = elecID;

  return electrodeXSphere;
}

// create cylinder between to nodes
const drawFmapFx = (startNode, endNode) => {
  const connection = new X.cylinder();
  connection.radius = 0.3;
  connection.start = [startNode.xCoor, startNode.yCoor, startNode.zCoor];
  connection.end = [endNode.xCoor, endNode.yCoor, endNode.zCoor];
  connection.visible = false;

  return connection;
}

// create a new X.cyilnder highlight between two nodes
const drawFmapHighlightFx = (fmap) => {
  const { start, end } = fmap;
  const highlight = new X.cylinder();
  highlight.radius = 0.4;
  highlight.start = start;
  highlight.end = end;
  highlight.opacity = 0.5;
  highlight.color = [0, 0, 1];
  highlight.visible = false;

  return highlight;
}


// finds the two electrodes in the data and calls the cylinder renderer
/**
 * 
 * @param {JSON} data 
 * @param {array} electrodes - Electrode Objects
 * @returns {array} - array of X.cyilinders
 */
const drawFmapConnections = (data, electrodes) => {
  const { fmapG1, fmapG2 } = data;
  const numEntries = fmapG1.length;

  const connections = [];

  for (let i = 0; i < numEntries; i++) {
    const electrodeStartIndex = fmapG1[i];
    const electrodeEndIndex = fmapG2[i];

    // since the data is generated from matlab, the indices need to be offset to 0-based
    const startNode = electrodes[electrodeStartIndex - 1];
    const endNode = electrodes[electrodeEndIndex - 1];

    if (startNode && endNode) {
      connections.push(drawFmapFx(startNode, endNode));
    }
  }

  return connections
}

const updateSliceLocation = (sliderControllers, volume, electrode) => {
  const { xSlice, ySlice, zSlice } = electrode;

  const xSlider = sliderControllers.find(controller => controller.property === 'indexX');
  const ySlider = sliderControllers.find(controller => controller.property === 'indexY');
  const zSlider = sliderControllers.find(controller => controller.property === 'indexZ');
  
  // move to the index property that matches with the slice number of the electrode
  volume.visible = !volume.visible;
  xSlider.object.indexX = xSlice;
  ySlider.object.indexY = ySlice;
  zSlider.object.indexZ = zSlice;
  volume.visible = !volume.visible;   
}

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
const initializeElectrodeIDMenu = (elObjects, idArray, selectionSpheres, data, volumeGUI, volume) => {
  const electrodeMenu = document.getElementById('electrode-menu');

  electrodeMenu.addEventListener('change', event => {
    const correspondingData = elObjects.find(e => e.elecID === event.target.value);
    printElectrodeInfo(correspondingData, idArray, selectionSpheres, data);
    if (event.target.value !== "None" && correspondingData) 
      updateSliceLocation(volumeGUI.__controllers, volume, correspondingData);

  })
  // append HTML option to drop down menu
  for (const entry of elObjects) {
    const newOption = document.createElement('option');
    newOption.value = entry.elecID;
    newOption.innerText = entry.elecID;
    electrodeMenu.appendChild(newOption);
  }
}

/**
 * 
 * @param {JSON} data 
 * @param {array} spheres 
 * @param {array} fmaps 
 */
const fillSeizureTypeBox = (data, spheres, fmaps) => {
  const seizureTypes = data.SeizDisplay;
  const displayMenu = document.getElementById('seizure-display-menu');

  // make ALL fmaps visible if user selects "Fun Mapping"
  displayMenu.addEventListener('change', event => {
    event.preventDefault();
    event.stopPropagation();
    const selectedType = event.target.value;
    if (selectedType === "funMapping"){
      fmaps.forEach(fmap => fmap.visible = true);
    }

    const selectedSeizType = data[selectedType];
    spheres.forEach((sphere, index) => {
      sphere.color = getSeizTypeColor(selectedSeizType[index]);
    })
  })

  // create the menu options for all of patients seizure types
  seizureTypes.forEach(type => {
    const newOption = document.createElement('option');
    newOption.value = type;
    newOption.innerText = type;
    displayMenu.appendChild(newOption);
  })
}
// redraw the fmaps, showing only the ones that have a caption
const redrawFmaps = (fmaps, captions) => {
  fmaps.forEach((fmap, index) => {
    if (captions[index]) {
      fmap.visible = true;
      fmap.caption = captions[index];
    } else {
      fmap.visible = false;
      fmap.caption = null;
    }
  })
}
/**
 * 
 * @param {array} electrodeData - The electrode objects
 * @param {array} fmaps - the X.cyilinders
 * @param {array} fmapHighlights - the X.cylinders which highlight
 */
const addEventsToFmapMenu = (electrodeData, fmaps, fmapHighlights) => {
  const fmapMenu = document.getElementById('fmap-menu')
  fmapMenu.addEventListener('change', event => {
    if (event.target.value !== "none") {
      redrawFmaps(fmaps, electrodeData[event.target.value]);
      document.getElementById('fmap-caption').innerText = 'No Functional Mapping Selected';
    } else {
      fmaps.forEach(fmap => fmap.visible = false);
    }
    fmapHighlights.forEach(fmap => fmap.visible = false);
  })
}

// find the electrode in the options and display the info on the panel
/**
 * 
*  @param {object} selectedElectrode
 * @param {array} idArray - full list of IDs
 * @param {array} selectionSpheres - opaque blue spheres that surround an electrode
 * @param {JSON} data 
 */
const printElectrodeInfo = (selectedElectrode, idArray, selectionSpheres, data) => {
  if (selectedElectrode) {
    const ID = selectedElectrode.elecID;
    updateLabels(selectedElectrode, data);
    highlightSelectedElectrode(ID, idArray, selectionSpheres);
  } else {
    console.log(`Could not find electrode with ID of ${ID}`);
  }
}

// find the specific electrode to highlight by making all but one invisible
const highlightSelectedElectrode = (ID, idArray, selector) => {
  for (var i = 0; i < idArray.length; i++) {
    if (idArray[i] === ID) {
      selector[i].visible = true;
    } else {
      selector[i].visible = false;
    }
  }
}

// make an electrode fmap highlighted by making all but one invisible
const highlightSelectedFmap = (fmapHighlights, index) => {
  fmapHighlights.forEach(fmap => fmap.visible = false);
  fmapHighlights[index].visible = true;
}

// changes the mosue to a crosshair for responsive selection
const addMouseHover = (renderer) => {
  renderer.interactor.onMouseMove= e => {
    let hoverObject = renderer.pick(e.clientX, e.clientY);
    if (hoverObject !== 0 ) {
      let selectedSphere = renderer.get(hoverObject) ;
      if (selectedSphere.g === "sphere" || selectedSphere.g === "cylinder") {
        document.body.style.cursor = 'crosshair';
      } else {
        selectedSphere.visible = true;
        selectedSphere = null;
        hoverObject = 0;
      }
    } else {
      document.body.style.cursor = 'auto';
    }
  }
}
/**
 * 
 * @param {object} electrode - the selected electrode object
 * @param {JSON} data - the JSON
 * 
 * It might be a bit foolish to have the data in two different formats like this. It would
 * be better if we could have it all as one form, but there are times when having the ready
 * made arrays from the JSON is very useful
 */

const updateLabels = (electrode, data) => {
  const {elecType, intPopulation, xCoor, yCoor, zCoor} = electrode;

  const seizTypeMenu = document.getElementById('seizure-display-menu');
  const intPopulationLabel = document.getElementById('int-population-label-inner');
  const seizTypeLabel = document.getElementById('seiz-type-label-inner');
  const coordinateLabel = document.getElementById('coordinates-label-inner');

  const selectedSeizType = seizTypeMenu.options[seizTypeMenu.selectedIndex].value;
  const seizureTypeValues = data[selectedSeizType];
  const allElectrodeIDs = data.elecID;

  document.getElementById('electrode-id-label-inner').innerText = electrode.elecID;
  document.getElementById('electrode-type-label-inner').innerText = elecType;
  coordinateLabel.innerText = `(${Math.round(xCoor)}, ${Math.round(yCoor)}, ${Math.round(zCoor)})`;
  
  if (selectedSeizType === "intPopulation") {
    intPopulationLabel.innerText = intPopulation;
    seizTypeLabel.innerText = '';
  } else {
    seizTypeLabel.innerText = seizureTypeValues[allElectrodeIDs.indexOf(electrode.elecID)];
    intPopulationLabel.innerText = '';
  }
}

/**
 * 
 * @param {X.renderer3D} renderer   - The main renderer
 * @param {object} datGUI           - GUI controller
 * @param {array} spheres           - Array of X.spheres that represent electrodes
 * @param {JSON} data               - Original JSON data
 * @param {array} selections        - Opaque blue spheres that highlight an electrode
 * @param {array} IDs               - Array of elecIDs
 * @param {array} electrodeObjects  - array of data packaged into objects
 * @param {array} fmaps             - Array of X.cylinders
 * @param {array} fmapHighlights    - Opaque blue cyilnders that surround fmaps
 * @param {X.volume} volumeRendered - The volume displayed on slices
 * 
 * This function is responsible for way too much. Would be good to find a way to break
 * it down into more reasonable components. It adds an event listener to the canvas,
 * does object picking, highlights an electrode, jumps the slices, and displays
 * captions on the panel
 */

const jumpSlicesOnClick = (
  renderer, datGUI, spheres, data, 
  selections, IDs, electrodeObjects,
  fmaps, fmapHighlights, volumeRendered
) => {
  // get the main canvas
  const canvas = document.getElementsByTagName('canvas')[0];
    canvas.addEventListener('click', e => {
      const clickedObject = renderer.pick(e.clientX, e.clientY);
      // check if it actually has an ID
      if (clickedObject !== 0) {
        const selectedObject = renderer.get(clickedObject);
        // ".g" is an object property that corresponds to the selected X.object's name
        if (selectedObject.g === "sphere") {
          // find the actual electrode in the array of XTK spheres
          const sphereIndex = spheres.indexOf(selectedObject);

          if (sphereIndex >= 0) {
            // electrodeObjects != xtk spheres!! The electrode objects are an array of objects. the OOP
            // style allows for all their data points to be bundled together
            const target = electrodeObjects[sphereIndex];
            
            // destructure out the needed properties
            const { elecID } = target;

            // highlight and show the needed captions on the menu
            highlightSelectedElectrode(elecID, IDs, selections);
            updateLabels(target, data);
       
            // sync with electrode menu options
            const electrodeIDMenuOptions = document.getElementById('electrode-menu').options;
            electrodeIDMenuOptions.selectedIndex = sphereIndex + 1;
            
            updateSliceLocation(datGUI.__controllers, volumeRendered, target)  ;                  
          }
        } else if (selectedObject.g === "cylinder") {
          const cylinderIndex = fmaps.indexOf(selectedObject);
          if (cylinderIndex >= 0) {
            document.getElementById('fmap-caption').innerText = selectedObject.caption;
            highlightSelectedFmap(fmapHighlights, cylinderIndex);
          }
        }
      }
    }) // end of event lsitener
}

const loadElectrodes = (renderer, volumeGUI, volume, mode, subject) => {
  (async () => {
    // initial data load
    const electrodeJSONData = mode === "umb" ?
      await (await fetch(`./data/JSON/sample.json`)).json()
    : await (await fetch (`${window.location.protocol}//ievappwpdcpvm01.nyumc.org/?file=${subject}.json`)).json()

    // can choose any property here, but it must have same length as other properties to work
    const numberOfElectrodes = electrodeJSONData.coorX.length;
    
    // this is a work-around from a glitch with the "show all tags" button. we have to offset each coordinate
    // by the bounding box, then reset it. hopefully this can be fixed one day
    const oldBoundingBox = renderer.u;

    document.getElementById('subject-id-lbl').innerText = electrodeJSONData.subjID;
    document.getElementById('num-seiz-types-lbl').innerText = electrodeJSONData.totalSeizType;

    // contains the array of IDs from the JSON
    const electrodeIDs = electrodeJSONData.elecID;
    
    const electrodeObjects = Array
      .apply(null, Array(numberOfElectrodes))
      .map((_, index) => getElectrodeObject(electrodeJSONData, index, oldBoundingBox));

    // arrays of objects
    const electrodeSpheres = electrodeObjects.map(el => drawElectrodeFx(el, renderer));
    const selectionSpheres = electrodeObjects.map(el => drawElectrodeHighlightFx(el));
    const fmapConnections = drawFmapConnections(electrodeJSONData, electrodeObjects, renderer);
    const fmapHighlights = fmapConnections.map(fmap => drawFmapHighlightFx(fmap));

    // add XTK's graphical representation of data to renderer
    electrodeSpheres.forEach(el => renderer.add(el));
    selectionSpheres.forEach(el => renderer.add(el));
    fmapConnections.forEach(connection => renderer.add(connection));
    fmapHighlights.forEach(highlight => renderer.add(highlight));

    // adds the seizure types to the first drop down menu on the panel
    fillSeizureTypeBox(electrodeJSONData, electrodeSpheres, fmapConnections, volume, renderer);

    // adds the IDs to the elctrode ID menu and sets up event listeners
    initializeElectrodeIDMenu(electrodeObjects, electrodeIDs, selectionSpheres, 
                          electrodeJSONData, volumeGUI, volume);
    
    // this needs to be refactored
    jumpSlicesOnClick(renderer, volumeGUI, electrodeSpheres, electrodeJSONData, selectionSpheres, 
                         electrodeIDs, electrodeObjects, fmapConnections, fmapHighlights, volume);

    // adds functionality for hovering over particular electrodes on the scene
    addMouseHover(renderer);

    // adds the event listners to the functional map menu
    addEventsToFmapMenu(electrodeJSONData, fmapConnections, fmapHighlights);
    
    // create an array of sphere IDs (internal to XTK) for the "show all tags" button
    const sphereIDs = electrodeSpheres.map(el => el.id);

    // adds event listener to the show-all-tags button on the menu
    const tagsBtn = document.getElementById('show-tags-btn')
    tagsBtn.addEventListener('click', () => {
      renderer.resetBoundingBox();
      renderer.showAllCaptions(sphereIDs);
    });
  })();
}

export { loadElectrodes };
