# ntools_browser
please add a more high-level documentation to your github if appropriate, this should tell ppl how to use the software or access it and describe it a little bit
**Web-based Electrode Visualization**

An add-on to [ntools_elec](https://github.com/HughWXY/ntools_elec), based on [XTK](https://github.com/xtk/X).

![Demo](Docs/demo2.png)

![General Design](Docs/design2.png)

![Stage 2 Design](Docs/roadmapstage2.png)

## User Walkthrough:
-  Go to the Github and search for github pages or click the [link](https://ntoolsbrowser.github.io/).
-  On the loading page page you would select the patient data using the drop down menu shown below

![Figure 1](Docs/loading-page.png)

- [x] Convert ntools_elec outputs to XTK compatible format.
- [x] Create web service for accessing ntools_elec outputs.
## Stage 2: Edit and save attributes of electrodes in browser
- [x] Create GUI for subject selection and 3D redering options.
- [ ] Assign and save different atrributes to the electrodes (e.g. functional mapping, seizure mapping, resection mapping, etc.).
## Stage 3: Add user control
- [ ] Link to MCIT database of Kerbros ID/Password.
- [ ] Create white list of Kerbros ID for legit users.
## Suggested features
- [x] Render brain volume instead of cortical surface.
- [x] Opacity control of brain surface
- [x] Color-code fmap bars
- [x] Display legend for color-code
- [x] Color-code elecs on 2D slices
- [x] Additional draw-down menu items for different types of fmap findings
- [ ] Adopt BIDS format in json file
- [x] 3D tags
- [ ] Show multiple fmap bars for same elec-pairs
- [ ] Interpolate surface color with electrode attributes (e.g. Garma band strength).

## Walkthrough for developers

![Demo](Docs/demo2.jpg)
