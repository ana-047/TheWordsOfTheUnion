// Wireframe generator function

// Function looks for id tags in the hmtl, then prints the id as a text value of the html,
// making it easier to visualize the layout of a webpage before putting in real content.
function makeIdWireframe() {
  // Log when the function is called
  console.log('generating wireframes...');

  // Get all elements with an 'id' attribute
  const elementsWithID = document.querySelectorAll('[id]');

  // Iterate through the elements and update their innerText
  elementsWithID.forEach((element) => {
    // Add wireframe class to element
    element.classList.add('wireframe');

    // Create a new text node with the 'id' value
    const newText = document.createTextNode(element.id);

    // Insert the new text node before any existing children of the parent element
    element.insertBefore(newText, element.firstChild);
  });
}
