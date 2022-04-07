// create the graphical electrode on the canvas
import { getSeizTypeColor, COLOR } from "./color.js";

//? might make sense to refactor this into a class?
// object which contains all of the old functions for rendering from electrodes.js
// can be called with GFX.function(args)
const GFX = {
  drawElectrodeFx: (electrodeDatum, isHighlight) => {
    // destructuring object properties. it is more readable for me,
    const { xCoor, yCoor, zCoor, elecID, seizType, elecType } = electrodeDatum;
    const electrodeXSphere = new X.sphere();
    electrodeXSphere.center = [xCoor, yCoor, zCoor];
    electrodeXSphere.visible = electrodeDatum.visible;
    electrodeXSphere.caption = elecID;
    // create the smaller magenta electrodes of this particular type
    // TODO: add support for EG/MG with highlight
    if (isSpecialType(elecType)) {
      electrodeXSphere.color = COLOR.magenta;
      electrodeXSphere.radius = 1 / 3;
    } else if (isHighlight) {
      electrodeXSphere.color = COLOR.blue;
      electrodeXSphere.opacity = 0.5;
      electrodeXSphere.radius = 1.3;
      electrodeXSphere.visible = false;
    } else {
      electrodeXSphere.color = getSeizTypeColor(seizType);
      electrodeXSphere.radius = 1;
    }

    return electrodeXSphere;
  },
  drawFmapFx: (data, electrodes) => {
    // in the current JSON format, fmapG1 and fmapG2 are full arrays. this will have
    // to change in the new format
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
        connections.push(drawFmapConnection(startNode, endNode));
      }
    }

    return connections;
  },
  drawFmapHighlightFx: (fmap) => {
    const { start, end } = fmap;
    const highlight = new X.cylinder();
    highlight.radius = 0.4;
    highlight.start = start;
    highlight.end = end;
    highlight.opacity = 0.5;
    highlight.color = COLOR.blue;
    highlight.visible = false;

    return highlight;
  },
  highlightSelectedElectrode: (ID, idArray, selector) => {
    for (var i = 0; i < idArray.length; i++) {
      if (idArray[i] === ID) {
        selector[i].visible = true;
      } else {
        selector[i].visible = false;
      }
    }
  },
  redrawFmaps: (fmaps, captions) => {
    fmaps.forEach((fmap, index) => {
      if (captions[index]) {
        fmap.visible = true;
        fmap.caption = captions[index];
      } else {
        fmap.visible = false;
        fmap.caption = null;
      }
    });
  },
  highlightSelectedFmap: (fmapHighlights, index) => {
    fmapHighlights.forEach((fmap) => (fmap.visible = false));
    fmapHighlights[index].visible = true;
  },
};

const isSpecialType = (type) => type === "EG" || type === "MG";

// create cylinder between to nodes
const drawFmapConnection = (startNode, endNode) => {
  const connection = new X.cylinder();
  connection.radius = 0.3;
  connection.start = [startNode.xCoor, startNode.yCoor, startNode.zCoor];
  connection.end = [endNode.xCoor, endNode.yCoor, endNode.zCoor];
  connection.visible = false;

  return connection;
};

export { GFX };
