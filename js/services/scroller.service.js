/* The following class is adapted from
 * https://vallandingham.me/scroller.html */

class Scroller {
  constructor() {
    this.container = d3.select('body');
    this.dispatch = d3.dispatch('active', 'progress');
    this.sections = null;
    this.sectionPositions = [];
    this.currentIndex = -1;
    this.containerStart = 0;

    // Binding 'this' to the class methods
    this.position = this.position.bind(this);
    this.resize = this.resize.bind(this);
  }

  init(els) {
    this.sections = els;

    d3.select(window)
      .on('scroll', this.position)
      .on('resize', this.resize);

    this.resize();

    const timer = d3.timer(() => {
      this.position();
      timer.stop();
    });
  }

  updateWindowHeight() {
    // Update local property
    this.windowHeight = window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight
      || 0;

    // Update global var
    globalWindowHeight = this.windowHeight;
    triggerWindowResize();
    // console.log('updating window var to ', globalWindowHeight);
  }

  resize() {
    this.sectionPositions = [];
    let startPos;
    this.sections.each((d, i, nodes) => {
      const { top } = nodes[i].getBoundingClientRect();
      if (i === 0) {
        startPos = top;
      }
      this.sectionPositions.push(top - startPos);
    });
    this.containerStart = this.container.node().getBoundingClientRect().top + window.pageYOffset;
    this.updateWindowHeight();
  }

  position() {
    const pos = window.pageYOffset - 10 - this.containerStart;
    let sectionIndex = d3.bisect(this.sectionPositions, pos);
    sectionIndex = Math.min(this.sections.size() - 1, sectionIndex);

    if (this.currentIndex !== sectionIndex) {
      this.dispatch.call('active', this, sectionIndex);
      this.currentIndex = sectionIndex;
    }

    const prevIndex = Math.max(sectionIndex - 1, 0);
    const prevTop = this.sectionPositions[prevIndex];
    const progress = (pos - prevTop) / (this.sectionPositions[sectionIndex] - prevTop);
    this.dispatch.call('progress', this, this.currentIndex, progress);

    // Update global section position variable and trigger change detection
    globalSectionPosition = progress;
    triggerSectionPositionChange();
    // console.log('global section position is:', globalSectionPosition);

    // Update global section index variable and trigger change detection
    globalSectionIndex = sectionIndex;
    triggerSectionChange();
    // console.log('global index is:', globalSectionIndex);
  }

  setContainer(value) {
    if (arguments.length === 0) {
      return this.container;
    }
    this.container = value;
    return this;
  }

  on(action, callback) {
    this.dispatch.on(action, callback);
    return this;
  }
}
