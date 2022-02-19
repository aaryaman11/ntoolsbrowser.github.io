//var subject = localStorage.getItem("user-search") // get the subject name from search page
import { loadElectrodes } from './scripts/electrodes.js'

'use strict';

(main => {
  document.readyState == 'complete' ? 
    main() 
  : window.addEventListener('load', main)
})(() => {
    
  // const niftiFile = `./data/volumesT1_RAS.nii`;
  // const niftiLabelMap = `../data/fsaverage_default_labels.nii`
  // const niftiColorTable = `../data/colormap_seiztype.txt`

  // const volume = createVolume(niftiFile)
  // const volumeWithLabelmap = createVolume(niftiFile, niftiLabelMap, niftiColorTable);

  const volume = loadVolume();
  const [leftHemisphereMesh, rightHemisphereMesh] = loadSurfaces();
  const [threeDRenderer, sliceX, sliceY, sliceZ] = initRenderers();

  threeDRenderer.add(leftHemisphereMesh);
  threeDRenderer.add(rightHemisphereMesh);
  
  sliceX.add(volume);
  sliceX.render();

  sliceX.onShowtime = () => {
    // this is triggered manually by sliceX.render() just 2 lines above
    // execution happens after volume is loaded
    sliceY.add(volume);
    sliceY.render();
    sliceZ.add(volume);
    sliceZ.render();
    
    const toggleSliceOnScroll = () => {
      volume.visible = !volume.visible;
      volume.visible = !volume.visible;
    }
    sliceX.onScroll = () => toggleSliceOnScroll();
    sliceY.onScroll = () => toggleSliceOnScroll();
    sliceZ.onScroll = () => toggleSliceOnScroll();

    threeDRenderer.add(volume);
    volume.visible = false;
    threeDRenderer.render(); // this one triggers the loading of LH and then the onShowtime for the 3d renderer
  };

  // the onShowtime function gets called automatically, just before the first rendering happens
  threeDRenderer.onShowtime = () => {
    // add the GUI once data is done loading
    const gui = new dat.GUI();
    // gui.domElement.id = 'gui';

    const volumeGUI = gui.addFolder('Volume');
    volumeGUI.add(volume, 'opacity', 0, 1);
    volumeGUI.add(volume, 'lowerThreshold', volume.min, volume.max);
    volumeGUI.add(volume, 'upperThreshold', volume.min, volume.max);
    volumeGUI.add(volume, 'windowLow', volume.min, volume.max);
    volumeGUI.add(volume, 'windowHigh', volume.min, volume.max);

    // slice indicies
    volumeGUI.add(volume, 'indexX', 0, volume.dimensions[0] - 1);
    volumeGUI.add(volume, 'indexY', 0, volume.dimensions[1] - 1);
    volumeGUI.add(volume, 'indexZ', 0, volume.dimensions[2] - 1);

    // hemisphere GUIs
    const leftHemisphereGUI = gui.addFolder('Left Hemisphere');
    leftHemisphereGUI.add(leftHemisphereMesh, 'visible');
    leftHemisphereGUI.add(leftHemisphereMesh, 'opacity', 0, 1);
    leftHemisphereGUI.addColor(leftHemisphereMesh, 'color');

    const rightHemisphereGUI = gui.addFolder('Right Hemisphere');
    rightHemisphereGUI.add(rightHemisphereMesh, 'visible');
    rightHemisphereGUI.add(rightHemisphereMesh, 'opacity', 0, 1);
    rightHemisphereGUI.addColor(rightHemisphereMesh, 'color');

    // making slices invisible
    const slicesGUI = gui.addFolder('Slices');
    slicesGUI.add(volume, 'visible');

    volumeGUI.open();
    leftHemisphereGUI.open();
    rightHemisphereGUI.open();
    slicesGUI.open();

    // fix original camera position
    threeDRenderer.camera.position = [0, 200, 0];

    const [mode, subject] = parse();
    loadElectrodes(threeDRenderer, volumeGUI, volume, mode, subject);

    // this should ideally reset the colormap and labelmap of volume
    // whenever the menu is changed. It also will put the appropriate
    // color legend on the screen

    // const displayMenu = document.getElementById('seizure-display-menu')
    // const seizTypeList = document.getElementById('seiztype-list')
    // const intPopList = document.getElementById('int-pop-list')

    // displayMenu.addEventListener('change', event => {
    //   event.preventDefault()
    //   event.stopPropagation()
    //   const selectedSeizType = event.target.value

    //   volume.modified()
    // })
    
  };
})

/**
 * loads the .nii data into a X.volume and returns it
 * @returns {X.volume}
 */
const loadVolume = () => {
  let volume = new X.volume();
  volume.file = `./data/volumes/T1_RAS.nii`;
  volume.labelmap.file = `./data/volumes/fsaverage_default_labels.nii`;
  volume.labelmap.colortable.file = `./data/volumes/colormap_seiztype.txt`;
  volume.modified();
  return volume;
};

const createVolume = (file, labelmap = null, colormap = null) => {
  let v = new X.volume();
  v.file = file;
  if (labelmap != null && colormap != null) {
    v.labelmap.file = labelmap;
    v.labelmap.colortable.file = colormap;
  }
  v.modified();
  return v;
}

/**
 * Loads the .pial data into two X.meshes and returns them
 * @returns {[X.mesh, X.mesh]}
 */
const loadSurfaces = () => {
  const leftHemisphere = new X.mesh();
  const rightHemisphere = new X.mesh();

  leftHemisphere.file = `./data/meshes/lh.pial`;
  rightHemisphere.file = `./data/meshes/rh.pial`;

  leftHemisphere.color = [1, 1, 1];
  rightHemisphere.color = [1, 1, 1];

  leftHemisphere.opacity = 0.5;
  rightHemisphere.opacity = 0.5;

  leftHemisphere.pickable = false;
  rightHemisphere.pickable = false;

  return [leftHemisphere, rightHemisphere];
};
/**
 * Initializes the renderers and sets them to their needed container
 * @returns {[X.renderer3D, x.renderer2D, X.renderer2D, X.renderer2D]}
 */

const initRenderers = () => {
  const threeDRenderer = new X.renderer3D();
  threeDRenderer.container = '3d';
  threeDRenderer.init();

  const sliceX = new X.renderer2D();
  sliceX.pickable = false;
  sliceX.container = 'sliceX';
  sliceX.orientation = 'X';
  sliceX.init();

  const sliceY = new X.renderer2D();
  sliceY.pickable = false;
  sliceY.container = 'sliceY';
  sliceY.orientation = 'Y';
  sliceY.init();

  const sliceZ = new X.renderer2D();
  sliceZ.pickable = false;
  sliceZ.container = 'sliceZ';
  sliceZ.orientation = 'Z';
  sliceZ.init();

  return [threeDRenderer, sliceX, sliceY, sliceZ];
}

// from http://stackoverflow.com/a/7826782/1183453
const parse = () => {

      const args = document.location.search
                    .substring(1)
                    .split('&')
                    .filter(arg => arg != '');
      const argsParsed = {};

      for (const arg of args) {
          const currentArg = unescape(arg);

          if (currentArg.indexOf('=') === -1) {
            argsParsed[currentArg.replace(new RegExp('/$'),'').trim()] = true;
          }
          else {
            const keyValPair = currentArg.split('=');
            argsParsed[keyValPair[0].trim()] = keyValPair[1].replace(new RegExp('/$'),'').trim();
          }
      }
    
    return [argsParsed['mode'], argsParsed['subject']]
}
