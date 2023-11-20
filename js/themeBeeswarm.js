class ThemeBeeswarm {
  constructor(containerId, data) {
    this.data = [data];
    this.groupedData = {};
    this.focusedData = [];
    this.beeswarmContainerId = containerId;

    this.dotRadius = 3;
    this.dotSpacing = 3;

    this.init();
  }

  init() {
    const vis = this;
    console.log(vis.constructor.name, 'initializing');

    // vis.processData();
    vis.processArrayData();
    vis.initBeeswarm();
    vis.buildBeeswarm();
    // vis.buildPointChart();
  }

  processData() {
    const vis = this;
    console.log(vis.constructor.name, 'processing data');

    // Extract data for beeswarm chart
    vis.groupedData = {};

    vis.data.forEach(item => {
      const filteredTags = Object.values(item.tagged_text)
        .filter(tag => tag.t === 'war' || tag.t === 'economy')
        .map(({ w, t, s }) => ({ w, t, s }));

      if (filteredTags.length > 0) {
        vis.groupedData[item.year] = {
          year: item.year,
          name: item.name,
          party: item.party,
          tags: filteredTags
        };
      }
    });

    console.log('groupedData is ', vis.groupedData);
  }

  processArrayData() {
    const vis = this;
    console.log(vis.constructor.name, 'processing data array');

    vis.groupedData = {};

    vis.data.forEach(dataItem => {
      dataItem.forEach(item => {
        const filteredTags = Object.values(item.tagged_text)
          .filter(tag => tag.t === 'war' || tag.t === 'economy')
          .map(({ w, t, s }) => ({ w, t, s }));

        if (filteredTags.length > 0) {
          if (!vis.groupedData[item.year]) {
            vis.groupedData[item.year] = {
              year: item.year,
              name: item.name,
              party: item.party,
              tags: filteredTags
            };
          } else {
            // If the year already exists, merge the tags
            vis.groupedData[item.year].tags = [
              ...vis.groupedData[item.year].tags,
              ...filteredTags
            ];
          }
        }
      });
    });

    // Optionally, remove duplicate tags for each year
    // Object.values(vis.groupedData).forEach(item => {
    //   item.tags = Array.from(new Set(item.tags.map(tag => JSON.stringify(tag))))
    //     .map(tag => JSON.parse(tag));
    // });

    console.log('groupedData is ', vis.groupedData);
  }

  initBeeswarm() {
    const vis = this;
    console.log(vis.constructor.name, 'initializing beeswarm');

    // Define chart container
    vis.chartContainer = d3.select(`#${vis.beeswarmContainerId}`);

    // Set up dimensions for the beeswarm chart
    vis.margin = { top: 40, right: 20, bottom: 40, left: 30 };
    vis.width = vis.chartContainer.node().offsetWidth - vis.margin.left - vis.margin.right;
    vis.height = vis.chartContainer.node().offsetHeight - vis.margin.top - vis.margin.bottom;

    // Create SVG container for the beeswarm chart
    vis.beeswarmContainer = vis.chartContainer
      .append('svg')
      .attr('width', vis.width + vis.margin.left + vis.margin.right)
      .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
      .append('g')
      .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

    // Extract all unique 't' values from groupedData
    const uniqueTags = new Set();
    Object.values(vis.groupedData).forEach(item => {
      item.tags.forEach(tag => {
        uniqueTags.add(tag.t);
      });
    });

    const tagColors = ['#72A98FFF', '#6F73D2FF'];

    // Create a scale for the 'year' values
    const years = Object.keys(vis.groupedData);
    vis.xScale = d3.scaleBand()
      .domain(years)
      .range([0, vis.width])
      .padding(0.1);

    // Create a scale for the 't' values
    // Since theme colors are app-wide categories,
    // they're handled by assigning the appropriate CSS class
    // IF the CSS isn't set up, use this instead
    vis.colorScale = d3.scaleOrdinal()
      .domain(uniqueTags)
      .range(tagColors);

    // Create a scale for the 's' values
    vis.yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([vis.height, 0]);

    // Create x-axis
    vis.xAxis = d3.axisBottom(vis.xScale);

    // Create y-axis with streamlined tick values
    vis.yAxis = d3.axisLeft(vis.yScale)
      .tickValues([-1, 0, 1]) // Set specific tick values
      .tickFormat(d => (d === 0 ? '0' : d > 0 ? '+1' : '-1')); // Custom label format

  }

  buildBeeswarm() {
    const vis = this;
    console.log(vis.constructor.name, 'building beeswarm');

    // Group the data by year and sort it by 's' value
    const groupedData = Object.values(vis.groupedData);
    groupedData.forEach(item => {
      item.tags.sort((a, b) => a.s - b.s);
    });

    // Create a force simulation
    const simulation = d3.forceSimulation()
      .force('y', d3.forceY(d => vis.yScale(d.s)).strength(1))
      .force('collision', d3.forceCollide(5).strength(0.8));

    // Add x positioning force to avoid overlap
    const xForces = {};
    const xPadding = vis.dotSpacing; // Adjust this padding as needed for x-spacing

    groupedData.forEach(item => {
      // console.log('item is ', item);
      const year = item.year;
      const step = vis.width / (groupedData.length + 1); // Calculate step for each year

      item.tags.forEach((tag, i) => {
        //const x = step * (year - (year - 1)) + xPadding; // Calculate x-position based on year
        const x = step * groupedData.indexOf(item) + xPadding; // Calculate x-position based on year

        if (!xForces[year]) xForces[year] = d3.forceX().x(d => x);
        else xForces[year].x(d => x);

        simulation.force(`x${year}`, xForces[year]);
        simulation.nodes(groupedData.flatMap(item => {
          return item.tags
        }));
      });
    });

    // Append circles for each data point in the grouped data
    vis.beeswarmContainer.selectAll('.theme-dot')
      .data(groupedData.flatMap(item => item.tags))
      .enter()
      .append('circle')
      .attr('class', d => `theme-dot ${d.t}`)
      // .attr('data-year', d => d.year)
      // .attr('data-theme', d => d.t)
      // .attr('data-sentiment', d => d.s)
      // .attr('data-word', d => d.w)
      .attr('r', vis.dotRadius)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .call(d3.drag().subject(() => ({ x: d3.event.x, y: d3.event.y })).on('start', dragstarted).on('drag', dragged).on('end', dragended));

    // Start the simulation
    simulation.on('tick', () => {
      vis.beeswarmContainer.selectAll('.theme-dot')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    function dragstarted() {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    }

    function dragged() {
      d3.event.subject.fx = d3.event.x;
      d3.event.subject.fy = d3.event.y;
    }

    function dragended() {
      if (!d3.event.active) simulation.alphaTarget(0);
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    }

    // Render x-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${vis.height + vis.margin.bottom / 2})`)
      .call(vis.xAxis);

    // Render y-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'y-axis')
      .call(vis.yAxis);

    // Append a center axis line through 0 on the y-axis
    vis.beeswarmContainer.append('line')
      .attr('x1', 0)
      .attr('y1', vis.yScale(0))
      .attr('x2', vis.width)
      .attr('y2', vis.yScale(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5 5') // Add dashed style (optional)
      .attr('class', 'x-axis');



    function handleMouseOver(event, d) {
      const dot = d3.select(this);
      vis.selectedDotData = dot.datum();

      // Create and position the tooltip
      const tooltip = d3.select('#beeswarm-tooltip');
      tooltip
        .style('opacity', 1)
        .html(
          `s: ${vis.selectedDotData.s}, 
          w: ${vis.selectedDotData.w}, 
          t: ${vis.selectedDotData.t}`
        )
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY}px`);
    }

    function handleMouseOut() {
      vis.selectedDotData = {};
      // Hide the tooltip on mouse out
      d3.select('#beeswarm-tooltip').style('opacity', 0);
    }

  }

  buildBeeswarm0() {
    const vis = this;
    console.log(vis.constructor.name, 'building beeswarm');

    // Group the data by year and sort it by 's' value
    const groupedData = Object.values(vis.groupedData);
    groupedData.forEach(item => {
      item.tags.sort((a, b) => a.s - b.s);
    });

    // Create a force simulation
    const simulation = d3.forceSimulation()
      .force('y', d3.forceY(d => vis.yScale(d.s)).strength(1))
      .force('collision', d3.forceCollide(5).strength(0.8));

    // Add x positioning force to avoid overlap
    const xForces = {};
    const xPadding = vis.dotSpacing; // Adjust this padding as needed for x-spacing

    groupedData.forEach(item => {
      const year = item.year;
      const step = vis.width / (groupedData.length + 1); // Calculate step for each year
      //const xForces = {}; // Create xForces object to store x forces for each year
      //console.log('xForces ', xForces);
      item.tags.forEach((tag, i) => {
        const x = step * (groupedData.indexOf(item) + 1) + xPadding; // Calculate x-position based on tag's year
        //console.log('xForces ', xForces);
        if (!xForces[year]) {
          console.log('year ', year);
          console.log('!xForces[year] ', xForces[year]);
          console.log('xForces ', xForces);
          xForces[year] = d3.forceX().x(d => (d.year === year ? x : d.x)); // Apply x-force conditionally based on the tag's year
          simulation.force(`x${year}`, xForces[year]); // Apply the x-force to the simulation
        }
      });
    });

    // Append circles for each data point in the grouped data
    vis.beeswarmContainer.selectAll('.theme-dot')
      .data(groupedData.flatMap(item => item.tags))
      .enter()
      .append('circle')
      .attr('class', d => `theme-dot ${d.t}`)
      // .attr('data-year', d => d.year)
      // .attr('data-theme', d => d.t)
      // .attr('data-sentiment', d => d.s)
      // .attr('data-word', d => d.w)
      .attr('r', vis.dotRadius)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .call(d3.drag()
        .subject(() => ({ x: d3.event.x, y: d3.event.y }))
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended
        ));

    // Start the simulation
    simulation.on('tick', () => {
      vis.beeswarmContainer.selectAll('.theme-dot')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    function dragstarted() {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    }

    function dragged() {
      d3.event.subject.fx = d3.event.x;
      d3.event.subject.fy = d3.event.y;
    }

    function dragended() {
      if (!d3.event.active) simulation.alphaTarget(0);
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    }

    // Render x-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${vis.height + vis.margin.bottom / 2})`)
      .call(vis.xAxis);

    // Render y-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'y-axis')
      .call(vis.yAxis);

    // Append a center axis line through 0 on the y-axis
    vis.beeswarmContainer.append('line')
      .attr('x1', 0)
      .attr('y1', vis.yScale(0))
      .attr('x2', vis.width)
      .attr('y2', vis.yScale(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5 5') // Add dashed style (optional)
      .attr('class', 'x-axis');



    function handleMouseOver(event, d) {
      const dot = d3.select(this);
      vis.selectedDotData = dot.datum();

      // Create and position the tooltip
      const tooltip = d3.select('#beeswarm-tooltip');
      tooltip
        .style('opacity', 1)
        .html(
          `s: ${vis.selectedDotData.s}, 
          w: ${vis.selectedDotData.w}, 
          t: ${vis.selectedDotData.t}`
        )
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY}px`);
    }

    function handleMouseOut() {
      vis.selectedDotData = {};
      // Hide the tooltip on mouse out
      d3.select('#beeswarm-tooltip').style('opacity', 0);
    }

  }


  buildBeeswarm1() {
    const vis = this;
    console.log(vis.constructor.name, 'building beeswarm');

    // Group the data by year and sort it by 's' value
    const groupedData = Object.values(vis.groupedData);
    groupedData.forEach(item => {
      item.tags.sort((a, b) => a.s - b.s);
    });

    // Create a single simulation for all data points
    const simulation = d3.forceSimulation()
      .force('y', d3.forceY(d => vis.yScale(d.s)).strength(1))
      .force('collision', d3.forceCollide(5).strength(0.8));

    // Add x-positioning force to avoid overlap
    const xForces = {}; // Store x forces for each year
    const xPadding = vis.dotSpacing; // Adjust this padding as needed for x-spacing

    // Assign x forces based on the year for each node
    groupedData.forEach(item => {
      const year = item.year;
      const step = vis.width / (groupedData.length + 1); // Calculate step for each year

      item.tags.forEach((tag, i) => {
        const x = step * (year - 2020) + xPadding; // Calculate x-position based on year
        if (!xForces[year]) xForces[year] = d3.forceX().x(d => x).strength(0.1);
        else xForces[year].x(d => x);

        simulation.force(`x${year}${i}`, xForces[year]);
      });
    });

    // Append circles for each data point in the grouped data
    vis.beeswarmContainer.selectAll('.theme-dot')
      .data(groupedData.flatMap(item => item.tags))
      .enter()
      .append('circle')
      .attr('class', d => `theme-dot ${d.t}`)
      .attr('r', vis.dotRadius)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .call(d3.drag()
        .subject(() => ({ x: d3.event.x, y: d3.event.y }))
        .on('start', dragstarted)
        .on('drag', dragged).on('end', dragended)
      );

    // Start the simulation
    simulation.nodes(groupedData.flatMap(item => item.tags))
      .on('tick', () => {
        vis.beeswarmContainer.selectAll('.theme-dot')
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);
      });

    function dragstarted() {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    }

    function dragged() {
      d3.event.subject.fx = d3.event.x;
      d3.event.subject.fy = d3.event.y;
    }

    function dragended() {
      if (!d3.event.active) simulation.alphaTarget(0);
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    }

    // Render x-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${vis.height + vis.margin.bottom / 2})`)
      .call(vis.xAxis);

    // Render y-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'y-axis')
      .call(vis.yAxis);

    // Append a center axis line through 0 on the y-axis
    vis.beeswarmContainer.append('line')
      .attr('x1', 0)
      .attr('y1', vis.yScale(0))
      .attr('x2', vis.width)
      .attr('y2', vis.yScale(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5 5') // Add dashed style (optional)
      .attr('class', 'x-axis');



    function handleMouseOver(event, d) {
      const dot = d3.select(this);
      vis.selectedDotData = dot.datum();

      // Create and position the tooltip
      const tooltip = d3.select('#beeswarm-tooltip');
      tooltip
        .style('opacity', 1)
        .html(
          `s: ${vis.selectedDotData.s}, 
          w: ${vis.selectedDotData.w}, 
          t: ${vis.selectedDotData.t}`
        )
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY}px`);
    }

    function handleMouseOut() {
      vis.selectedDotData = {};
      // Hide the tooltip on mouse out
      d3.select('#beeswarm-tooltip').style('opacity', 0);
    }

  }






  buildPointChart() {
    const vis = this;
    console.log(vis.constructor.name, 'building point chart');

    // Flatten the groupedData to get all tagged elements
    vis.focusedData = Object.values(vis.groupedData).reduce((acc, curr) => {
      acc.push(...curr.tags.map(tag => ({ year: curr.year, t: tag.t, s: tag.s })));
      return acc;
    }, []);

    // Create circles for each data point in focusedData
    vis.beeswarmContainer.selectAll('.theme-dot')
      .data(vis.focusedData)
      .enter()
      .append('circle')
      .attr('class', d => `theme-dot ${d.t}`)
      .attr('cx', d => vis.xScale(d.year) + vis.xScale.bandwidth() / 2)
      .attr('cy', d => vis.yScale(d.s))
      .attr('r', vis.dotRadius); // Adjust radius as needed

    // Render x-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${vis.height})`)
      .call(vis.xAxis);

    // Render y-axis
    vis.beeswarmContainer.append('g')
      .attr('class', 'y-axis')
      .call(vis.yAxis);

  }
}
