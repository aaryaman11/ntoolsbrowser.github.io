const DOMNodes = {
  seizTypeMenu: document.getElementById("seizure-display-menu"),
  electrodeMenu: document.getElementById("electrode-menu"),
  fmapMenu: document.getElementById('fmap-menu'),
  fmapCaption: document.getElementById("fmap-caption"),
  fmapThreshold: document.getElementById("fmap-threshold"),
  fmapDischarge: document.getElementById("fmap-after-discharge"),

  intPopulationLabel: document.getElementById("int-population-label-inner"),
  seizTypeLabel: document.getElementById("seiz-type-label-inner"),
  coordinateLabel: document.getElementById("coordinates-label-inner"),
  IDLabel: document.getElementById("electrode-id-label-inner"),
  elecTypeLabel: document.getElementById("electrode-type-label-inner"),
  coordinateLabel: document.getElementById("coordinates-label-inner"),
  subjectIDLabel: document.getElementById("subject-id-lbl"),
  numSeizTypeLabel: document.getElementById("num-seiz-types-lbl"),
  canvases: document.getElementsByTagName("canvas"),

  editMenu: document.getElementById("edit-menu"),
  elecEdit: document.getElementById("elec-type-edit"),
  intPopEdit: document.getElementById("int-pop-edit"),
  seizTypeEdit: document.getElementById("seiz-type-edit"),

  tagsBtn: document.getElementById("show-tags-btn"),
  editBtn: document.getElementById("edit-btn"),
  downloadBtn: document.getElementById("download-btn"),
  syncBtn: document.getElementById("sync-btn"),

  brightCtrl: document.getElementById("slice-brightness"),
  sliceXCtrl: document.getElementById("sliceX-control"),
  sliceYCtrl: document.getElementById("sliceY-control"),
  sliceZCtrl: document.getElementById("sliceZ-control"),
  windowLow: document.getElementById("slice-window-low"),
  windowHigh: document.getElementById("slice-window-high"),
  sliceDetails: document.getElementById("slice-details"),
  
};

export { DOMNodes };
