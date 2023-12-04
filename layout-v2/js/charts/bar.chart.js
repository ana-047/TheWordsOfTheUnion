class BarChart {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;
    this.data = data;

    // Render the chart
    this.init();
    this.update();
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
      top: 10, right: 20, bottom: 40, left: 40,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    // Set up scales
    this.x = d3.scaleBand()
      .range([0, this.width])
      .padding(0.1);

    this.y = d3.scaleLinear()
      .range([this.height, 0]);

    // Set up and position axis groups
    this.xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${this.height + this.margin.bottom * 0.02})`);

    this.yAxis = this.chart.append('g')
      .attr('transform', `translate(${-0.05 * this.margin.left}, 0)`);
  }

  update() {
    // Make the data is available to the update method
    const { data } = this;

    // Update axis domains based on the data
    this.x.domain(data.map((d) => d.year));
    this.y.domain([0, d3.max(data, (d) => Object.keys(d.tagged_text).length)]);

    // Generating a random color
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    // Generating a generic bar chart
    this.chart.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => this.x(d.year))
      .attr('width', this.x.bandwidth())
      .attr('y', (d) => this.y(Object.keys(d.tagged_text).length))
      .attr('height', (d) => this.height - this.y(Object.keys(d.tagged_text).length))
      .attr('fill', randomColor); // Applying the random color to bars

    // Call the axes to show them
    this.xAxis.call(d3.axisBottom(this.x));
    this.yAxis.call(d3.axisLeft(this.y));
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
