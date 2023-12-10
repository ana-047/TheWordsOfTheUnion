class RacingBarsChart {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;
    this.data = data;

    // Render the chart
    this.init();
  }

  init() {
    const vis = this;
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

    // Scales and axes
    vis.y = d3.scaleBand()
      .range([vis.height, 0])
      .padding(0.1);

    vis.x = d3.scaleLinear()
      .range([0, vis.width]);

    // Set up and position axis groups
    vis.yAxis = d3.axisLeft()
      .scale(vis.y);

    vis.xAxis = d3.axisBottom()
      .scale(vis.x);

    vis.chart.append('g')
      .attr('class', 'y-axis axis');

    vis.chart.append('g')
      .attr('class', 'x-axis axis')
      .attr('transform', `translate(0,${vis.height})`);


    // Add x-axis title
    vis.chart.append('text')
        .attr('class', 'axis axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', vis.width / 2)
        .attr('y', vis.height + vis.margin.bottom -5)
        .text('Average SOTU Speech Word Count');

// Add y-axis title
    /*
    vis.chart.append('text')
        .attr('class', 'axis axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -vis.height / 2)
        .attr('y', -vis.margin.left + 20)
        .text('President');


     */

    // Legend
    const keys = ['Republican', 'Democratic', 'Other'];

    // Declare party color variables
    vis.partyColors = Object.values(partyColors).slice(0, 3);

    const color = d3.scaleOrdinal()
      .domain(keys)
      // .range(["#FF8B8B", "#83A2FF", "#FFD28F"]);
      .range(vis.partyColors);

    const size = 20;
    const rowGap = 5;

    // Set up the legend groups
    vis.chart.append('g')
      .attr('class', 'legend')
      .selectAll('.myLegend')
      .data(keys)
      .enter()
      .append('rect')
      .attr('class', 'myLegend')
      .attr('x', vis.width - 100)
      .attr('y', (d, i) => (i * (size + rowGap)))
      .attr('width', size)
      .attr('height', size)
      .style('fill', (d) => color(d));

    vis.chart.append('g')
      .attr('class', 'legend')
      .selectAll('.myLabels')
      .data(keys)
      .enter()
      .append('text')
      .attr('class', 'myLabels label')
      .attr('x', vis.width - 100 + size * 1.2)
      .attr('y', (d, i) => (i * (size + rowGap)) + (size * 0.55) )
      .style('fill', (d) => color(d))
      .text((d) => d)
      .attr('text-anchor', 'left')
      .style('dominant-baseline', 'middle'); // I think dominant-baseline is for svg text and alignment-baseline is for other things?

    // Sort the data and prep for display
    vis.displayData = vis.data.sort((a, b) => a.year - b.year);

    const t = 800;

    vis.x.domain([0, 20000]);
    vis.y.domain(vis.displayData.map((d) => d.name)) //.sort())

    // console.log(vis.displayData.map(d => d.name))

    d3.select('#presidents')
      .selectAll('option')
      .data(vis.displayData.map((d) => d.name).reverse())
      .enter()
      .append('option')
      .attr('value', (d) => d)
      .text((d) => d);

    vis.chart.select('.y-axis')
      .transition()
      .duration(t)
      .call(vis.yAxis);

    vis.chart.select('.x-axis')
        .transition()
        .duration(t)
      .call(vis.xAxis)
     // .attr('color', '#EFEFEF');

    // Add a button to start the animation
    d3.select('#startBars')
      .on('click', () => this.wrangleData()); // Call startAnimation when the button is clicked

    d3.select('#resetBars')
      .on('click', () => this.resetAnimation()); // Call startAnimation when the button is clicked

    // Create a tooltip div
    //vis.tooltip = d3.select('#presidents').append('div')
   //   .attr('class', 'tooltip')
   //   .style('opacity', 0)
   //   .style('pointer-events', 'none')
      // .style('background-color', 'lightgrey')
   //   .style('box-shadow', '2px 2px 6px rgba(0,0,0,0.3)');

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
        .attr('class', 'heatmap-tooltip')
        .style('opacity', 0);
  }

  wrangleData() {
    const vis = this;

    vis.displayData = vis.data.sort((a, b) => a.year - b.year).slice();

    vis.avg_democrat = d3.mean(vis.displayData.filter((d) => d.party === 'Democratic'), (d) => d.word_count);
    vis.avg_republican = d3.mean(vis.displayData.filter((d) => d.party === 'Republican'), (d) => d.word_count);

    vis.avg_overall = d3.mean(vis.displayData, (d) => d.word_count);

    vis.updateVis();
  }

  updateVis() {
    const vis = this;

    const t = 2000;

    const myPres = d3.select('#presidents').property('value');

    // d3.select("#startBars").attr("disabled", true);


    // overall line
    vis.chart.append('line')
      .attr('class', 'vertical-line')
      .attr('x1', vis.x(vis.avg_overall))
      .attr('y1', 0)
      .attr('y2', vis.height)
      .attr('x2', vis.x(vis.avg_overall))
        .on('mouseover', (event, d) => {
          // console.log('heatmap tooltip trigger');
          // Get the client offsets so the tooltip appears over the mouse
          const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

          let format = d3.format(",");

          // Render the tooltip and update position
          vis.tooltip
              .transition()
              .duration(200)
              .style('opacity', 0.9)
              .style('left', `${offsetX + 10}px`)
              .style('top', `${offsetY - 20}px`);

          // Update tooltip contents
          vis.tooltip
              .html(`Party: All parties <br> Average speech length: ${format(Math.round(vis.avg_overall))} words`);

        })

        .on('mouseout', () => {
          // Hide tooltip
          vis.tooltip.transition()
              .duration(500)
              .style('opacity', 0);

        })

      .transition()
        .delay(8000)
      .duration(t)

      .style('stroke', 'black')
      .style('stroke-width', 5)
      //.style('stroke-dasharray', '20,5')


    // democratic
    vis.chart.append('line')
      .attr('class', 'vertical-line party-democrat')
      .attr('x1', vis.x(vis.avg_democrat))
      .attr('y1', 0)
      .attr('y2', vis.height)
      .attr('x2', vis.x(vis.avg_democrat))
        .on('mouseover', (event, d) => {
          // console.log('heatmap tooltip trigger');
          // Get the client offsets so the tooltip appears over the mouse
          const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

          let format = d3.format(",");

          // Render the tooltip and update position
          vis.tooltip
              .transition()
              .duration(200)
              .style('opacity', 0.9)
              .style('left', `${offsetX + 10}px`)
              .style('top', `${offsetY - 20}px`);

          // Update tooltip contents
          vis.tooltip
              .html(`Party: Democrat <br> Average speech length: ${format(Math.round(vis.avg_democrat))} words`);

        })

        .on('mouseout', () => {
          // Hide tooltip
          vis.tooltip.transition()
              .duration(500)
              .style('opacity', 0);

        })

      .transition()
        .delay(8000)
      .duration(t)

      .style('stroke', '#53AEF4')
      .style('stroke-width', 5)
      //.style('stroke-dasharray', '20,5')


    // republican
    vis.chart.append('line')
      .attr('class', 'vertical-line party-republican')
      .attr('x1', vis.x(vis.avg_republican))
      .attr('y1', 0)
      .attr('y2', vis.height)
      .attr('x2', vis.x(vis.avg_republican))
        .on('mouseover', (event, d) => {
          // console.log('heatmap tooltip trigger');
          // Get the client offsets so the tooltip appears over the mouse
          const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

          let format = d3.format(",");

          // Render the tooltip and update position
          vis.tooltip
              .transition()
              .duration(200)
              .style('opacity', 0.9)
              .style('left', `${offsetX + 10}px`)
              .style('top', `${offsetY - 20}px`);

          // Update tooltip contents
          vis.tooltip
              .html(`Party: Republican <br> Average speech length: ${format(Math.round(vis.avg_republican))} words`);

        })

        .on('mouseout', () => {
          // Hide tooltip
          vis.tooltip.transition()
              .duration(500)
              .style('opacity', 0);

        })
      .transition()
        .delay(8000)
      .duration(t)
      .style('stroke', '#DB767B')
      .style('stroke-width', 5)
      //.style('stroke-dasharray', '20,5')


    vis.bars = vis.chart.selectAll('.racingBars')
      .data(vis.displayData);

    vis.bars.enter()
      .append('rect')
      .attr('class', 'racingBars')
      .attr('y', (d) => vis.y(d.name))
      .attr('height', vis.y.bandwidth())
      .attr('x', 0)
      // .attr("width", d => vis.x(0))
      .attr('fill', (d) => {
        if (d.name === myPres) {
          return '#E3CD7A';
        }
        return 'grey';
      })

        .on('mouseover', (event, d) => {
          // console.log('heatmap tooltip trigger');
          // Get the client offsets so the tooltip appears over the mouse
          const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

          let format = d3.format(",");

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
                <span class="pres-name">President: ${d.name}</span> 
            <br><span class="pres-name">Average speech length: ${format(Math.round(d.word_count))} words</span>
            `);

      })

        .on('mouseout', () => {
          // Hide tooltip
          vis.tooltip.transition()
              .duration(500)
              .style('opacity', 0);

        })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 2000) { return vis.x(d.word_count); } return vis.x(2000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 4000) { return vis.x(d.word_count); } return vis.x(4000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 6000) { return vis.x(d.word_count); } return vis.x(6000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 8000) { return vis.x(d.word_count); } return vis.x(8000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 10000) { return vis.x(d.word_count); } return vis.x(10000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 12000) { return vis.x(d.word_count); } return vis.x(12000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 14000) { return vis.x(d.word_count); } return vis.x(14000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 16000) { return vis.x(d.word_count); } return vis.x(16000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => {
        if (d.word_count < 18000) { return vis.x(d.word_count); } return vis.x(18000);
      })
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('width', (d) => vis.x(d.word_count))
      .transition()
      .delay(800)
      .duration(1200)
      .attr('fill', (d) => {
        if (d.party === 'Republican') {
          return partyColors['party-republican'];
        } if (d.party === 'Democratic') {
          return partyColors['party-democrat'];
        }
        return partyColors['party-other'];
      })

    /*
    .attr("class", d=>{
        if(d.party === "Republican"){
            return "racingBars party-republican"
        }else if(d.party === "Democratic"){
            return "racingBars party-democrat"
        }else{
            return "racingBars party-other"
        }
    })
    */

    // this part doesn't work
    /*
    .on("end", function (d) {
        // Append image at the end of each bar
        vis.svg.append("image")
            .attr("xlink:href", d => `images/Portraits/${d.image}-*.jpeg`)
            .attr("x", vis.x(d.word_count)) // Adjust the position based on your requirements
            .attr("y", vis.y(d.name))
            .attr("width", vis.x(20)) //
            .attr("height", vis.y.bandwidth());
    })
    */

    ;

    vis.bars.exit().remove();

    // d3.select("#startBars").attr("disabled", false);
  }

  resetAnimation() {
    const vis = this;

    vis.chart.selectAll('.racingBars').remove();

    vis.chart.selectAll('.vertical-line').remove();

    //vis.chart.select('.x-axis').attr('color', '#EFEFEF');
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
