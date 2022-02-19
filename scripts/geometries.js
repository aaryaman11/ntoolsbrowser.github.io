import { getSeizTypeColor } from './color.js'

// create the graphical electrode on the canvas
export function drawElectrodeFx(electrodeDatum) {
  // destructuring object properties. it is more readable for me, 
  const { xCoor, yCoor, zCoor, 
          elecID, seizType, elecType } = electrodeDatum;

  const electrodeXSphere = new X.sphere();

  electrodeXSphere.center = [xCoor, yCoor, zCoor]
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
export function drawHighlightFx(electrodeDatum) {
  const { xCoor, yCoor, zCoor, elecID, elecType } = electrodeDatum;
  const electrodeXSphere = new X.sphere()

  electrodeXSphere.center = [xCoor, yCoor, zCoor]

  electrodeXSphere.color = [0, 0, 1]
  electrodeXSphere.opacity = 0.5

  if (elecType === "EG" || elecType === "MG") {
    electrodeXSphere.radius = 1.3 / 5
  } else {
    electrodeXSphere.radius = 1.3
  }
  electrodeXSphere.visible = false
  electrodeXSphere.caption = elecID

  return electrodeXSphere
}

// create cylinder between to nodes
export function drawConnectionFx(startNode, endNode) {
  const connection = new X.cylinder()
  connection.radius = 0.3
  connection.start = [startNode.xCoor, startNode.yCoor, startNode.zCoor]
  connection.end = [endNode.xCoor, endNode.yCoor, endNode.zCoor]
  connection.visible = false

  return connection
}

// create a new X.cyilnder highlight between two nodes
export function drawFmapHighlightFx(fmap) {
  const { start, end } = fmap
  const highlight = new X.cylinder()
  highlight.radius = 0.4
  highlight.start = start
  highlight.end = end
  highlight.opacity = 0.5
  highlight.color = [0, 0, 1]
  highlight.visible = false

  return highlight
}


// // finds the two electrodes in the data and calls the cylinder renderer
// /**
//  * 
//  * @param {JSON} data 
//  * @param {array} electrodes - Electrode Objects
//  * @returns {array} - array of X.cyilinders
//  */
// export default function drawFmapConnections(data, electrodes) {
//   const { fmapG1, fmapG2 } = data
//   const numEntries = fmapG1.length

//   const connections = []

//   for (let i = 0; i < numEntries; i++) {
//     const electrodeStartIndex = fmapG1[i]
//     const electrodeEndIndex = fmapG2[i]

//     // since the data is generated from matlab, the indices need to be offset to 0-based
//     const startNode = electrodes[electrodeStartIndex - 1]
//     const endNode = electrodes[electrodeEndIndex - 1]

//     if (startNode && endNode) {
//       connections.push(draw_connection_fx(startNode, endNode))
//     }
//   }

//   return connections
// }

