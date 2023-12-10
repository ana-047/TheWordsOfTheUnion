class HeatmapChart {
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
      top: 10, right: 10, bottom: 65, left: 80,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Set up rectangle heatmap matrix inner padding
    const paddingMultiplier = 0.025; // Should be between 0 and 0.9 (1 would mean no rectangles show up)
    this.rectPadding = paddingMultiplier * (this.width / this.data.length);

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    // Create color scale
    const colorRange = [
      '#D1D9E5', // Min score (less similar speeches)
      '#556983', // Max score (more similar speeches)
    ];

    // this.colorScale = d3.scaleSequential(d3.interpolateGnBu);
    this.colorScale = d3.scaleSequential(d3.interpolateRgb)
      .range(colorRange);

    // Create X scale
    this.xScale = d3.scaleBand()
      .range([0, this.width]);

    // Create Y scale
    this.yScale = d3.scaleBand()
      .range([0, this.height]);

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', 0);
  }

  update() {
    const vis = this;

    // Prep data
    const years = Object.keys(vis.data[0]).slice(1);
    const matrixData = vis.data.map((d) => years.map((year) => +d[year]));

    // Update scale domains
    vis.xScale.domain(years);
    vis.yScale.domain(years);
    vis.colorScale.domain([d3.min(matrixData.flat()), d3.max(matrixData.flat())]);

    // Assign data to chart
    const cells = vis.chart.selectAll('.cell')
      .data(matrixData.flatMap((row, i) => row.map((value, j) => ({ row: i, col: j, value }))));

    // Render the chart
    cells.enter().append('rect')
      .attr('class', 'cell')
      .attr('x', (d) => vis.xScale(years[d.col]))
      .attr('y', (d) => vis.yScale(years[d.row]))
      // .attr('x', (d) => vis.xScale(years[d.col]) + (this.rectPadding / 100) * d.col) // Adjust x position for padding
      // .attr('y', (d) => vis.yScale(years[d.row]) + (this.rectPadding / 100) * d.row) // Adjust y position for padding
      .attr('width', vis.xScale.bandwidth() - (this.rectPadding)) // Reduce width to offset for the padding
      .attr('height', vis.yScale.bandwidth() - (this.rectPadding)) // Reduce height to offset for the padding
      .attr('rx', 2) // Set border radius for x-axis
      .attr('ry', 2) // Set border radius for y-axis
      .style('fill', (d) => vis.colorScale(d.value))
      .on('mouseover', (event, d) => {
        // console.log('heatmap tooltip trigger');
        // Get the client offsets so the tooltip appears over the mouse
        const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

        // Render the tooltip and update position
        vis.tooltip
          .transition()
          .duration(200)
          .style('opacity', 0.9)
          .style('left', `${offsetX + 30}px`)
          .style('top', `${offsetY - 20}px`);

        // Update tooltip contents
        vis.tooltip
          .html(`
            Comparing:
            <br><span class="pres-name">${vis.data[d.row].year}</span> to
            <br><span class="pres-name">${vis.data[d.col].year}</span>
            <br>
            <br>Similarity Score:
            <br><span class="similarity-score"> ${d.value}</span>
            `);

        // Update row and column styles
        // Get the row and column indices of the hovered cell
        const rowIndex = d.row;
        const colIndex = d.col;

        // Remove existing highlights
        vis.chart.selectAll('.cell').classed('highlight-row', false);
        vis.chart.selectAll('.cell').classed('highlight-column', false);

        // Select cells in the same row as the hovered cell (to the left)
        vis.chart.selectAll('.cell')
          .filter((cellData) => cellData.row === rowIndex && cellData.col < colIndex)
          .classed('highlight-row', true);

        // Select cells in the same column as the hovered cell (bottom)
        vis.chart.selectAll('.cell')
          .filter((cellData) => cellData.col === colIndex && cellData.row > rowIndex)
          .classed('highlight-column', true);
      })
      .on('mouseout', () => {
        // Hide tooltip
        vis.tooltip.transition()
          .duration(500)
          .style('opacity', 0);

        // Remove row and col highlights
        vis.chart.selectAll('.cell').classed('highlight-row', false);
        vis.chart.selectAll('.cell').classed('highlight-column', false);
      });

    // Show X Axis
    vis.chart.append('g')
      .attr('transform', `translate(0,${vis.height})`)
      .call(d3.axisBottom(vis.xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45) translate(-8, -5)')
      .style('text-anchor', 'end');

    // Show Y Axis
    vis.chart.append('g')
      .call(d3.axisLeft(vis.yScale));
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
