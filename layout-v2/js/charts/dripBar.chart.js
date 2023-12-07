// TODO Fix tooltip text

class DripBarChart {
  constructor(svgContainer, data) {
    this.svg = svgContainer;
    this.data = data;
    this.filteredData = null;
    this.selectedTheme = null;

    this.init();
    this.update();
  }

  init() {
    // Listen for the countryChange event and update the chart accordingly
    document.addEventListener('themeChange', () => {
      if (globalThemeSelection) {
        // Make sure chart resets after the previous stacked bar vis
        if (globalSectionIndex <7) {
          this.selectedTheme = null;
        } else {
          this.selectedTheme = globalThemeSelection.toLowerCase();
        }
      } else {
        this.selectedTheme = null;
      }
      // console.log('dripBar detected event theme change', this.selectedTheme);
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
      top: 20, right: 128, bottom: 120, left: 60,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'drip-chart-area')
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    // Create scales
    this.xScale = d3.scaleBand()
      .range([0, this.width])
      .padding(0.1);

    this.yearScale = d3.scaleLinear()
      .domain([1790, 2021])
      .range([0, this.width]);

    this.yScale = d3.scaleLinear()
      .range([this.height, 0]);

    // Set up and position axis groups
    this.xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${this.height + this.margin.bottom * 0.02})`);

    this.yAxis = this.chart.append('g')
      .attr('transform', `translate(${-0.5 * this.margin.left}, 0)`);

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'drip-tooltip')
      .style('opacity', 0);
  }

  filterData() {
    if (this.selectedTheme !== null) {
      this.filteredData = this.data.map((item) => {
        const { year, name, tagged_text } = item;
        const keys = Object.keys(tagged_text);
        const filteredKeys = keys.filter((key) => tagged_text[key].hasOwnProperty('s') && tagged_text[key].t === this.selectedTheme);
        const filteredObjects = filteredKeys.map((key) => tagged_text[key]);
        return { year, name, tagged_text: filteredObjects };
      });
    } else {
      // If selectedTheme is null, show all data
      this.filteredData = this.data.map((item) => {
        const { year, name, tagged_text } = item;
        const keys = Object.keys(tagged_text);
        const filteredObjects = keys.map((key) => tagged_text[key]);
        return { year, name, tagged_text: filteredObjects };
      });
    }
  }

  update() {
    const vis = this;
    // console.log('rendering drip chart with data ', this.data);

    // Filter data
    this.filterData();

    // Process the data to generate the stacked bar chart
    const keys = Array.from(new Set(this.filteredData.flatMap((d) => Object.values(d.tagged_text).map((item) => item.t))));

    const stackedData = this.filteredData.map((d) => {
      const counts = {};
      keys.forEach((key) => {
        counts[key] = Object.values(d.tagged_text).reduce((acc, item) => (item.t === key ? acc + 1 : acc), 0);
      });
      return { year: d.year, counts };
    });

    // Update scale domains
    this.xScale
      .domain(this.filteredData.map((d) => d.year))
      .padding(0.1);

    // Calculate the maximum value across all bars in the stacked data
    const maxBarValue = d3.max(stackedData, (d) => d3.max(Object.values(d.counts)));
    this.yScale
      .domain([0, maxBarValue]);

    // Select all existing bars and bind the updated data
    const bars = this.chart.selectAll('.bar')
      .data(keys);

    // Exit: Remove bars that are no longer in filteredData
    bars.exit().remove();

    // Enter: Append new bars for the updated data
    const newBars = bars.enter().append('g')
      .attr('class', 'bar');

    // Append rectangles for the new bars and update existing bars
    const allBars = newBars.merge(bars).selectAll('rect')
      .data((key) => stackedData.map((d) => ({ key, value: d.counts[key] || 0, t: key })));

    allBars.enter().append('rect')
      .attr('x', (d, i) => this.xScale(stackedData[i].year))
      .attr('width', this.xScale.bandwidth())
      .merge(allBars)
      .attr('y', this.height)
      .attr('height', 0)
      .on('mouseover', function (event, d) {
        // console.log('drip tt', d);

        // Get the client offsets so the tooltip appears over the mouse
        const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

        // Show tooltip on mouseover
        const { year, name, t } = d;
        const tooltipText = `Year: ${year}, President: ${name}, Theme: ${t}`;

        d3.select(this)
          .classed('selected', true);
        // .attr('opacity', 0.7); // Highlight the bar segment on hover

        vis.tooltip
          .transition()
          .duration(200)
          .style('opacity', 1)
          .style('left', `${offsetX + 4}px`)
          .style('top', `${offsetY - 36}px`);

        vis.tooltip
          .html(tooltipText);
      })
      .on('mouseout', function () {
        // Hide tooltip on mouseout
        d3.select(this)
          .classed('selected', false);
        // .attr('opacity', 1); // Restore the bar segment to its original state

        vis.tooltip
          .transition()
          .duration(500)
          .style('opacity', 0);
      })
      .transition()
      .duration(1200)
      .attr('y', (d) => this.yScale(d.value))
      .attr('height', (d) => this.height - this.yScale(d.value))
      .attr('class', (d) => `bar-segment ${d.t}`); // Assign CSS class based on 't'

    // Call the axes to show them
    // this.initXAxis();
    this.initYearAxis();
    this.yAxis.transition().duration(500)
      .call(d3.axisLeft(this.yScale));
  }

  initYearAxis() {
    // Init time scale axis
    this.yearAxis = d3.axisBottom().scale(this.yearScale)
      .tickFormat(d3.format('d'));
    this.chart.append('g')
      .attr('class', 'axis year-axis')
      .attr('transform', `translate(0, ${this.height + 2})`)
      .call(this.yearAxis);
  }
  initXAxis() {
    // Initialize variable to keep track of the presidents' names
    // const prevName = null;

    // Update xScale domain using the names in the data
    this.xScale
      .domain(this.filteredData.map((d) => d.name)) // Use 'name' property for x-axis
      .padding(0.1);

    // Create x-axis with ticks displayed only when there's a change in 'name'
    this.xAxis.call(
      d3.axisBottom(this.xScale)
        .tickValues(this.filteredData.map((d, i) => {
          if (i === 0 || d.name !== this.filteredData[i - 1].name) {
            return d.name;
          }
          return null; // Return null for ticks where 'name' doesn't change
        }))
        .tickPadding(10) // Padding between ticks and labels
        .tickSize(5) // Size of the ticks
        .tickSizeOuter(5) // Hide outer ticks
        .tickFormat((d) => d), // Format ticks to display 'name'
    )
      .selectAll('text')
      .attr('transform', 'rotate(-45) translate(-8, -5)')
      .style('text-anchor', 'end');
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
