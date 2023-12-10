class StackedBarChart {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;
    this.data = data;

    // Render the chart
    this.init();
    // this.update();
  }

  init() {
    const vis = this;

    //globalBrushYears
    /*

     static updateBrushYears(chartInstance, brushYears) {
    // Your logic to update the StackedBarChart based on brushYears
    // For example, you can filter the data and call wrangleData and update methods again
    chartInstance.wrangleData(brushYears[0], brushYears[1]);
  }
     */

    vis.minYear = 1923
    vis.maxYear = 2023

    document.addEventListener('brushChange', () => {

     if(globalBrushYears) {
       vis.minYear = globalBrushYears[0]
       vis.maxYear = globalBrushYears[1]

     } else {
       vis.minYear = 1923
       vis.maxYear = 2023
     }

      this.wrangleData(vis.minYear, vis.maxYear);

    });


    // Get the bounding box of the SVG element
    this.svgBoundingBox = this.svg.node().getBoundingClientRect();

    // Determine available width and height based on parent SVG
    const containerWidth = this.svgBoundingBox.width;
    const containerHeight = this.svgBoundingBox.height;

    console.log(this.svgBoundingBox)

    // Make sure chart height isn't more than window height because the chart div doesn't scroll
    const localHeight = Math.min(containerHeight, globalWindowHeight);

    // Declare local chart margins
    this.margin = {
      top: 10, right: 200, bottom: 50, left: 130,
    };

    // Declare dimensions for local chart
    vis.width = containerWidth - this.margin.left - this.margin.right;
    vis.height = localHeight - this.margin.top - this.margin.bottom;

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class


    // Add x-axis title
    vis.chart.append('text')
        .attr('class', 'axis axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', vis.width / 2)
        .attr('y', vis.height + 40)
        .text('Proportion of Speech (%)');

// Add y-axis title
    /*
    vis.chart.append('text')
        .attr('class', 'axis axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -vis.height / 2)
        .attr('y', -vis.margin.left + 10)
        .text('President');

     */

    // vis.margin = {
    //   top: 20, right: 250, bottom: 60, left: 120,
    // };
    // vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
    // vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

    // init drawing area
    // vis.svg = d3.select(`#${vis.parentElement}`).append('svg')
    //   .attr('width', vis.width + vis.margin.left + vis.margin.right)
    //   .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
    //   .append('g')
    //   .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

    // Scales and axes
    vis.y = d3.scaleBand()
      .range([vis.height, 0])
      .padding(0.1);

    vis.x = d3.scaleLinear()
      .range([0, vis.width]);

    vis.yAxis = d3.axisLeft()
      .scale(vis.y);

    vis.xAxis = d3.axisBottom()
      .scale(vis.x);

    vis.chart.append('g')
      .attr('class', 'y-axis axis');

    vis.chart.append('g')
      .attr('class', 'x-axis axis')
      .attr('transform', `translate(0,${vis.height})`);
    // legend

    vis.keys = Object.keys(vis.data[0]).slice(2);

    // Get theme colors from main and convert to array
    vis.themeColors = Object.values(themeColors);

    vis.colorScale = d3.scaleOrdinal()
      .domain(vis.keys)
      // .range(["#FFD28F",  "#6BD425", "#83A2FF", "#EB4747", "#2274A5", "#F7AEF8", "#5BD1D7"]);
      .range(vis.themeColors);

    const size = 20;

    vis.chart.append('g')
      .attr('class', 'legend')
      .selectAll('.myLegend2')
      .data(vis.keys)
      .enter()
      .append('rect')
      .attr('class', 'myLegend2')
      .attr('x', vis.width + 10)
      .attr('y', (d, i) => 10 + i * (size + 5))
      .attr('width', size)
      .attr('height', size)
      .style('fill', (d) => vis.colorScale(d));

    vis.chart.append('g')
      .attr('class', 'legend')
      .selectAll('.mylabels2')
      .data(vis.keys)
      .enter()
        .append('g') // Create a group for each legend item
        .attr('class', 'mylabels2 legend-item selected')
        .attr('transform', (d, i) => `translate(${vis.width +10 + size * 1.2},${10 + i * (size + 5)})`)
        .each(function (d) {
          // Append rectangle to the group
          d3.select(this)
              .append('rect')
              .attr('class', 'theme-label-background')
              .attr('width', 160)
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



    vis.chart.selectAll('.mylabels2')
        .on('click', function (event, d) {
          // Check how many labels are selected
          const labels = vis.chart.selectAll('.mylabels2.selected');
          const counter = Object.values(labels)[0][0].length;

          if (vis.selectedTheme === d && counter === 1) {
            // Update the selection property and trigger global update
            vis.selectedTheme = null;
            globalLineSelection = vis.selectedTheme;
            triggerLineChange();

            // Turn off the filter
            // Select all items
            vis.chart.selectAll('.mylabels2').classed('selected', true);


            // re-load data
            vis.wrangleData(vis.minYear, vis.maxYear);
          } else {
            // Update the selection property and trigger global update
            vis.selectedTheme = d;
            globalLineSelection = vis.selectedTheme;
            triggerLineChange();

            // Deselect all items
            vis.chart.selectAll('.mylabels2').classed('selected', false);

            // Toggle class for selected appearance
            d3.select(this).classed('selected', true);

            // Toggle visibility of data points based on the selected theme
            vis.wrangleData(vis.minYear, vis.maxYear);


          }
        });


     // .append('text')
     //   .attr('class', 'mylabels2')
     // .attr('x', vis.width + vis.margin.right - 170 + size * 1.2)
     // .attr('y', (d, i) => 10 + i * (size + 5) + (size / 2))
     // .style('fill', 'black')
     // .text((d) => d)
    //  .attr('text-anchor', 'left')
     // .style('alignment-baseline', 'middle');

// Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
        .attr('class', 'heatmap-tooltip')
        .style('opacity', 0);


    this.wrangleData(1923, 2023);
  }

  wrangleData(minYear, maxYear) {
    const vis = this;

    //globalThemeSelection

    const sortData = vis.data.sort((a, b) => a.year - b.year).filter(d => d.year >= minYear && d.year <= maxYear);

    if(globalLineSelection) {
      vis.keysNew = Object.keys(sortData[0]).slice(2).filter(key => key === globalLineSelection);
    } else {
      vis.keysNew = Object.keys(sortData[0]).slice(2)
    }

    // Stack the data per subgroup
    vis.displayData = d3.stack()
      .keys(vis.keysNew)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)(sortData)
      .map((data, i) => {
        let cumulativeValue = 0;
        return data.map((d) => {
          cumulativeValue += d[1] - d[0];
          return {
            name: d.data.name,
            key: vis.keysNew[i],
            value: d[1] - d[0],
            value_d0: d[0],
            value_d1: d[1],
            cumulativeValue,
          };
        });
      });

    // Flatten the nested structure

      vis.displayData = vis.displayData.flat()

    // Extract unique president names for y-axis domain
    vis.y.domain(vis.displayData.map((d) => d.name));

    vis.update();
  }

  update() {
    const vis = this;

    const t = 800;

    const myMax = d3.max(vis.displayData, (d) => d.value_d1);

    /*
    // color scale
    vis.colorScale = d3.scaleOrdinal()
        .domain(vis.keys)
        .range(["#61E8E1", "#EB4747", "#FFD28F", "#83A2FF", "#1D3354", "#52489C", "#0F7173", "#CD3983", "#AF2BBF", "#857AB7", "#00487C"]);
*/

    vis.x.domain([0, myMax]);

    vis.chart.select('.x-axis')
      .transition()
      .duration(t)
      .call(vis.xAxis)
        .selectAll(".tick text")
        .text(d => d + '%');

    vis.chart.select('.y-axis')
      .transition()
      .duration(t)
      .call(vis.yAxis);

    vis.bars = vis.chart.selectAll('.stackedBars')
      .data(vis.displayData, d=>d.name + d.key);

    vis.bars.enter()
      .append('rect')
      .attr('class', 'stackedBars')
      .merge(vis.bars)
      .each((d) => {
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
              .html(`<span class="pres-name">President: ${d.name}</span>
<br> <span class="pres-name">Theme: ${d.key}</span>
<br> <span class="pres-name">Proportion: ${format(Math.round(d.value))}%</span>`);
        })
        .on('mouseout', () => {
          // Hide tooltip
          vis.tooltip.transition()
              .duration(500)
              .style('opacity', 0);

        })
      .attr('y', (d) => vis.y(d.name))
      .attr('height', vis.y.bandwidth())
      .transition()
      .duration(t)
      .attr('x', (d) => vis.x(d.value_d0))
      .attr('width', (d) => vis.x(d.value_d1) - vis.x(d.value_d0))
      .attr('fill', (d) => vis.colorScale(d.key));

    vis.bars.exit()
      .remove();

    /*
            /// Update the rectangles
            vis.svg.selectAll("rect")
                .data(vis.displayData)
                .join("rect")
                .transition()
                .duration(t)
                .attr("x", d => vis.x(0))
                .attr("y", d => vis.y(d.name))
                .attr("width", d => vis.x(d.value))
                .attr("height", vis.y.bandwidth())
                .attr("fill", d => vis.colorScale(d.key));

        */
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
