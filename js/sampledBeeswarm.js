class SampledBeeswarm {
  constructor(containerIds, data) {
    this.containerId = containerIds[0];
    this.tooltipId = containerIds[1];
    this.tooltip = null;

    this.data = data;
    this.sampleProportion = 0.2;
    this.radius = 2;

    this.init();
    this.render();
  }

  init() {
    const vis = this;
    console.log(vis.constructor.name, 'initializing');

    // Define chart container
    vis.chartContainer = d3.select(`#${vis.containerId}`);

    // Define dimensions
    vis.margin = {
      top: 20, right: 40, bottom: 40, left: 60,
    };
    vis.width = vis.chartContainer.node().offsetWidth - vis.margin.left - vis.margin.right;
    vis.height = vis.chartContainer.node().offsetHeight - vis.margin.top - vis.margin.bottom;

    // Define SVG area
    vis.svg = vis.chartContainer
      .append('svg')
      .attr('width', vis.width + vis.margin.left + vis.margin.right)
      .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
      .append('g')
      .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`)
      .attr('class', 'beeswarm-chart-area');

    // Create scales for x and y axes
    vis.xScale = d3
      .scaleLinear()
      .range([0, vis.width]);

    vis.yScale = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([vis.height, 0]);

    // Append a center axis line through 0 on the y-axis
    // Line created in init method so it renders behind the data
    vis.svg.append('line')
      .attr('x1', 0)
      .attr('y1', vis.yScale(0))
      .attr('x2', vis.width)
      .attr('y2', vis.yScale(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5 5') // Add dashed style
      .attr('class', 'x-axis');
  }

  // Method to sample a random subset of tagged_text objects from each year
  sampleTaggedText() {
    const vis = this;
    console.log(vis.constructor.name, 'sampling data');

    vis.sampledData = this.data.map((item) => {
      const { year, tagged_text } = item;
      const keys = Object.keys(tagged_text);
      const filteredKeys = keys.filter((key) => tagged_text[key].hasOwnProperty('s'));
      const sampleSize = Math.ceil(filteredKeys.length * vis.sampleProportion); // % of the filtered keys with 's' property
      const sampledKeys = filteredKeys.sort(() => 0.5 - Math.random()).slice(0, sampleSize);
      const sampledObjects = sampledKeys.map((key) => tagged_text[key]);
      return { year, tagged_text: sampledObjects };
    });
    // return sampledData;
  }

  render() {
    const vis = this;
    console.log(vis.constructor.name, 'rendering');

    // Sample the data
    vis.sampleTaggedText();
    // vis.sampledData = vis.sampleTaggedText();

    // Extracting 's' elements from data
    const circlesData = vis.sampledData.reduce((acc, curr) => {
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
    vis.xScale.domain(d3.extent(circlesData, (d) => d.year));
    vis.yScale.domain([-1, 1]);

    // Create simulation with forces
    const simulation = d3
      .forceSimulation(circlesData)
      .force('x', d3.forceX((d) => vis.xScale(d.year)).strength(0.1))
      .force('y', d3.forceY((d) => vis.yScale(d.s)).strength(0.5))
      .force(
        'collision',
        d3.forceCollide().radius(vis.radius),
      )
      .stop();

    for (let i = 0; i < 120; ++i) {
      simulation.tick();
    }

    // Appending circles to the SVG
    vis.svg
      .selectAll('circle')
      .data(circlesData)
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', this.radius)
      .attr('class', (d) => `dot ${d.t}`) // Add class based on 't' property
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);

    vis.initTooltip()
    vis.renderAxes();

    function handleMouseOver(event, d) {
      console.log('mouseover called');

      const dot = d3.select(this);
      vis.selectedDotData = dot.datum();

      // Update the tooltip
      vis.tooltip
        // .transition()
        // .duration(200)
        .style('opacity', 1)
        .html(`
          Year: <strong>${vis.selectedDotData.year}</strong> 
          <br>
          Word: <strong>${vis.selectedDotData.w}</strong> 
          <br> 
          Theme: <strong>${vis.selectedDotData.t}</strong> 
          <br>
          Sentiment: <strong>${vis.selectedDotData.s}</strong> 
          `)
    }

    function handleMouseOut(event, d) {
      console.log('mouseout called');
      vis.tooltip
        .style('opacity', 0);
        // .transition()
        // .duration(200)
        // .style('opacity', 0);
    }
  }

  renderAxes() {
    const vis = this;
    console.log(vis.constructor.name, 'rendering axes');

    // Define axes
    vis.xAxis = d3.axisBottom().scale(vis.xScale)
      .tickFormat(d3.format('d'));
    vis.yAxis = d3.axisLeft().scale(vis.yScale)
      .tickValues([-1, 0, 1]) // Set specific tick values
      .tickFormat((d) => (d === 0 ? '0' : d > 0 ? '+1' : '-1')); // Label format for sentiment scores;

    // Render axes
    vis.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${vis.height + vis.margin.bottom / 2})`)
      .call(vis.xAxis);

    vis.svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${-vis.margin.left / 2}, 0)`)
      .call(vis.yAxis);
  }

  initTooltip() {
    const vis = this;
    console.log(vis.constructor.name, 'initializing tooltip');

    // Define tooltip container
    vis.tooltipContainer = d3.select(`#${vis.tooltipId}`);

    vis.tooltip = vis.tooltipContainer
      .append('div')
      .attr('class', 'beeswarm-tooltip')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      // .style('background-color', 'lightgrey')
      .style('box-shadow', '2px 2px 6px rgba(0,0,0,0.3)');
  }
}
