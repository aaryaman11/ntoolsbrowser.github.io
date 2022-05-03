import { loadElectrodes } from "./js/electrodes.js";

("use strict");

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
  leftHemisphereMesh.color = [1, 1, 1];
  rightHemisphereMesh.color = [1, 1, 1];
  leftHemisphereMesh.opacity = 0.5;
  rightHemisphereMesh.opacity = 0.5;

  // configure files
  const [mode, subject] = parseURL();
  const protocol = window.location.protocol;
  const baseURL = `ievappwpdcpvm01.nyumc.org/?bids=ana&?file=sub-${subject}`

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
    console.log(volumeURL);
    if (!checkUrls(volumeURL, lhURL, rhURL)){
      return;
    }

    volume.file = volumeURL;
    leftHemisphereMesh.file = lhURL;
    rightHemisphereMesh.file = rhURL;
  }

  // set up 3D renderer
  const threeDRenderer = new X.renderer3D();
  threeDRenderer.container = "3d";
  threeDRenderer.init();
  threeDRenderer.add(leftHemisphereMesh);
  threeDRenderer.add(rightHemisphereMesh);
  threeDRenderer.add(volume);
  threeDRenderer.render(); // triggers the onShowtime 

  // onShowtime gets called before first rendering happens
  threeDRenderer.onShowtime = () => {

    const gui = new dat.GUI();
    gui.domElement.id = "gui";

    volume.visible = false;

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
    };

    signalGUI.add(playSignalController, "start / stop");

    // leftHemisphereGUI.open();
    // rightHemisphereGUI.open();
    // slicesGUI.open();
    signalGUI.open();

    // fix original camera position
    threeDRenderer.camera.position = [-200, 0, 0];

    loadElectrodes(
      threeDRenderer,
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

const checkUrls = (...urls) => {
  for (const url of urls) {
    const request = new XMLHttpRequest();
    request.open("HEAD", url, false);
    request.send();
    if (request.status === 404) {
      alert(`Could not load file from ${url}`)
      return false;
    }
  }
  return true;
};
