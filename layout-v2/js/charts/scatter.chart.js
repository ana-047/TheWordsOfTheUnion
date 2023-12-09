class ScatterPlot {
  constructor(svgContainer, data) {
    // Container assignment
    this.svg = svgContainer;
    this.data = data;
    this.filteredData = null;
    this.selectedCountryNames = [null];
    this.selectedCountryName = null;
    this.localSectionIndex = null;
    this.radius = 4;

    // Render the chart
    this.init();
    this.update();
  }

  init() {
    const vis = this;

    // Listen for the countryChange event and update the chart accordingly
    document.addEventListener('countryChange', () => {
      this.selectedCountryNames = Array.isArray(globalCountrySelection) ? globalCountrySelection : [globalCountrySelection];
      // this.selectedCountryNames = [globalCountrySelection];

      this.update();
    });

    // Listen for the sectionChange event and update the chart accordingly to highlight specific countries
    document.addEventListener('sectionChange', () => {
      if ([11, 12, 13].includes(globalSectionIndex)) {
        this.handleFocusState();
      } else {
        // this.doSomething()
      }
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
      top: 40, right: 10, bottom: 30, left: 60,
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

    // Add count y-axis label group
    vis.yAxisLabel = this.chart
      .append('g')
      .attr('class', 'deactivated');

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'scatterplot-tooltip')
      .style('opacity', 0);
  }

  update() {
    const vis = this;
    // Filer the data to the selected country
    // vis.filteredData = vis.data.filter((d) => d.Country === vis.selectedCountryName);
    vis.filteredData = vis.data.filter((d) => vis.selectedCountryNames.includes(d.Country));

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
    if (!vis.selectedCountryNames || vis.filteredData.length === 0) {
      // If the country exists but there's no data
      if (vis.filteredData.length === 0 && vis.selectedCountryNames[0]) {
        // Add a message for country with no data
        vis.chart.append('g')
          .attr('class', 'scatter-note')
          .append('text')
          .attr('x', vis.width * 0.5)
          .attr('y', vis.margin.top * 0.8)
          .style('text-anchor', 'middle')
          .text(`There are no mentions of ${vis.selectedCountryNames[0]}, try exploring a different country!`);
      } else {
      // Create a help text title
        vis.selectedCountryNames[0] = 'Click a country to explore its historical mentions';
      }
      // If there's no data, hide the plot axes
      vis.xAxisGroup.classed('deactivated', true);
      vis.yAxisGroup.classed('deactivated', true);
      vis.yAxisLabel.classed('deactivated', true);
    } else {
      // If there is data, create scatter plot circles
      // Plot data
      vis.chart.selectAll('circle')
        .data(vis.filteredData)
        .enter()
        .filter((d) => +d.Mentions > 0)
        .append('circle')
        .attr('cx', (d) => vis.xScale(+d.Year))
        .attr('cy', vis.height)
        .attr('r', 0)
        .transition()
        .duration(900)
        .attr('cx', (d) => vis.xScale(+d.Year))
        .attr('cy', (d) => vis.yScale(+d.Mentions))
        .attr('r', this.radius)
        .attr('class', (d) => {
          // Generate class string
          let classString = 'party-other';
          if (vis.selectedCountryNames.length > 1) {
            if (vis.selectedCountryNames.length <= 2) {
              if (d.Country === 'Mexico') {
                classString = 'country-mx';
              } else {
                classString = 'country-uk';
              }
            } else {
              if (d.Country === 'China') {
                classString = 'country-ch';
              } else if (d.Country === 'Afghanistan') {
                classString = 'country-af';
              } else if (d.Country === 'Iran') {
                classString = 'country-ir';
              } else if (d.Country === 'Russia') {
                classString = 'country-ru';
              } else if (d.Country === 'Syria') {
                classString = 'country-sy';
              } else if (d.Country === 'Cuba') {
                classString = 'country-cu';
              } else if (d.Country === 'North Korea') {
                classString = 'country-nk';
              }
            }
          } else {
            classString = 'selected';

            // Make it highlight based on party instead of a constant color for the selection
            // if (d.Party === 'Republican') {
            //   classString = 'party-republican';
            // } else if (d.Party === 'Democratic') {
            //   classString = 'party-democrat';
            // } else {
            //   classString = 'party-other';
            // }
          }
          return classString;
        });

      // If there is data, show the plot axes
      vis.xAxisGroup.classed('deactivated', false);
      vis.yAxisGroup.classed('deactivated', false);

      // Update y-axis label
      vis.yAxisLabel.append('text')
        .attr('class', 'axis axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - this.margin.left)
        .attr('x', 0 - (this.height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Count of Country Mentions');

      // If there is data, show the axis labael
      vis.yAxisLabel.classed('deactivated', false);
    }

    // Generate title string
    let titleString = vis.selectedCountryNames[0];
    if (vis.selectedCountryNames.length > 1) {
      if (vis.selectedCountryNames.length <= 2) {
        titleString = 'Mexico and the United Kingdom';
      } else {
        titleString = 'China, Afghanistan, Iran, Russia, Syria, Cuba, and North Korea';
      }
    }
    // Add title to the chart area
    vis.chart.append('g')
      .attr('class', 'scatter-title')
      .append('text')
      .attr('x', vis.width * 0.5)
      .attr('y', vis.margin.top * -0.3)
      .style('text-anchor', 'middle')
      .text(titleString)
      .attr('class', 'scatter-title');

    // Tooltip handling
    vis.chart.selectAll('circle')
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

        let pluralMentions = 'mentions';
        if (+d.Mentions === 1) {
          pluralMentions = 'mention';
        }

        // Update tooltip contents
        vis.tooltip
          .html(`
            <span>${d.Mentions} ${pluralMentions} of </span>
            <span><b>${d.Country}</b> from </span>
            <span class="pres-name">${d.President}</span>
            <span> (${partyText(d.Party)}) in ${d.Year}</span>
          `);
      })
      .on('mouseout', () => {
        // Hide tooltip
        vis.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Call the axes to show them
    vis.xAxisGroup
      .transition()
      .duration(500)
      .call(vis.xAxis);

    vis.yAxisGroup
      .transition()
      .duration(500)
      .call(vis.yAxis);
  }

  handleFocusState() {
    const vis = this;
    if (globalSectionIndex === 12) {
      if (this.localSectionIndex === 12) {
      } else {
        // Show Mexico and UK
        vis.selectedCountryNames = ['Mexico', 'United Kingdom'];
        vis.update();

        // Update local section index to avoid repeat animations
        vis.localSectionIndex = 12;
      }
    } else if (globalSectionIndex === 13) {
      if (this.localSectionIndex === 13) {
      } else {
        // Show China, Afghanistan, Iran, Russia, Syria, Cuba, and North Korea
        vis.selectedCountryNames = ['China', 'Afghanistan', 'Iran', 'Russia', 'Syria', 'Cuba', 'North Korea'];
        vis.update();

        // Update local section index to avoid repeat animations
        vis.localSectionIndex = 13;
      }
    } else {
      if (this.localSectionIndex === 11) {
      } else {
        // Clear the selection
        vis.selectedCountryNames = [null];
        vis.update();

        // Update local section index to avoid repeat animations
        vis.localSectionIndex = 11;
      }
    }
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
