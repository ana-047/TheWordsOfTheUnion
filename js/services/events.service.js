// EVENT HANDLING

// Declare global section index vars
let globalSectionIndex;

// Set up global scroll event handling
function triggerSectionChange() {
  const event = new CustomEvent('sectionChange', { detail: globalSectionIndex });
  document.dispatchEvent(event);
}

// Declare global section position vars (percent scroll completion within a section)
let globalSectionPosition;

// Set up global scroll event handling within a section
function triggerSectionPositionChange() {
  const event = new CustomEvent('positionChange', { detail: globalSectionPosition });
  document.dispatchEvent(event);
}

// Declare global year vars for brush line graph
let globalBrushYears;

// Set up global brush event handling within a section
function triggerBrushChange() {
  const event = new CustomEvent('brushChange', { detail: globalBrushYears });
  document.dispatchEvent(event);
}

// Declare global max vis height based on window
let globalWindowHeight;

// Set up global resize event handling
function triggerWindowResize() {
  const event = new CustomEvent('windowResize', { detail: globalWindowHeight });
  document.dispatchEvent(event);
}

// Declare global country selector for map visualization
let globalCountrySelection;

// Set up global country selector event handling
function triggerCountryChange() {
  const event = new CustomEvent('countryChange', { detail: globalCountrySelection });
  document.dispatchEvent(event);
}

// Declare global theme selector for theme visualization
let globalThemeSelection;

// Set up global theme selector event handling
function triggerThemeChange() {
  const event = new CustomEvent('themeChange', { detail: globalThemeSelection });
  document.dispatchEvent(event);
}

// Declare global theme selector for line chart theme visualization
let globalLineSelection;

// Set up global line theme selector event handling
function triggerLineChange() {
  const event = new CustomEvent('lineChange', { detail: globalLineSelection });
  document.dispatchEvent(event);
}
