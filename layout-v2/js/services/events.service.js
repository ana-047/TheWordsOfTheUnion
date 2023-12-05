// EVENT HANDLING
// Declare global section index vars
let globalSectionIndex;

// Set up global scroll event handling
function triggerSectionChange() {
  const event = new CustomEvent('sectionChange', { detail: globalSectionIndex });
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