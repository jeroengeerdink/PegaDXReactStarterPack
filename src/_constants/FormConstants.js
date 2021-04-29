// Used for field.control.type values
export const fieldTypes = {
  TEXTINPUT: "pxTextInput",
  DROPDOWN: "pxDropdown",
  CHECKBOX: "pxCheckbox",
  TEXTAREA: "pxTextArea",
  EMAIL: "pxEmail",
  DATETIME: "pxDateTime",
  INTEGER: "pxInteger",
  NUMBER: "pxNumber",
  PHONE: "pxPhone",
  DISPLAYTEXT: "pxDisplayText",
  HIDDEN: "pxHidden",
  BUTTON: "pxButton",
  LABEL: "label",
  LINK: "pxLink",
  URL: "pxURL",
  ICON: "pxIcon",
  RADIOBUTTONS: "pxRadioButtons",
  AUTOCOMPLETE: "pxAutoComplete",
  CURRENCY: "pxCurrency",
  PXSUBSCRIPT: "",
};

// listSource values
export const sourceTypes = {
  DATAPAGE: "datapage",
  PAGELIST: "pageList",
  CONSTANT: "constant",
  LOCALLIST: "locallist",
  TEXT: "Text",
};

// layout.groupFormat values
export const layoutTypes = {
  INLINE_GRID_DOUBLE: "Inline grid double",
  INLINE_GRID_TRIPLE: "Inline grid triple",
  INLINE_GRID_70_30: "Inline grid 70 30",
  INLINE_GRID_30_70: "Inline grid 30 70",
  STACKED: "Stacked",
  GRID: "Grid",
  DYNAMIC: "Dynamic",
  INLINE_MIDDLE: "Inline middle",
  /* All below ones are using the default implementation */
  DEFAULT: "Default",
  MIMIC_A_SENTENCE: "Mimic a sentence",
  ACTION_AREA: "Action area",
  SIMPLE_LIST: "Simple list",
  EMPTY: "",
};

// layout.formatType values (see https://community.pega.com/knowledgebase/articles/user-experience/85/layouts-dx-api)
export const layoutFormatTypes = {
  SIMPLELAYOUT: "SIMPLELAYOUT",
  REPEATINGROW: "REPEATINGROW",
  REPEATINGLAYOUT: "REPEATINGLAYOUT",
  TABLELAYOUT: "TABLELAYOUT",
};

// layout.referenceType values
export const gridTypes = {
  GROUP: "Group",
  LIST: "List",
};

export const pageNames = {
  NEW: "New",
  CONFIRM: "Confirm",
};

export const actionNames = {
  SET_VALUE: "setValue",
  POST_VALUE: "postValue",
  REFRESH: "refresh",
  PERFORM_ACTION: "takeAction",
  RUN_SCRIPT: "runScript",
  OPEN_URL: "openUrlInWindow",
  LOCAL_ACTION: "localAction",
};

export const iconSources = {
  STANDARD: "standardIcon",
  IMAGE: "image",
  EXTERNAL_URL: "exturl",
  PROPERTY: "property",
  STYLECLASS: "styleclass",
};

// Mapping Pega standardicons to Semantic UI Icon equivalents
export const standardIcons = {
  pxIconAddItem: "plus circle",
  pxIconAddNewWork: "rocket",
  pxIconAttachments: "paperclip",
  pxCancel: "cancel",
  pxIconContents: "eye",
  pxIconDeleteItem: "trash",
  pxIconEnableActionSection: "rocket",
  pxIconExpandCollapse: "plus square outline",
  pxIconExplore: "setting",
  pxIconFinishAssignment: "rocket",
  pxIconGetNextWork: "rocket",
  pxIconHistory: "history",
  pxIconLocalAction: "rocket",
  pxIconPrint: "print",
  pxIconReopenWorkItem: "share",
  pxIconReview: "rocket",
  pxIconSave: "check square outline",
  pxIconShowFlowLocation: "map marker alternate",
  pxIconShowHarness: "rocket",
  pxIconShowReopenScreen: "undo",
  pxIconSpellChecker: "checkmark box",
  pxIconUpdate: "setting",
  "pi-dot-3": "ellipsis horizontal",
  "pi-plus": "plus",
  "pi-minus": "minus",
  "pi-case": "briefcase",
  "pi-home": "home",
  "pi-search": "search",
  "pi-arrow-right": "arrow right",
  "pi-reset": "undo",
  "pi-history": "history",
  "pi-pencil": "history",
  "pi-gear": "setting",
  "pi-trash": "trash",
  "pi-bell": "bell",
  "pi-information": "info",
  "pi-help": "help",
  "pi-warn": "warning",
  "pi-circle-check-solid": "check circle",
  "pi-a11y": "wheelchair",
};
