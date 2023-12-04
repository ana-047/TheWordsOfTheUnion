class GlobeChart {
  constructor(svgContainer, data) {
    this.svg = svgContainer;
    this.data = data;

    this.selectedCountry = null;
    this.countries = null;
    this.path = null;

    // Set up button handling
    d3.select('#exploreGlobe').on('click', () => this.toggleProjection());
    d3.select('#resetGlobe').on('click', () => this.resetProjection());

    // Render the chart
    this.init();
  }

  init() {
    // Get the bounding box of the SVG element
    this.svgBoundingBox = this.svg.node().getBoundingClientRect();

    // Determine available width and height based on parent SVG
    const containerWidth = this.svgBoundingBox.width;
    const containerHeight = this.svgBoundingBox.height;

    // Make sure chart height isn't more than window height because the chart div doesn't scroll
    const localHeight = Math.min(containerHeight, globalWindowHeight);

    // Declare local chart margins
    this.margin = {
      top: 10, right: 10, bottom: 10, left: 10,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Calculate the initial scale for the projections to fit the map within the container
    this.mapScale = Math.min(this.width / 2, this.height / 2);

    // Define projection scales
    this.initialProjection = d3.geoOrthographic().scale(this.mapScale).translate([this.width * 0.5, this.height * 0.5]);
    this.equirectangularProjection = d3.geoEquirectangular().scale(this.mapScale * 0.8).translate([this.width * 0.5, this.height * 0.65]);

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    this.render();
  }

  render() {
    this.path = d3.geoPath().projection(this.initialProjection);

    // Create a blue background for the globe
    this.chart.append('g')
      .attr('class', 'globe-background-circle')
      .append('circle')
      .attr('cx', this.width / 2)
      .attr('cy', this.height / 2)
      .attr('r', this.mapScale)
      .attr('class', 'globe-background');

    this.countries = topojson.feature(this.data, this.data.objects.countries).features;

    this.chart.selectAll('.country')
      .data(this.countries)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', this.path)
      .on('click', (event, d) => this.handleCountryClick(event, d));

    this.rotateGlobe();
  }

  toggleProjection() {
    const vis = this;
    vis.path = (vis.path.projection() === vis.initialProjection)
      ? d3.geoPath().projection(vis.equirectangularProjection)
      : d3.geoPath().projection(vis.initialProjection);

    vis.isEquirectangular = vis.path.projection() === vis.equirectangularProjection;

    const backgroundOpacity = (vis.isEquirectangular) ? 0 : 100;

    vis.chart.selectAll('.globe-background-circle')
      .transition()
      .duration(50)
      .attr('opacity', backgroundOpacity);

    vis.chart.selectAll('.country')
      .transition()
      .duration(100)
      .attr('d', vis.path);
  }

  resetProjection() {
    const vis = this;
    // Update global countrySection variable and trigger change detection
    globalCountrySelection = null;
    triggerCountryChange();
    console.log('global selectedCountry is:', globalCountrySelection);

    // Deselect all countries on the globe
    vis.chart.selectAll('.country')
      .classed('selected', false);

    // Update globe projection
    vis.path = d3.geoPath().projection(vis.initialProjection);

    vis.chart.selectAll('.country')
      .transition()
      .duration(1000)
      .attr('d', vis.path);

    vis.isEquirectangular = vis.path.projection() === vis.equirectangularProjection;

    d3.timerFlush();
  }

  rotateGlobe() {
    d3.timer((elapsed) => {
      this.initialProjection.rotate([elapsed / 100, 0]);

      this.chart.selectAll('path')
        .attr('d', this.path);

      return false;
    });
  }

  handleCountryClick(event, d) {
    const vis = this;

    // Check if map is in explore mode
    if (vis.path.projection() === vis.equirectangularProjection) {
      // Get the name of the clicked country
      const clickedCountryName = vis.getCountryName(d);
      console.log('clickedCountryName is', clickedCountryName);

      // Update local class property
      vis.selectedCountry = (vis.selectedCountry === clickedCountryName) ? null : clickedCountryName;
      console.log('selectedCountry is', vis.selectedCountry);

      // Update global countrySection variable and trigger change detection
      globalCountrySelection = vis.selectedCountry;
      triggerCountryChange();
      console.log('global selectedCountry is:', globalCountrySelection);

      // Update GlobeChart styles
      // noinspection RedundantConditionalExpressionJS
      vis.chart.selectAll('.country')
      // eslint-disable-next-line no-unneeded-ternary
        .classed('selected', (country) => ((vis.getCountryName(country) === vis.selectedCountry) ? true : false));
    } else if (vis.path.projection() === vis.initialProjection) {
      // If the map isn't in explore mode, activate explore mode
      vis.toggleProjection();
    }
  }

  getCountryName(d) {
    return (d && d.properties && d.properties.name) ? d.properties.name : null;
  }

  activate() {
    // Method allows Display class to show this chart
    this.chart.classed('deactivated', false);
    // this.chart.classed('activated', true);
  }

  deactivate() {
    // Method allows Display class to hide this chart
    // this.chart.classed('activated', false);
    this.chart.classed('deactivated', true);
  }
}
