// DONE Fix centerline
// DONE fix tooltips
// DONE change legend filter to toggle
// TODO add global var for legend toggle
// NO put legend horizontally on top?
// NO add sentence text for tooltip?
// TODO add presidents along x axis

// TODO change stacked bar to vertical stacks and align with president

class BeeswarmChart {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;

    // Prep for data handling
    this.data = data;
    this.sampleProportion = 0.2;
    this.radius = 2.2;

    // Render the chart
    this.init();
    this.render();
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
      top: 20, right: 128, bottom: 40, left: 60,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'beeswarm-chart-area')
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    // Set up scales
    this.xScale = d3.scaleLinear()
      .range([0, this.width]);

    this.yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([this.height, 0]);

    // Set up and position axis groups
    this.xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${this.height + this.margin.bottom * 0.02})`);

    this.yAxis = this.chart.append('g')
      .attr('transform', `translate(${-0.05 * this.margin.left}, 0)`);

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'beeswarm-tooltip')
      .style('opacity', 0);
  }

  // Method to sample a random subset of tagged_text objects from each year
  sampleTaggedText() {
    const vis = this;

    // Prep data for display
    vis.sampledData = this.data.map((item) => {
      const { year, tagged_text } = item;
      const keys = Object.keys(tagged_text);
      const filteredKeys = keys.filter((key) => tagged_text[key].hasOwnProperty('s'));
      const sampleSize = Math.ceil(filteredKeys.length * vis.sampleProportion); // % of the filtered keys with 's' property
      const sampledKeys = filteredKeys.sort(() => 0.5 - Math.random()).slice(0, sampleSize);
      const sampledObjects = sampledKeys.map((key) => tagged_text[key]);
      return { year, tagged_text: sampledObjects };
    });
  }

  render() {
    const vis = this;
    // console.log(vis.constructor.name, 'rendering');

    // Append a center axis line through 0 on the y-axis
    vis.chart.append('line')
      .attr('x1', 0)
      .attr('y1', vis.yScale(0))
      .attr('x2', vis.width)
      .attr('y2', vis.yScale(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5 5') // Add dashed style
      .attr('class', 'axis');

    // Sample the data
    vis.sampleTaggedText();
    // vis.sampledData = vis.sampleTaggedText();

    // Extract 's' elements from data
    vis.circlesData = vis.sampledData.reduce((acc, curr) => {
      const { year, tagged_text } = curr;
      Object.values(tagged_text).forEach((item) => {
        if (item.hasOwnProperty('s')) {
          acc.push({
            year,
            s: parseFloat(item.s), // Ensure 's' is a numeric value
            t: item.t,
            w: item.w,
          });
        }
      });
      return acc;
    }, []);

    // Update scale domains for x and y axes
    vis.xScale.domain(d3.extent(vis.circlesData, (d) => d.year));
    vis.yScale.domain([-1, 1]);

    // Create simulation with forces
    vis.simulation = d3
      .forceSimulation(vis.circlesData)
      .force('x', d3.forceX((d) => vis.xScale(d.year)).strength(0.1))
      .force('y', d3.forceY((d) => vis.yScale(d.s)).strength(0.5))
      .force(
        'collision',
        d3.forceCollide().radius(vis.radius),
      )
      .stop();

    for (let i = 0; i < 120; ++i) {
      vis.simulation.tick();
    }

    // Appending circles to the chart
    const circles = vis.chart
      .selectAll('circle')
      .data(vis.circlesData)
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', this.radius)
      .attr('class', (d) => `dot ${d.t}`) // Add class based on 't' property
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);

    vis.initLegend();
    vis.renderAxes();

    function handleMouseOver(event, d) {
      // console.log('beeswarm tooltip trigger');

      // TOOLTIP HANDLING
      // Get the embedded data from the hovered circle
      const dot = d3.select(this);
      vis.selectedDotData = dot.datum();

      let sentimentRank;
      const { s } = vis.selectedDotData;

      if (s > 0.6) {
        sentimentRank = 'very positive';
      } else if (s > 0.1) {
        sentimentRank = 'positive';
      } else if (s > -0.1) {
        sentimentRank = 'neutral';
      } else if (s > -0.6) {
        sentimentRank = 'negative';
      } else if (s > -1.1) {
        sentimentRank = 'very negative';
      } else {
        console.log(s);
        sentimentRank = 'undetermined';
      }

      // Get the client offsets so the tooltip appears over the mouse
      const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

      // Render the tooltip and update position
      vis.tooltip
        .transition()
        .duration(200)
        .style('opacity', 0.9)
        .style('left', `${offsetX + 20}px`)
        .style('top', `${offsetY - 4}px`);

      // Update tooltip contents
      vis.tooltip
        .html(`
          In <span class="label">${vis.selectedDotData.year}</span>, 
          the word <span class="label">${vis.selectedDotData.w}</span> 
          was used in a <span class="label">${sentimentRank}</span> way.
          <br>
          (Sentiment Score: <span class="label">${vis.selectedDotData.s}</span>)
        `);

      // HOVER INTERACTION HANDLING
      // Update the radius of the hovered dot and push neighbors away
      const hoveredCircle = d3.select(this);
      hoveredCircle
        .transition()
        .duration(200)
        .attr('r', vis.radius * 6); // Set hovered dot radius
    }

    function handleMouseOut(event, d) {
      // TOOLTIP HANDLING
      // Hide tooltip
      vis.tooltip.transition()
        .duration(500)
        .style('opacity', 0);

      // HOVER INTERACTION HANDLING
      // Restore original radius of hovered dot
      const hoveredCircle = d3.select(this);
      hoveredCircle
        .transition()
        .duration(200)
        .attr('r', vis.radius);
    }
  }

  renderAxes() {
    const vis = this;

    // Define axes
    vis.xAxis = d3.axisBottom().scale(vis.xScale)
      .tickFormat(d3.format('d'));
    vis.yAxis = d3.axisLeft().scale(vis.yScale)
      .tickValues([-1, 0, 1]) // Set specific tick values
      .tickFormat((d) => (d === 0 ? '0' : d > 0 ? '+1' : '-1')); // Label format for sentiment scores;

    // Render axes
    vis.chart.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${vis.height + vis.margin.bottom / 2})`)
      .call(vis.xAxis);

    vis.chart.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${-vis.margin.left / 2}, 0)`)
      .call(vis.yAxis);
  }

  initLegend() {
    const vis = this;
    // console.log(vis.constructor.name, 'initializing legend');

    // Get theme colors from main and convert to array
    vis.themeCategories = Object.keys(themeColors).map((key) => {
      const modifiedKey = key.substring(6); // Remove first 6 characters
      return modifiedKey.charAt(0).toUpperCase() + modifiedKey.slice(1);
    });
    vis.themeColors = Object.values(themeColors);

    vis.colorScale = d3.scaleOrdinal()
      .domain(vis.themeCategories)
      .range(vis.themeColors);

    const size = 20;

    vis.chart.append('g')
      .attr('transform', 'translate(0, -30)')
      .attr('class', 'legend')
      .selectAll('.theme-legend')
      .data(vis.themeCategories)
      .enter()
      .append('rect')
      .attr('class', 'theme-legend')
      .attr('x', vis.width + 10)
      .attr('y', (d, i) => 10 + i * (size + 5))
      .attr('width', size)
      .attr('height', size)
      .style('fill', (d) => vis.colorScale(d));

    vis.chart.append('g')
      .attr('transform', 'translate(0, -30)')
      .attr('class', 'legend')
      .selectAll('.theme-label')
      .data(vis.themeCategories)
      .enter()
      .append('g') // Create a group for each legend item
      .attr('class', 'theme-label legend-item selected')
      .attr('transform', (d, i) => `translate(${vis.width + 10 + size * 1.2},${10 + i * (size + 5)})`)
      .each(function (d) {
        // Append rectangle to the group
        d3.select(this)
          .append('rect')
          .attr('class', 'theme-label-background')
          .attr('width', 90)
          .attr('height', size)
          .attr('rx', 4)
          .attr('ry', 4);

        // Append text to the group
        d3.select(this)
          .append('text')
          .attr('class', 'label')
          .attr('x', 3) // Adjust as needed for text position
          .attr('y', size * 0.7) // Adjust as needed for text position
          .text(d)
          .attr('text-anchor', 'left')
          .style('alignment-baseline', 'middle');
      });

    // Add click event listeners to legend labels for filtering
    // vis.chart.selectAll('.theme-label')
    //   .on('click', function (event, d) {
    //     // console.log('legend click');
    //     vis.selectedTheme = d;
    //
    //     // Toggle class for selected/unselected appearance
    //     const isSelected = d3.select(this).classed('selected');
    //     d3.select(this).classed('selected', !isSelected);
    //
    //     // Toggle visibility of data points based on the selected theme
    //     vis.toggleDataVisibility(vis.selectedTheme, !isSelected);
    //   });

    // Add click event listeners to legend labels for filtering
    vis.chart.selectAll('.theme-label')
      .on('click', function (event, d) {
        // Check how many labels are selected
        const labels = vis.chart.selectAll('.theme-label.selected');
        const counter = Object.values(labels)[0][0].length;

        console.log('counter is ', counter);

        if (vis.selectedTheme === d && counter === 1) {
          // Update the selection property and trigger global update
          vis.selectedTheme = null;
          globalThemeSelection = vis.selectedTheme;
          triggerThemeChange();

          // Turn off the filter
          // Select all items
          vis.chart.selectAll('.theme-label').classed('selected', true);

          // Reset visibility of data points based on the selected theme
          vis.chart.selectAll('circle')
            .transition()
            .duration(500)
            .style('opacity', 1) // Fade-in
            .style('display', 'initial');
        } else {
          // Update the selection property and trigger global update
          vis.selectedTheme = d;
          globalThemeSelection = vis.selectedTheme;
          triggerThemeChange();

          // Deselect all items
          vis.chart.selectAll('.theme-label').classed('selected', false);

          // Toggle class for selected appearance
          d3.select(this).classed('selected', true);

          // Toggle visibility of data points based on the selected theme
          vis.toggleDataVisibility(vis.selectedTheme, true);
        }
      });
  }

  toggleDataVisibility(selectedTheme, show) {
    const vis = this;
    // console.log('Toggling visibility for theme:', vis.selectedTheme);

    // Show/hide data points based on the selected theme
    // vis.chart.selectAll('circle')
    //   .filter((d) => d.t === vis.selectedTheme.toLowerCase())
    //   .style('display', show ? 'initial' : 'none');

    // Hide all data points
    vis.chart.selectAll('circle')
      .transition()
      .duration(500)
      .style('opacity', 0) // Fade-out
      .style('display', 'none');

    // Show selected theme data points
    vis.chart.selectAll('circle')
      .filter((d) => d.t === vis.selectedTheme.toLowerCase())
      .transition()
      .duration(500)
      .style('opacity', 1) // Fade-in
      .style('display', 'initial');
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
