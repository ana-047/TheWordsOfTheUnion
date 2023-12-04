class OffsetCalculator {
  constructor(fixedDivId) {
    // Calculate offsets in relation to the fixed visualization container
    this.fixedDiv = document.getElementById(fixedDivId);

    // Ensure offsets recalculate when the window resizes
    window.addEventListener('resize', () => {
      this.calculateOffsets(); // Recalculate offsets on window resize
    });
  }

  calculateOffsets() {
    const fixedDivRect = this.fixedDiv.getBoundingClientRect();
    this.fixedDivOffsetTop = fixedDivRect.top;
    this.fixedDivOffsetLeft = fixedDivRect.left;
  }

  getOffsets(pageX, pageY) {
    this.calculateOffsets();
    const offsetX = pageX - this.fixedDivOffsetLeft;
    const offsetY = pageY - this.fixedDivOffsetTop;
    return { offsetX, offsetY };
  }
}
