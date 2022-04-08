// create the graphical electrode on the canvas
import { getSeizTypeColor, COLOR } from "./color.js";

//? might make sense to refactor this into a class?
// object which contains all of the old functions for rendering from electrodes.js
// can be called with GFX.function(args)
const GFX = {
  drawElectrodeFx: (electrodeDatum, isHighlight, seizType, bbox = [0, 0, 0]) => {

    const { coordinates, elecID, elecType } = electrodeDatum;
    const { x, y, z } = coordinates;
    const [ xOffset, yOffset, zOffset ] = bbox;
    const electrodeXSphere = new X.sphere();
    
    electrodeXSphere.center = [x + xOffset, y + yOffset, z + zOffset];
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
  drawFmapFx: (fmapData, electrodeData) => {
    return fmapData.map(({ fmapG1, fmapG2}) => {
      const startNode = electrodeData[fmapG1.index];
      const endNode = electrodeData[fmapG2.index];
      return drawFmapConnection(startNode, endNode);
    });
  },
  drawFmapHighlightFx: (fmap) => {
    // start and end vector of original connection
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
  highlightSelectedElectrode: (selector, index) => {
    selector.forEach(s => s.visible = false)
    selector[index].visible = true;
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
const drawFmapConnection = (startNode, endNode, radius = 0.3) => {
  const connection = new X.cylinder();
  const { x: x1, y: y1, z: z1 } = startNode.coordinates; 
  const { x: x2, y: y2, z: z2 } = endNode.coordinates;

  connection.start = [x1, y1, z1];
  connection.end = [x2, y2, z2];
  connection.radius = radius;
  connection.visible = false;

  return connection;
};

export { GFX };
