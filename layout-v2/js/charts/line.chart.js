class LineChart {
    constructor(svgContainer, data) {
        // Container assignment
        this.svg = svgContainer;
        this.data = data;

        // Render the chart
        this.init();
    }

    init() {
        document.addEventListener('lineChange', () => {
            if (globalLineSelection) {
                // Make sure chart resets after the previous stacked bar vis
                if (globalSectionIndex === 7) {
                    this.selectedTheme = null;
                } else {
                    this.selectedTheme = globalLineSelection.toLowerCase();
                }
            } else {
                this.selectedTheme = null;
            }
            // console.log('dripBar detected event theme change', this.selectedTheme);
            this.updateTheme();
        });

        // console.log(globalThemeSelection)

        const vis = this;
        // Get the bounding box of the SVG element
        vis.svgBoundingBox = this.svg.node().getBoundingClientRect();

        // Determine available width and height based on parent SVG
        const containerWidth = vis.svgBoundingBox.width;
        const containerHeight = vis.svgBoundingBox.height;

        // Make sure chart height isn't more than window height because the chart div doesn't scroll
        const localHeight = Math.min(containerHeight, globalWindowHeight);

        // Declare local chart margins
        vis.margin = {
            top: 10, right: 200, bottom: 40, left: 130,
        };

        // Declare dimensions for local chart
        vis.width = containerWidth - vis.margin.left - vis.margin.right;
        vis.height = localHeight - vis.margin.top - vis.margin.bottom;

        // Create a chart group that will hold the actual chart
        // (The parent SVG will hold multiple chart groups and display them as needed)
        vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`)
          .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

        // Add x-axis title
        /*
        vis.chart.append('text')
            .attr('class', 'axis axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', vis.width / 2)
            .attr('y', vis.height + 40)
            .text('Year');
            */

        // Add y-axis title
        vis.chart.append('text')
          .attr('class', 'axis axis-label')
          .attr('text-anchor', 'middle')
          .attr('transform', 'rotate(-90)')
          .attr('x', -vis.height / 2)
          .attr('y', -40)
          .text('Proportion (%)');

        vis.data.forEach((d) => {
            d.year = parseInt(d.year); // Convert to integer
        });

        // Set up scales
        vis.xScale = d3.scaleLinear().domain([d3.min(vis.data, (d) => d.year), d3.max(vis.data, (d) => d.year)]).range([0, vis.width]);
        vis.yScale = d3.scaleLinear().domain([0, 100]).range([vis.height, 0]);

        // Add axes
        const xAxis = d3.axisBottom(vis.xScale).tickFormat(d3.format('d'));
        const yAxis = d3.axisLeft(vis.yScale);

        this.chart
          .append('g')
          .attr('transform', `translate(0, ${vis.height})`)
          .call(xAxis);

        this.chart
          .append('g')
          .call(yAxis)
          .selectAll('.tick text')
          .text((d) => `${d}%`);

        // Create tooltip skeleton
        this.tooltip = d3.select('#vis-container').append('div')
          .attr('class', 'heatmap-tooltip')
          .style('opacity', 0);

        // Add clip path to prevent line overflow
        vis.chart.append('defs').append('clipPath')
          .attr('id', 'clip')
          .append('rect')
          .attr('width', vis.width)
          .attr('height', vis.height);

        // Create x-scale for brush
        vis.xBrushScale = d3.scaleLinear()
          .domain(vis.xScale.domain())
          .range([0, vis.width]);

        // Create brush
        vis.brush = d3.brushX()
          .extent([[0, 0], [vis.width, vis.height]])
          .on('brush', brushed);

        // Append brush group
        vis.brushGroup = vis.chart.append('g')
          .attr('class', 'brush')
          .call(vis.brush);

        // Initialize brush position
        vis.brushGroup
          .call(vis.brush.move, [vis.xScale(d3.max(vis.data, (d) => d.year - 100)), vis.xScale(d3.max(vis.data, (d) => d.year))]);

        function brushed(event) {
            if (!event.sourceEvent) return; // Ignore brush-by-zoom
            if (!event.selection) {
                // Handle case when the user clicks outside the brush and clears the selection
                // Add your logic here if needed
                return;
            }

            try {
                const selectedRange = event.selection || vis.xBrushScale.range();
                const selectedYears = selectedRange.map(vis.xBrushScale.invert);

                // const filteredData = vis.data.filter(d => d.year >= selectedYears[0] && d.year <= selectedYears[1]);
                globalBrushYears = selectedYears;
                triggerBrushChange();

                // stackedBarChart.updateBrushYears(globalBrushYears);
            } catch (error) {
                console.error('Error in brushed function:', error);
            }
        }

        vis.wrangleData();
    }

    wrangleData() {
        const vis = this;

        vis.displayData = vis.data.sort((a, b) => a.year - b.year);

        console.log(vis.data);

        vis.update();
    }

    update() {
        const vis = this;

        // Create line function for each topic
        const lineGenerators = {};
        const topics = ['Border', 'Climate & Environment', 'Economy', 'Gun', 'Immigration', 'Law & Crime', 'War & Military'];

        // console.log(this.selectedTheme)
        // console.log(globalThemeSelection)

        if (globalLineSelection) {
            vis.topicsFiltered = topics.filter((key) => key === globalLineSelection);
        } else {
            vis.topicsFiltered = topics;
        }

        // Get theme colors from main and convert to array
        vis.themeColors = Object.values(themeColors);

        vis.colorScale = d3.scaleOrdinal()
          .domain(topics)
          .range(vis.themeColors);

        vis.topicsFiltered.forEach((topic) => {
            lineGenerators[topic] = d3
              .line()
              .x((d) => vis.xScale(d.year))
              .y((d) => vis.yScale(d[topic]))
              .curve(d3.curveBundle.beta(0.3));
        });

        // Draw lines
        vis.topicsFiltered.forEach((topic) => {
            const line = this.chart
              .append('path')
              .attr('class', (d) => `allLines ${topic.replace(/[^a-zA-Z0-9]/g, '')}`)
              .datum(vis.displayData)
              .transition()
              .duration(500)
              .attr('fill', 'none')
              .attr('stroke', vis.colorScale(topic))
              .attr('stroke-width', 2)
              .attr('d', lineGenerators[topic]);
        });
    }

    updateTheme() {
        if (globalLineSelection) {
            d3.selectAll('.allLines')
              .transition()
              .duration(200)
              .attr('opacity', 0);

            d3.selectAll(`.${globalLineSelection.replace(/[^a-zA-Z0-9]/g, '')}`)
              .transition()
              .duration(800)
              .attr('opacity', 1);
        } else {
            d3.selectAll('.allLines')
              .transition()
              .duration(800)
              .attr('opacity', 1);
        }
    }

    activate() {
        // Method allows Display class to show this chart
        this.chart.classed('deactivated', false);
        this.chart.selectAll('*')
          .classed('disappear', false)
          .classed('hidden', false)
        // this.chart.classed('activated', true);
    }

    deactivate() {
        // Method allows Display class to hide this chart
        // this.chart.classed('activated', false);
        this.chart.classed('deactivated', true);
        this.chart.selectAll('*')
          .classed('shown', false)
          .classed('hidden', true)
          .classed('disappear', true);
    }
}
