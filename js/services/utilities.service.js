// Function to trim the progress so it completes the animations earlier than at 100%
function normalizeTo(domainInput, rangeMin, rangeMax) {
  const normalizedValue = ((domainInput - rangeMin) / (rangeMax - rangeMin));
  return Math.min(Math.max(normalizedValue, 0), 1);
}
