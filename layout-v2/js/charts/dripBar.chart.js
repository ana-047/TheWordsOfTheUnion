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
      return { year: d.year, name:d.name, counts };
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
      .data((key) => stackedData.map((d) => ({ key, value: d.counts[key] || 0, t: key, year: d.year, name: d.name})));

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
        const { year, name, t, value} = d;
        // const tooltipText = `Year: ${year}, President: ${name}, Theme: ${t}, Count: ${value}`;

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
          .html(`
            In <span class="label">${year}</span>, <b class="pres-name">${name}</b>
            <br>mentioned words related to <span class="label">${t}</span>
            <span class="label">${value} times</span>.
          `);
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

class DripBarChart2 {
  constructor(svgContainer, data) {
    this.svg = svgContainer;
    this.data = data;
    this.filteredData = null;
    this.selectedTheme = null;
    this.init();
    this.update();
  }

  init() {
    document.addEventListener('themeChange', () => {
      this.selectedTheme = globalThemeSelection && globalSectionIndex >= 7 ? globalThemeSelection.toLowerCase() : null;
      this.update();
    });

    this.setupDimensions();
    this.setupScales();
    this.createChart();
    this.createTooltip();
  }

  setupDimensions() {
    const { width, height } = this.svg.node().getBoundingClientRect();
    const containerHeight = Math.min(height, globalWindowHeight);
    this.margin = { top: 20, right: 128, bottom: 120, left: 60 };
    this.width = width - this.margin.left - this.margin.right;
    this.height = containerHeight - this.margin.top - this.margin.bottom;
  }

  setupScales() {
    this.xScale = d3.scaleBand().range([0, this.width]).padding(0.1);
    this.yearScale = d3.scaleLinear().domain([1790, 2021]).range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
  }

  createChart() {
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'drip-chart-area deactivated');
    this.xAxis = this.chart.append('g').attr('transform', `translate(0,${this.height + this.margin.bottom * 0.02})`);
    this.yAxis = this.chart.append('g').attr('transform', `translate(${-0.5 * this.margin.left}, 0)`);
  }

  createTooltip() {
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'drip-tooltip')
      .style('opacity', 0);
  }

  filterData() {
    this.filteredData = this.data.map((item) => {
      const { year, name, tagged_text } = item;
      const keys = Object.keys(tagged_text);
      const filteredKeys = keys.filter((key) => !this.selectedTheme || (tagged_text[key].hasOwnProperty('s') && tagged_text[key].t === this.selectedTheme));
      const filteredObjects = filteredKeys.map((key) => tagged_text[key]);
      return { year, name, tagged_text: filteredObjects };
    });

  }

  renderChart() {
    // Process the data to generate the stacked bar chart
    const keys = Array.from(new Set(this.filteredData.flatMap((d) => Object.values(d.tagged_text).map((item) => ({ key: item.t, year: d.year, name: d.name })))));

    const stackedData = this.filteredData.map((d) => {
      const counts = {};
      keys.forEach((keyObj) => {
        const key = keyObj.key;
        counts[key] = Object.values(d.tagged_text).reduce((acc, item) => (item.t === key ? acc + 1 : acc), 0);
      });
      return { year: d.year, name: d.name, counts };
    });

    // Update scale domains
    this.xScale.domain(this.filteredData.map((d) => d.year)).padding(0.1);

    const maxBarValue = d3.max(stackedData, (d) => d3.max(Object.values(d.counts)));
    this.yScale.domain([0, maxBarValue]);

    const bars = this.chart.selectAll('.bar')
      .data(keys);

    bars.exit().remove();

    const newBars = bars.enter().append('g').attr('class', 'bar');

    const allBars = newBars.merge(bars).selectAll('rect')
      .data((keyObj) => {
        const key = keyObj.key;
        return stackedData.map((d) => ({
          key: key,
          year: d.year,
          name: d.name,
          value: d.counts[key] || 0,
          t: key,
        }));
      });

    allBars.enter().append('rect')
      .attr('x', (d, i) => this.xScale(stackedData[i].year))
      .attr('width', this.xScale.bandwidth())
      .merge(allBars)
      .attr('y', this.height)
      .attr('height', 0)
      .on('mouseover', (event, d) => {
        const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);
        const tooltipText = `Year: ${d.year}, President: ${d.name}, Theme: ${d.t}`;

        d3.select(event.currentTarget).classed('selected', true);

        this.tooltip.transition().duration(200)
          .style('opacity', 1)
          .style('left', `${offsetX + 4}px`)
          .style('top', `${offsetY - 36}px`)
          .html(tooltipText);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).classed('selected', false);
        this.tooltip.transition().duration(500).style('opacity', 0);
      })
      .transition().duration(1200)
      .attr('y', (d) => this.yScale(d.value))
      .attr('height', (d) => this.height - this.yScale(d.value))
      .attr('class', (d) => `bar-segment ${d.t}`);

    this.initYearAxis();
    this.initXAxis();
    this.updateYAxis();
  }

  update() {
    this.filterData();
    // this.renderChart()
    this.initYearAxis();
    this.initXAxis();
    this.updateYAxis();
    // Additional update logic...
  }

  initYearAxis() {
    this.yearAxis = d3.axisBottom().scale(this.yearScale).tickFormat(d3.format('d'));
    this.chart.append('g')
      .attr('class', 'axis year-axis')
      .attr('transform', `translate(0, ${this.height + 2})`)
      .call(this.yearAxis);
  }

  initXAxis() {
    this.xScale.domain(this.filteredData.map((d) => d.name)).padding(0.1);
    this.xAxis.call(
      d3.axisBottom(this.xScale)
        .tickValues(this.filteredData.map((d, i) => (i === 0 || d.name !== this.filteredData[i - 1].name) ? d.name : null))
        .tickPadding(10)
        .tickSize(5)
        .tickSizeOuter(5)
        .tickFormat((d) => d),
    ).selectAll('text')
      .attr('transform', 'rotate(-45) translate(-8, -5)')
      .style('text-anchor', 'end');
  }

  updateYAxis() {
    this.yAxis.transition().duration(500).call(d3.axisLeft(this.yScale));
  }

  activate() {
    this.chart.classed('deactivated', false);
  }

  deactivate() {
    this.chart.classed('deactivated', true);
  }

  // Other methods and placeholders for additional functionalities...

  // Example usage of these methods within update():
  // update() {
  //   this.filterData();
  //   // Other update logic...
  //   this.initYearAxis();
  //   this.initXAxis();
  //   this.updateYAxis();
  //   // Additional update logic...
  // }
}

class DripBarChart3 {
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
        const { year, data } = item;
        const filteredPresidents = data.map((president) => {
          const filteredCounts = president.counts.filter(
            (count) => count.theme.toLowerCase() === this.selectedTheme.toLowerCase()
          );
          return { name: president.name, counts: filteredCounts };
        }).filter((president) => president.counts.length > 0);

        return { year, data: filteredPresidents };
      }).filter((item) => item.data.length > 0);
    } else {
      // If selectedTheme is null, show all data
      this.filteredData = this.data.map((item) => {
        const { year, data } = item;
        const allPresidents = data.map((president) => {
          const allCounts = president.counts;
          return { name: president.name, counts: allCounts };
        });
        return { year, data: allPresidents };
      });
    }
  }


  update() {
    const vis = this;

    // Filter data
    this.filterData();

    // Process the data to generate the stacked bar chart
    const keys = Array.from(new Set(this.filteredData.flatMap((d) =>
      d.data.flatMap((president) =>
        president.counts.map((item) => item.theme)
      )
    )));

    const stackedData = this.filteredData.flatMap((d) =>
      d.data.flatMap((president) =>
        president.counts.map((item) => ({
          year: d.year,
          name: president.name,
          theme: item.theme,
          count: item.count
        }))
      )
    );

    // Update scale domains
    this.xScale.domain(this.filteredData.map((d) => d.year)).padding(0.1);

    const maxBarValue = d3.max(stackedData, (d) => d.count);
    this.yScale.domain([0, maxBarValue]);

    // Update the bars
    const bars = this.chart.selectAll('.bar')
      .data(keys);

    bars.exit().remove();

    const newBars = bars.enter().append('g')
      .attr('class', 'bar');

    const allBars = newBars.merge(bars)
      .selectAll('g')
      .data((key) =>
        stackedData.filter((d) => d.theme === key)
      );

    allBars.exit().remove();

    allBars.enter()
      .append('g')
      .merge(allBars)
      .selectAll('rect')
      .data((d) => [d])
      .join(
        (enter) =>
          enter.append('rect')
            .attr('x', (d) => this.xScale(d.year))
            .attr('width', this.xScale.bandwidth())
            .attr('y', (d) => (d.count > 0 ? this.yScale(d.count) : this.yScale(0)))
            .attr('height', (d) => (d.count > 0 ? this.height - this.yScale(d.count) : 0))
            .on('mouseover', this.handleMouseOver.bind(this))
            .on('mouseout', this.handleMouseOut.bind(this))
            .attr('class', (d) => `bar-segment ${d.theme}`)
            .call((enter) =>
              enter.transition().duration(1200)
                .attr('y', (d) => this.yScale(d.count))
                .attr('height', (d) => this.height - this.yScale(d.count))
            ),
        (update) =>
          update.call((update) =>
            update.transition().duration(1200)
              .attr('y', (d) => this.yScale(d.count))
              .attr('height', (d) => this.height - this.yScale(d.count))
          ),
        (exit) => exit.remove()
      );

    // Call the axes
    this.initYearAxis();
    this.yAxis.transition().duration(500)
      .call(d3.axisLeft(this.yScale));
  }

  handleMouseOver(event, data) {
    const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);
    const { year, name, theme } = data;

    d3.select(event.target)
      .classed('selected', true);

    this.tooltip
      .transition()
      .duration(200)
      .style('opacity', 1)
      .style('left', `${offsetX + 4}px`)
      .style('top', `${offsetY - 36}px`)
      .html(`Year: ${year}, President: ${name}, Theme: ${theme}`);
  }

  handleMouseOut(event) {
    d3.select(event.target)
      .classed('selected', false);

    this.tooltip
      .transition()
      .duration(500)
      .style('opacity', 0);
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
  }

  deactivate() {
    // Method allows Display class to hide this chart
    this.chart.classed('deactivated', true);
  }
}


class DripBarChart4 {
  constructor(svgContainer, data) {
    this.svg = svgContainer;
    this.data = data;
    this.selectedTheme = null;

    this.init();
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
    // this.xScale = d3.scaleBand()
    //   .range([0, this.width])
    //   .padding(0.1);

    this.xScale = d3.scaleLinear()
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
      this.filteredData = this.data.map((item) => ({
        year: item.year,
        counts: item.counts.filter((count) =>
          count.theme.toLowerCase() === this.selectedTheme.toLowerCase()
        )
      })).filter((item) => item.counts.length > 0);
    } else {
      this.filteredData = this.data;
    }
  }

  update() {
    const vis = this;

    // Filter data
    this.filterData();

    // Generate stacked bars for each year
    const yearGroups = this.svg.selectAll('.year-group')
      .data(this.filteredData, (d) => d.year);

    yearGroups.exit().remove();

    const newYearGroups = yearGroups.enter().append('g')
      .attr('class', 'year-group');

    const allBars = newYearGroups.merge(yearGroups)
      .selectAll('rect')
      .data((d) => d.counts);

    allBars.exit().remove();

    allBars.enter()
      .append('rect')
      .merge(allBars)
      .attr('x', (d) => this.xScale(d.year))
      .attr('y', (d) => this.yScale(d.y1))
      .attr('height', (d) => this.yScale(d.y0) - this.yScale(d.y1))
      .attr('width', this.xScale.bandwidth())
      .attr('class', (d) => `bar-segment ${d.theme}`)
      .on('mouseover', function (event, d) {
        vis.handleMouseOver(event, d);
      })
      .on('mouseout', function (event) {
        vis.handleMouseOut(event);
      });

    // ... (axis rendering, tooltip methods remain unchanged)
  }

  handleMouseOver(event, data) {
    // Display tooltip based on data
    // Use data.theme and data.count for tooltip content
  }

  handleMouseOut(event) {
    // Hide tooltip
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