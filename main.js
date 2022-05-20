import { loadElectrodes } from "./js/electrodes.js";


"use strict";
// execute the code below if the document is loaded. otherwise, add the code below
// to the window as an event listener onload.
((main) => {
  document.readyState == "complete"
  ? main()
  : window.addEventListener("load", main);
})(() => {
  
  const volume = new X.volume();
  const leftHemisphereMesh = new X.mesh();
  const rightHemisphereMesh = new X.mesh();

  volume.pickable = false;
  leftHemisphereMesh.pickable = false;
  rightHemisphereMesh.pickable = false;
  leftHemisphereMesh.opacity = 0.5;
  rightHemisphereMesh.opacity = 0.5;

  // configure files
  const [mode, subject] = parseURL();
  const protocol = window.location.protocol;
  const baseURL = `ievappwpdcpvm01.nyumc.org/?bids=ana&file=sub-${subject}`

  // load either our local sample files, or get the files at the URL
  if (mode === "demo") {
    const volumePath = `./data/${subject}/volume/${subject}_T1.nii`;
    const lhPath = `./data/${subject}/meshes/${subject}_lh.pial`;
    const rhPath = `./data/${subject}/meshes/${subject}_rh.pial`;
    if (!checkUrls(volumePath, lhPath, rhPath))
      return;
    
    volume.file = volumePath;
    rightHemisphereMesh.file = rhPath;
    leftHemisphereMesh.file = lhPath;
  } else {
    const volumeURL = `${protocol}//${baseURL}_preoperation_T1w.nii`;
    const lhURL = `${protocol}//${baseURL}_freesurferleft.pial`;
    const rhURL = `${protocol}//${baseURL}_freesurferright.pial`;
    if (!checkUrls(volumeURL, lhURL, rhURL)){
      return;
    }

    volume.file = volumeURL;
    leftHemisphereMesh.file = lhURL;
    rightHemisphereMesh.file = rhURL;
  }

  // init 3D renderer and add 3D volume and meshes
  const renderer = new X.renderer3D();
  renderer.container = "3d";
  renderer.init();
  renderer.add(leftHemisphereMesh);
  renderer.add(rightHemisphereMesh);
  renderer.add(volume);
  renderer.render(); // triggers the onShowtime 

  // onShowtime gets called before first rendering happens
  renderer.onShowtime = () => {

    const gui = new dat.GUI();
    gui.domElement.id = "gui";

    volume.visible = false;
    const volumeGUI = gui.addFolder("Volume");
    volumeGUI.add(volume, "visible");

    // hemisphere GUIs
    const leftHemisphereGUI = gui.addFolder("Left Hemisphere");
    leftHemisphereGUI.add(leftHemisphereMesh, "visible");
    leftHemisphereGUI.add(leftHemisphereMesh, "opacity", 0, 1);
    leftHemisphereGUI.addColor(leftHemisphereMesh, "color");

    const rightHemisphereGUI = gui.addFolder("Right Hemisphere");
    rightHemisphereGUI.add(rightHemisphereMesh, "visible");
    rightHemisphereGUI.add(rightHemisphereMesh, "opacity", 0, 1);
    rightHemisphereGUI.addColor(rightHemisphereMesh, "color");

    const signalGUI = gui.addFolder("Electrode Signal");
    const playSignalController = {
      "start / stop": function () {},
      "sin wave": function() {}
    };

    signalGUI.add(playSignalController, "start / stop");
    signalGUI.add(playSignalController, "sin wave");
    signalGUI.open();

    // fix original camera position
    renderer.camera.position = [-200, 0, 0];

    loadElectrodes(
      renderer,
      volume,
      mode,
      subject,
      playSignalController
    );

    const seizTypeList = document.getElementById("seiztype-list");
    const intPopList = document.getElementById("int-pop-list");

    // toggle color legends for intpop and seiztype
    document.getElementById("seizure-display-menu")
      .addEventListener("change", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.target.value === "intPopulation") {
          intPopList.style.visibility = "visible";
          seizTypeList.style.visibility = "hidden";
        } else {
          seizTypeList.style.visibility = "visible";
          intPopList.style.visibility = "hidden";
        }
      });
  };
});

// matches mode/subject by regex match and removes '=' character
const parseURL = () => {
  const userSearch = document.location.search;
  return [...userSearch.matchAll("=[a-zA-Z0-9]+")].map((match) =>
    match[0].slice(1)
  );
};

// adapted from https://stackoverflow.com/questions/31710768/how-can-i-fetch-an-array-of-urls-with-promise-all
// This will provide mode meaningful errors when a file can't be found
const checkUrls = async (...urls) => {
  Promise.all(urls.map(url => {
    fetch(url).then(async (res) => {
      if (!res.ok) {
        console.error(`Could not find ${url}`);
      }
    })
  }));
};
