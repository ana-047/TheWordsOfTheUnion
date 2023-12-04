class ScatterPlot {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;
    this.data = data;
    this.filteredData = null;
    this.selectedCountryName = null;

    // Render the chart
    this.init();
    this.update();
  }

  init() {
    const vis = this;

    // Listen for the countryChange event and update the chart accordingly
    document.addEventListener('countryChange', () => {
      this.selectedCountryName = globalCountrySelection;
      this.update();
    });

    // Get the bounding box of the SVG element
    this.svgBoundingBox = this.svg.node().getBoundingClientRect();

    // Determine available width and height based on parent SVG
    const containerWidth = this.svgBoundingBox.width;
    const containerHeight = this.svgBoundingBox.height;

    // Make sure chart height isn't more than window height because the chart div doesn't scroll
    const localHeight = Math.min(containerHeight, globalWindowHeight);

    // Declare local chart margins
    this.margin = {
      top: 40, right: 20, bottom: 20, left: 40,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    // Set up scales and axes
    vis.xScale = d3.scaleLinear()
      .range([0, vis.width]);

    vis.yScale = d3.scaleLinear()
      .range([vis.height, 0]);

    // Set up and position axis groups
    // X Axis
    vis.xAxis = d3.axisBottom().scale(vis.xScale)
      .tickFormat(d3.format('d'));

    vis.xAxisGroup = vis.chart.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${vis.height + vis.margin.bottom * 0.2})`);

    // Y Axis
    vis.yAxis = d3.axisLeft().scale(vis.yScale);

    vis.yAxisGroup = vis.chart.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${vis.margin.left * -0.2}, 0)`);

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'scatterplot-tooltip')
      .style('opacity', 0);
  }

  update() {
    const vis = this;
    // Filer the data to the selected country
    vis.filteredData = vis.data.filter((d) => d.Country === vis.selectedCountryName);

    // Update axis domains
    vis.xScale.domain([d3.min(vis.filteredData, (d) => +d.Year), d3.max(vis.filteredData, (d) => +d.Year)]);
    vis.yScale.domain([0, d3.max(vis.filteredData, (d) => +d.Mentions)]);

    vis.render();
  }

  render() {
    const vis = this;
    // console.log('render ScatterPlot method called with data:', vis.filteredData);

    // Reset the chart
    vis.chart.selectAll('circle').remove();
    vis.chart.selectAll('.scatter-title').remove();
    vis.chart.selectAll('.scatter-note').remove();

    // Check if there is data for the selected country
    if (!vis.selectedCountryName || vis.filteredData.length === 0) {
      // If the country exists but there's no data
      if (vis.filteredData.length === 0 && vis.selectedCountryName) {
        // Add a message for country with no data
        vis.chart.append('g')
          .attr('class', 'scatter-note')
          .append('text')
          .attr('x', vis.width * 0.5)
          .attr('y', vis.margin.top * 0.8)
          .style('text-anchor', 'middle')
          .text(`There are no mentions of ${vis.selectedCountryName}, try exploring a different country!`);
      } else {
      // Create a help text title
        vis.selectedCountryName = 'Click a country to explore its historical mentions';
      }
      // If there's no data, hide the plot axes
      vis.xAxisGroup.classed('deactivated', true);
      vis.yAxisGroup.classed('deactivated', true);
    } else {
      // If there is data, create scatter plot circles
      vis.chart.selectAll('circle')
        .data(vis.filteredData)
        .enter()
        .filter((d) => +d.Mentions > 0)
        .append('circle')
        .attr('cx', (d) => vis.xScale(+d.Year))
        .attr('cy', (d) => vis.yScale(+d.Mentions))
        .attr('r', 3)
        .attr('class', (d) => {
          if (d.Party === 'Republican') {
            return 'party-republican';
          } if (d.Party === 'Democratic') {
            return 'party-democrat';
          }
          return 'party-other';
        });

      // If there is data, show the plot axes
      vis.xAxisGroup.classed('deactivated', false);
      vis.yAxisGroup.classed('deactivated', false);
    }

    // Add title to the chart area
    vis.chart.append('g')
      .attr('class', 'scatter-title')
      .append('text')
      .attr('x', vis.width * 0.5)
      .attr('y', vis.margin.top * -0.3)
      .style('text-anchor', 'middle')
      .text(vis.selectedCountryName);

    // Tooltip handling
    vis.chart.selectAll('circle')
      .on('mouseover', (event, d) => {
        // console.log('scatterplot tooltip trigger');
        // console.log('data d is', d);
        // Get the client offsets so the tooltip appears over the mouse
        const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

        // Render the tooltip and update position
        vis.tooltip
          .transition()
          .duration(200)
          .style('opacity', 0.9)
          .style('left', `${offsetX + 10}px`)
          .style('top', `${offsetY - 20}px`);

        // Prep the party string data
        const partyText = (str) => {
          const firstLetter = str.charAt(0).toUpperCase();
          if (firstLetter === 'R') {
            return 'R';
          } if (firstLetter === 'D') {
            return 'D';
          }
          return 'Other';
        };

        // Update tooltip contents
        vis.tooltip
          .html(`<span class="pres-name">${d.President}</span><span> (${partyText(d.Party)}) in ${d.Year}</span>`);
      })
      .on('mouseout', () => {
        // Hide tooltip
        vis.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Call the axes to show them
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);
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
