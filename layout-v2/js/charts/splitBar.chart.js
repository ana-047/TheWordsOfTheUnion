class SplitBarChart {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;
    this.data = data;
    this.rectScale = 4;

    // Initialize progress as 0
    this.progress = 0;
    this.baseWidth = 4;

    // Render the chart
    this.init();
    this.render();
  }

  init() {
    // Listen for the countryChange event and update the chart accordingly
    document.addEventListener('positionChange', () => {
      this.progress = globalSectionPosition;
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
      top: 10, right: 20, bottom: 50, left: 130,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    // Set up base rect width
    const xWidth = 130; // Calculated from dataset max minutes
    // const maxMinutesAvgPres = d3.max(this.data, (d) => d.minutes_avg_pres);

    // Define initial x scale
    this.xScale = d3.scaleLinear()
      // .domain([0, maxMinutesAvgPres])
      .domain([0, xWidth])
      .range([0, this.width]);

    // Update baseWidth
    this.baseWidth = this.xScale(xWidth) / xWidth;

    // Define initial y scale
    this.yScale = d3.scaleBand()
      .range([0, this.height])
      .padding(0.1);

    this.yScale.domain(this.data.map((d) => d.name));

    this.yAxis = this.chart.append('g')
      .attr('transform', `translate(${0}, 0)`);

    // Define hours y scale (goes from 0 to 390)
    this.yScaleHours = d3.scaleLinear()
      .domain([0, 340])
      .range([0, this.height]); // Don't reverse the range because it should go from top to bottom for this chart

    // Create y-axis for Hours
    this.yAxisHours = d3.axisLeft(this.yScaleHours);
  }

  render() {
    this.chart.selectAll('.bar-group')
      .remove();

    this.chart.selectAll('.stat-group')
      .remove();

    const group = this.chart.selectAll('.bar-group')
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (d) => `translate(0,${this.yScale(d.name)})`);

    group.selectAll('rect')
      .data((d) =>
        // Create an array of objects including 'party' and 'index' attributes
        Array.from({ length: d.minutes_avg_pres }, (_, i) => ({
          party: d.party, // Pull in 'party' field from the parent data
          index: i + 1, // Increment index for rect x placement
        })))
      .enter()
      .append('rect')
      .attr('class', (d) => `party-${d.party}`)
      .attr('fill', (d) => {
        if (d.party === 'Republican') {
          return partyColors['party-republican'];
        } if (d.party === 'Democratic') {
          return partyColors['party-democrat'];
        }
        return partyColors['party-other'];
      })
      .transition()
      .duration(5)
      .attr('x', (d, i) => i * this.baseWidth)
      .attr('y', 0)
      .attr('width', this.baseWidth)
      .attr('height', this.yScale.bandwidth());

    // Call initial y axis
    this.yAxis.call(d3.axisLeft(this.yScale));

    // Set up Stat chart
    const totalHours = [this.data[0].hours_total];

    this.stat = this.chart.selectAll('.stat-group')
      .data(totalHours)
      .enter()
      .append('g')
      .attr('class', 'stat-group')
      .attr('transform', `translate(${0}, ${0})`)
      .attr('opacity', 0);

    // Big yellow bar
    this.stat.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.width + this.margin.right)
      .attr('height', this.yScale.bandwidth())
      .attr('fill', '#E3CD7A');

    // Big center text
    this.stat.append('text')
      .text((d) => `${d} hours!`)
      .attr('x', this.width / 2)
      .attr('y', (this.height * 0.6) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'big-stat');

    // Append the y-axis to the SVG
    this.stat.append('g')
      .attr('class', 'y-axis-hours')
      .call(this.yAxisHours)
      .attr('opacity', 1);

    // Add hours y-axis label
    this.stat.append('text')
      .attr('class', 'axis axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left / 2)
      .attr('x', 0 - (this.height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Hours');
  }

  update() {
    // console.log('updating bars');

    // Transition the bar chart
    const group = this.chart.selectAll('.bar-group');
    const rects = group.selectAll('rect');
    rects
      .transition()
      .duration(5)
      .attr('height', this.yScale.bandwidth() * ((0 - this.progress) + 1))
      .attr('y', this.yScale.bandwidth() * (this.progress / 2))
      .attr('x', (d, i) => i * (this.baseWidth + this.progress * 10));

    if (this.progress > 0.5) {
      rects.transition()
        .duration(5)
        .attr('opacity', ((0 - this.progress) + 1));
    }

    // Transition the stat box
    this.stat.transition()
      .duration(5)
      .attr('opacity', this.progress * 1.1);

    this.stat.selectAll('rect')
      .transition()
      .duration(5)
      // .attr('width', this.progress * this.width * 2)
      .attr('height', normalizeTo(this.progress, 0, 0.8) * (this.height * 0.6)); //Make the animation complete at 80% progress

    // console.log('normalized range', normalizeTo(this.progress, 0, 0.8));
    // Function to animate the text value
    this.stat.select('text').transition().text((d) => {
      const interpolatedValue = Math.round(normalizeTo(this.progress, 0, 0.8) * d); //Make the animation complete at 80% progress
      return `${interpolatedValue} hours!`;
    });

    // Transition the y axis
    this.yAxis.attr('opacity', ((0 - this.progress) + 1));
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
    this.render();
  }
}
