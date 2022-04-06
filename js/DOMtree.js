const DOMNodes = {
  seizTypeMenu: document.getElementById("seizure-display-menu"),
  electrodeMenu: document.getElementById("electrode-menu"),
  fmapMenu: document.getElementById('fmap-menu'),
  fmapCaption: document.getElementById("fmap-caption"),
  intPopulationLabel: document.getElementById("int-population-label-inner"),
  seizTypeLabel: document.getElementById("seiz-type-label-inner"),
  coordinateLabel: document.getElementById("coordinates-label-inner"),
  IDLabel: document.getElementById("electrode-id-label-inner"),
  elecTypeLabel: document.getElementById("electrode-type-label-inner"),
  coordinateLabel: document.getElementById("coordinates-label-inner"),
  subjectIDLabel: document.getElementById("subject-id-lbl"),
  numSeizTypeLabel: document.getElementById("num-seiz-types-lbl"),
  canvases: document.getElementsByTagName("canvas"),
  tagsBtn: document.getElementById("show-tags-btn"),
  editBtn: document.getElementById("edit-btn"),
};

export { DOMNodes };
