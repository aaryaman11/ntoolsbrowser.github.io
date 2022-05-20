<!-- omit in toc -->
# N-Tools Browser Developer Guide

<!-- omit in toc -->
# **Contents**
- [Quick Overview of JavaScript Files](#quick-overview-of-javascript-files)
- [Details for the More Complex Files](#details-for-the-more-complex-files)
  - [`electrodes.js`](#electrodesjs)
    - [**Main Data Structures**](#main-data-structures)
      - [`data`](#data)
      - [`renderer`](#renderer)
      - [`volume`](#volume)
      - [`Graphics Objects`](#graphics-objects)
        - [**electrodeSpheres**](#electrodespheres)
        - [**highlightSpheres**](#highlightspheres)
        - [**fmapConnections**](#fmapconnections)
        - [**fmapHighlights**](#fmaphighlights)
      - [`slices`](#slices)
      - [`oldBoundingBox`](#oldboundingbox)
    - [**Functions**](#functions)
      - [jumpSlicesOnClick](#jumpslicesonclick)
      - [setupEditMenu](#setupeditmenu)


# Quick Overview of JavaScript Files

- `main.js` - Controls the loading and parsing of the `.nii` and `.pial` meshes. Also calls `electrodes.js`, which handles all of the loading and event setting for the 3D electrode rendering.

- `color.js` - Has a `COLOR` object which contains semantic names for XTK color vectors. Also contains function for translating seizure type names to colors (e.g. `"onset" : COLOR.red"`)

- `DOM.js` - Contains most of the DOM elements as an object. This helps reduce the amount of `document.getElementById('long-element-name')` required in the other parts of the program

- `electrodecanvas.js` - Contains the classes for electrode canvases. Uses XTK's volume parser and the canvas APIs `drawImageData` to dynamically render 2D electrode colors.

- `electrodes.js` - A large file containing all of the functions that have to do with the 3D electrodes. Fetches the electrode and signal header json files, and then uses the data to add events to menus and sliders.

- `gfx.js` - Wraps some of XTKs 3D geometry code (i.e. `X.sphere`) into a single `GFX` object that can be called in multiple places. `electrodes.js` uses `GFX` to render the spheres on the scene

- `mapInterval.js` - A single function that takes a coordinate on the interval ``[a, b]`` and maps it to a coordinate on the interval ``[c, d]``. This is how we take the 3D coordinates, which are usually on the interval `[-128, 127]` to the interval `[0, 255]`.

- `search.js` - Handles the search page at the beginning of the application. 

- `signaldisplay.js` - Contains all of the code for displaying the signal graph.

- `sliceRenderer.js` - Contains all of the code for adding drag and zoom functionality to 2D elements.

****
<br>

# Details for the More Complex Files

## `electrodes.js`

### **Main Data Structures**
The `electrodes.js` file contains all of the functionality for rendering the 3D electrode sphere objects onto the scene. In order to add or change to this file, it is important to have a sense of all the data structures it uses.

#### `data`
This is the JSON parsed as a regular JavaScript object. You can get the electrode data specifically by using `data.electrodes`, or functional maps by using `data.functionalMaps`. 

  - The function `getAttrArray(data, attr)` can be especially useful for plucking specific properties from the electrodes or functional maps. For example, if I want to get an array of just the `elecID`, similar to the old way N-Tools JSON's were stored, I can do 
    ```
    getAttrArray(data.electrodes, 'elecID')
    ```
#### `renderer` 
This is the XTK 3D renderer. It contains several methods that we make use of in various functions
  - `pick(x, y)` - Takes an `(x, y)` pair in screen coordinates and finds the `uniqueID` of the object clicked. By default, only the spheres and cylinders are pickable; everything else has `.pickable` set to false.

  - `get(ID)` - Takes the ID returned from pick and finds the actual object in the renderer itself. An ID of 0 indicates no ID has been found.

  - `camera.view` - Gets the [view matrix](https://www.3dgep.com/understanding-the-view-matrix/) for the renderers camera. This will then be used to create the [perspective matrix](https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/building-basic-perspective-projection-matrix), which we then use to get the screen coordinates for a 2D electrode tag

#### `volume`
The XTK volume object. Because we linked the minified XTK-Edge as a `<script>` tag, many of the object properties can be a bit difficult to understand. However, the one we use for the electrode canvas is `volume.K`, as this contains the NIfTI image array.

#### `Graphics Objects`

##### **electrodeSpheres**
The `X.sphere` objects that cover the brain surface. 

##### **highlightSpheres**
The `X.sphere` objects that are opaque and blue and surround an electrode when selected. They are invisible by default, and work by turning the one corresponding to the clicked electrode visible. In future versions, it might be helpful to find another way to highlight spheres, or remove the spheres when not in use rather than relying on making them visible/invisible.

##### **fmapConnections**
The `X.cylinder` objects that represent a connection between two electrodes.

##### **fmapHighlights**
The `X.cylinder` objects that represent a highlighted functional map. The reasoning is the same as above.

#### `slices`
We put the three canvases into a single array to make it easier to pass to the different functions. You will often see code that calls methods on all three of them like so:
```
slices.forEach(s => s.drawCanvas())
```
The canvas has to be redrawn like this every time an edit change happens. The sliceMap for each slice has to be re-created as well.

#### `oldBoundingBox`
The bounding box is a vector that contains the offset from the origin. Graphics objects generated need to be offset by the bounding box in order to appear at the origin. There is an XTK renderer function called `resetBoundingBox()`. However, this seems to have unintended side effects, such as causing the 2D electrode tags to appear off center. There are many things within XTK that appear tightly coupled. An example of this would be not adding the volume to the renderer at all, which causes the electrodes to be rendered way off center. It would be good to figure this out in the future, but for now it solves the problem.

****

Any new function added to N-Tools that wants to work with these data *must* pass a reference to the new function. If future developers can simplify the code so that the functions need less arguments, this would be a great improvement. 

### **Functions**
Some of the functions in this file are admittedly quite complex and could be named better. This presents great opportunities for refactoring. Here is an overview of some of the more involved ones.

#### jumpSlicesOnClick
This function adds a click event to the 3D canvas. Once this function has been called, the click handler contains a reference to the data, so it does not need to be called multiple times as the program runs. It begins by using the renderers `pick` and `get` functions to get a reference to the clicked XTK object. It then finds the index of this object in the `electrodeSpheres` array. 

**It is important to remember that the `data.electrodes` array and the `electrodeSpheres` array are parallel; that is, `data.electrodes[i]` has a graphical representation in `electrodeSpheres[i]`. Since electrodes cannot be deleted, this should never change.**

Note that the `.g` property in minified XTK corresponds to the type of 3D object XTK is representing, e.g. 'sphere' or 'cylinder'. If the object is found, it calls `updateView`. If an fmap is found, it calls `getAttrArray` to get two arrays for the `Threshold` and `AfterDischarge`, and uses that index to display results on the fmap menu.

#### setupEditMenu
This function is similar to jumpSlicesOnClick, but it does not move the slice view. It instead creates a context menu when the user right clicks. The getting and picking with the renderer is the same.

**We currently are injecting an HTML markdown directly into the scene with a template literal. When we tried making an already formed HTML menu in `view.html`, it would either only edit the most recently clicked electrode, or edit every electrode at the same time**

When this menu is visible, all of its inner HTML elements can be accessed with `document.getElementById` and related methods. 

It adds a click handler to the update button. This click handler calls `editElectrode` and `addFmap`, and then updates the colors of the 3D electrodes and 2D slices.

