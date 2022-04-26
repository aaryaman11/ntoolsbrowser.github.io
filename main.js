import { loadElectrodes } from "./js/electrodes.js";

("use strict");

((main) => {
  document.readyState == "complete"
    ? main()
    : window.addEventListener("load", main);
})(() => {
  const [mode, subject] = parse();
  const volume = loadVolume(subject);
  const [leftHemisphereMesh, rightHemisphereMesh] = loadSurfaces(subject);
  const [threeDRenderer, sliceX, sliceY, sliceZ] = initRenderers();
  const loadingText = document.getElementById('loading-text');

  threeDRenderer.add(leftHemisphereMesh);
  threeDRenderer.add(rightHemisphereMesh);

  sliceX.add(volume);
  sliceX.render();

   const toggleSliceOnScroll = () => {
      volume.visible = !volume.visible;
      volume.visible = !volume.visible;
    };
  
  loadingText.innerText = "Rendering Volume...";
  sliceX.onShowtime = () => {
    // this is triggered manually by sliceX.render() just 2 lines above
    // execution happens after volume is loaded
    sliceY.add(volume);
    sliceY.render();
    sliceZ.add(volume);
    sliceZ.render();

    // const toggleSliceOnScroll = () => {
    //   volume.visible = !volume.visible;
    //   volume.visible = !volume.visible;
    // };
    sliceX.onScroll = () => toggleSliceOnScroll();
    sliceY.onScroll = () => toggleSliceOnScroll();
    sliceZ.onScroll = () => toggleSliceOnScroll();

    threeDRenderer.add(volume);
    volume.visible = false;
    threeDRenderer.render(); // this one triggers the loading of LH and then the onShowtime for the 3d renderer
    
  };
  
  // the onShowtime function gets called automatically, just before the first rendering happens
  threeDRenderer.onShowtime = () => {
    loadingText.innerText = "";
    // add the GUI once data is done loading
    const gui = new dat.GUI();
    gui.domElement.id = 'gui';
    document.getElementById('gui').style.zIndex = 2;

    const volumeGUI = gui.addFolder("Volume");
    volumeGUI.add(volume, "opacity", 0, 1);
    volumeGUI.add(volume, "lowerThreshold", volume.min, volume.max);
    volumeGUI.add(volume, "upperThreshold", volume.min, volume.max);
    volumeGUI.add(volume, "windowLow", volume.min, volume.max);
    volumeGUI.add(volume, "windowHigh", volume.min, volume.max);

    // slice indicies
    volumeGUI.add(volume, "indexX", 0, volume.dimensions[0] - 1);
    volumeGUI.add(volume, "indexY", 0, volume.dimensions[1] - 1);
    volumeGUI.add(volume, "indexZ", 0, volume.dimensions[2] - 1);

    // hemisphere GUIs
    const leftHemisphereGUI = gui.addFolder("Left Hemisphere");
    leftHemisphereGUI.add(leftHemisphereMesh, "visible");
    leftHemisphereGUI.add(leftHemisphereMesh, "opacity", 0, 1);
    leftHemisphereGUI.addColor(leftHemisphereMesh, "color");

    const rightHemisphereGUI = gui.addFolder("Right Hemisphere");
    rightHemisphereGUI.add(rightHemisphereMesh, "visible");
    rightHemisphereGUI.add(rightHemisphereMesh, "opacity", 0, 1);
    rightHemisphereGUI.addColor(rightHemisphereMesh, "color");

    // making slices invisible
    const slicesGUI = gui.addFolder("Slices");
    slicesGUI.add(volume, "visible");

    const signalGUI = gui.addFolder("Electrode Signal");
    const playSignalController = {
      "start / stop": function () { },
    };

    signalGUI.add(playSignalController, "start / stop");
    
    // work-around for sliders operating on invisible volume
    const sliderControllers = volumeGUI.__controllers;
    const xSlider = sliderControllers.find(c => c.property === "indexX");
    const ySlider = sliderControllers.find(c => c.property === "indexY");
    const zSlider = sliderControllers.find(c => c.property === "indexZ");
    xSlider.__onChange = () => toggleSliceOnScroll();
    ySlider.__onChange = () => toggleSliceOnScroll();
    zSlider.__onChange = () => toggleSliceOnScroll();

    volumeGUI.open();
    // leftHemisphereGUI.open();
    // rightHemisphereGUI.open();
    // slicesGUI.open();
    signalGUI.open();

    // fix original camera position
    threeDRenderer.camera.position = [0, 200, 0];

    loadElectrodes(
      threeDRenderer,
      volumeGUI,
      volume,
      mode,
      subject,
      playSignalController
    );

    // this should ideally reset the colormap and labelmap of volume
    // whenever the menu is changed. It also will put the appropriate
    // color legend on the screen

    const displayMenu = document.getElementById("seizure-display-menu");
    const seizTypeList = document.getElementById("seiztype-list");
    const intPopList = document.getElementById("int-pop-list");

    displayMenu.addEventListener("change", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const selectedSeizType = event.target.value;

      if (selectedSeizType === "intPopulation") {
        intPopList.style.visibility = "visible";
        seizTypeList.style.visibility = "hidden";

        volume.labelmap.file =
          mode === "demo"
            ? `./data/${subject}/volume/${subject}_intPopulation_labels.nii`
            : `${window.location.protocol}//ievappwpdcpvm01.nyumc.org/?file=${subject}_intPopulation_labels.nii`;

        volume.labelmap.colortable.file =
          "./data/colormaps/colormap_intpop.txt";
      } else {
        seizTypeList.style.visibility = "visible";
        intPopList.style.visibility = "hidden";
        volume.labelmap.file =
          mode === "demo"
            ? `./data/${subject}/volume/${subject}_${selectedSeizType}_labels.nii`
            : `${window.location.protocol}//ievappwpdcpvm01.nyumc.org/?file=${subject}_${selectedSeizType}_labels.nii`;
        volume.labelmap.colortable.file =
          "./data/colormaps/colormap_seiztype.txt";
      }

      volume.modified();
    });
  };
});

/**
 * loads the .nii data into a X.volume and returns it
 * @returns {X.volume}
 */
const loadVolume = (subject) => {
  let volume = new X.volume();
  volume.file = `./data/${subject}/volume/${subject}_T1.nii`;
  volume.labelmap.file = `./data/${subject}/volume/${subject}_default_labels.nii`;
  volume.labelmap.colortable.file = `./data/colormaps/colormap_seiztype.txt`;
  volume.modified();
  return volume;
};

/**
 * Loads the .pial data into two X.meshes and returns them
 * @returns {[X.mesh, X.mesh]}
 */
const loadSurfaces = (subject) => {
  const leftHemisphere = new X.mesh();
  const rightHemisphere = new X.mesh();

  leftHemisphere.file = `./data/${subject}/meshes/${subject}_lh.pial`;
  rightHemisphere.file = `./data/${subject}/meshes/${subject}_rh.pial`;

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
  threeDRenderer.container = "3d";
  threeDRenderer.init();

  const sliceX = new X.renderer2D();
  sliceX.pickable = false;
  sliceX.container = "sliceX";
  sliceX.orientation = "X";
  sliceX.init();

  const sliceY = new X.renderer2D();
  sliceY.pickable = false;
  sliceY.container = "sliceY";
  sliceY.orientation = "Y";
  sliceY.init();

  const sliceZ = new X.renderer2D();
  sliceZ.pickable = false;
  sliceZ.container = "sliceZ";
  sliceZ.orientation = "Z";
  sliceZ.init();

  return [threeDRenderer, sliceX, sliceY, sliceZ];
};

// matches mode/subject by regex match and removes '=' character
const parse = () => {
  const userSearch = document.location.search;
  return [...userSearch.matchAll("=[a-zA-Z]+")].map((match) =>
    match[0].slice(1)
  );
};
