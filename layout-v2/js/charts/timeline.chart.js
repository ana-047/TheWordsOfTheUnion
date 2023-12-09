// TODO Add tooltip
class TimelineChart {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;
    this.data = data;

    this.circleRatius = 5;

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
      top: 10, right: 10, bottom: 20, left: 10,
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
    // Create x and y scales
    this.xScale = d3.scaleLinear()
      .domain([d3.min(this.data, d => d.year), d3.max(this.data, d => d.year)])
      .range([0, this.width]);

    this.yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([this.height, 0]);

    // Set up and position axis groups
    this.xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${this.height + this.margin.bottom * 0.02})`);

    this.yAxis = this.chart.append('g')
      .attr('transform', `translate(${-0.05 * this.margin.left}, 0)`);

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'timeline-tooltip')
      .style('opacity', 0);

    this.update();
  }

  update() {
    const vis = this;
    // Make the data is available to the update method
    const { data } = this;

    // Update axis domains based on the data

    // Draw circles for each data point
    const circles = this.chart.selectAll("circle")
      .data(this.data)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${this.xScale(d.year)}, ${this.yScale(d.y_position) - 4})`);

    // Draw lines from each circle to y = 0
    this.lines = this.chart.selectAll("line")
      .data(this.data)
      .enter()
      .append("line")
      .attr("x1", d => this.xScale(d.year))
      .attr("y1", d => this.yScale(d.y_position))
      .attr("x2", d => this.xScale(d.year))
      .attr("y2", this.height)
      .attr("stroke", "gray")
      .attr("stroke-width", 1);

    circles.append("circle")
      .attr("r", this.circleRatius)
      .attr('class', (d) => {
        const mode = d.delivery_mode;
        function preProcessClass (mode) {
          return mode.replace(/\s+/g, '-').toLowerCase();
        }
        return preProcessClass(mode);
      })
      .on('mouseover', (event, d) => {
        // Get the client offsets so the tooltip appears over the mouse
        const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

        // Render the tooltip and update position
        vis.tooltip
          .transition()
          .duration(200)
          .style('opacity', 0.9)
          .style('left', `${offsetX + 10}px`)
          .style('top', `${offsetY - 20}px`);

        // Update tooltip contents
        vis.tooltip
          .html(`
            <span class="pres-name">${d.name}</span>
            <br><span class="label"> (${d.party})</span>
            <br><span class="label">${d.year}</span>
            
          `);
      })
      .on('mouseout', (event, d) => {
        // Hide the tooltip
        vis.tooltip
          .transition()
          .duration(200)
          .style('opacity', 0);
      });

    // Append annotation text
    circles.each(function(d) {
      if (d.annotation) {
        d3.select(this)
          .append("text")
          .attr("x", 10)
          .attr("y", 2)
          .text(d.annotation)
          .attr('class', 'label');
      }
    });

    // Append name text
    circles.each(function(d) {
      if (d.annotation) {
        d3.select(this)
          .append("text")
          .attr("x", 10)
          .attr("y", -14)
          .text(d.name)
          .attr('class', 'small-annotation');
      }
    });

    // Append year text
    circles.each(function(d) {
      if (d.annotation) {
        d3.select(this)
          .append("text")
          .attr("x", 10)
          .attr("y", 15)
          .text(d.year)
          .attr('class', 'smallest-annotation');
      }
    });

    // Call the axes to show them
    this.xAxis.call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')));

    // Create a legend
    const uniqueDeliveryModes = [...new Set(data.map(d => d.delivery_mode))]; // Get unique delivery modes
    const legend = this.chart.selectAll(".legend")
      .data(uniqueDeliveryModes)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${this.margin.right},${i * 20})`); // Adjust spacing between legend items

    legend.append("circle")
      .attr("r", this.circleRatius)
      .attr("cx", this.width - this.margin.right - (this.circleRatius / 2))
      .attr("cy", 9)
      .attr('class', d => {
        // Assign a color based on delivery mode
        let cssClass;
        if (d === 'In Person') {
          cssClass = 'in-person';
        } else if (d === 'In Writing') {
          cssClass = 'in-writing';
        } else if (d === 'Televised') {
          cssClass = 'televised';
        } else {
          cssClass = ''
        }
        return cssClass;
      });

    legend.append("text")
      .attr("x", this.width - this.margin.right - (this.circleRatius * 2))
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .attr('class', 'small-annotation')
      .text(d => d);
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
