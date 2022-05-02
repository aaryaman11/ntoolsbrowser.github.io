import { loadElectrodes } from "./js/electrodes.js";

("use strict");

((main) => {
  document.readyState == "complete"
    ? main()
    : window.addEventListener("load", main);
})(() => {
  const [mode, subject] = parseURL();
  const volume = loadVolume(subject, mode);
  const [leftHemisphereMesh, rightHemisphereMesh] = loadSurfaces(subject, mode);
  const threeDRenderer = initRenderers();

  threeDRenderer.add(leftHemisphereMesh);
  threeDRenderer.add(rightHemisphereMesh);
  threeDRenderer.add(volume);
  threeDRenderer.render(); // triggers the onShowtime for 3d renderer

  // onShowtime gets called automatically, before first rendering happens
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

/**
 * loads the .nii data into a X.volume and returns it
 * @returns {X.volume}
 */
const loadVolume = (subject, mode) => {
  const volume = new X.volume();

  const filePath =
    mode === "demo"
      ? `./data/${subject}/volume/${subject}_T1.nii`
      : `${window.location.protocol}//ievappwpdcpvm01.nyumc.org/?file=sub-${subject}_preoperation_T1w.nii&bids=ana`;

  if (checkUrls(filePath)) {
    volume.file = filePath;
    return volume;
  }
  return null;
};

/**
 * Loads the .pial data into two X.meshes and returns them
 * @returns {[X.mesh, X.mesh]}
 */
const loadSurfaces = (subject, mode) => {
  const leftHemisphere = new X.mesh();
  const rightHemisphere = new X.mesh();

  const leftHemispherePath =
    mode === "demo"
      ? `./data/${subject}/meshes/${subject}_lh.pial`
      : `${window.location.protocol}//ievappwpdcpvm01.nyumc.org/?file=sub-${subject}_freesurferleft.pial&bids=ana`;

  const rightHemispherePath =
    mode === "demo"
      ? `./data/${subject}/meshes/${subject}_rh.pial`
      : `${window.location.protocol}//ievappwpdcpvm01.nyumc.org/?file=sub-${subject}_freesurferright.pial&bids=ana`;

  if (!checkUrls(leftHemispherePath, rightHemispherePath)) {
    return null;
  }

  leftHemisphere.file = leftHemispherePath;
  rightHemisphere.file = rightHemispherePath;

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

  return threeDRenderer;
};

// matches mode/subject by regex match and removes '=' character
const parseURL = () => {
  const userSearch = document.location.search;
  return [...userSearch.matchAll("=[a-zA-Z]+")].map((match) =>
    match[0].slice(1)
  );
};

const checkUrls = (...urls) => {
  for (const url of urls) {
    const request = new XMLHttpRequest();
    request.open("HEAD", url, false);
    request.send();
    if (request.status === 404) {
      alert(`File ${url} not found.`);
      return false;
    }
  }
  return true;
};
