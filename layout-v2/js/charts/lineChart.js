
class LineChart {
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
        vis.svgBoundingBox = this.svg.node().getBoundingClientRect();

        // Determine available width and height based on parent SVG
        const containerWidth = vis.svgBoundingBox.width;
        const containerHeight = vis.svgBoundingBox.height;

        // Make sure chart height isn't more than window height because the chart div doesn't scroll
        const localHeight = Math.min(containerHeight, globalWindowHeight);

        // Declare local chart margins
        vis.margin = {
            top: 10, right: 200, bottom: 60, left: 120,
        };

        // Declare dimensions for local chart
        vis.width = containerWidth - vis.margin.left - vis.margin.right;
        vis.height = localHeight - vis.margin.top - vis.margin.bottom;

        // Create a chart group that will hold the actual chart
        // (The parent SVG will hold multiple chart groups and display them as needed)
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`)
            .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

        // Set up scales
        vis.xScale = d3.scaleLinear().domain([d3.min(vis.data, d => d.year), d3.max(vis.data, d => d.year)]).range([0, vis.width]);
        vis.yScale = d3.scaleLinear().domain([0, 100]).range([vis.height, 0]);

        vis.wrangleData();

    }

    wrangleData() {
        const vis = this;

        vis.displayData = vis.data.sort((a, b) => a.year - b.year)

        vis.update();

    }

    update() {
        const vis = this;

        // Create line function for each topic
        const lineGenerators = {};
        const topics = ["Border", "Climate & Environment", "Economy", "Gun", "Immigration", "Law & Crime", "War & Military"];

        // Get theme colors from main and convert to array
        vis.themeColors = Object.values(themeColors);

        vis.colorScale = d3.scaleOrdinal()
            .domain(topics)
            .range(vis.themeColors);

        topics.forEach(topic => {
            lineGenerators[topic] = d3
                .line()
                .x(d => vis.xScale(d.year))
                .y(d => vis.yScale(d[topic]))
                .curve(d3.curveBundle.beta(0.3));
        });

// Draw lines
        topics.forEach(topic => {
            this.chart
                .append("path")
                .datum(vis.displayData)
                .attr("fill", "none")
                .attr("stroke", vis.colorScale(topic))
                .attr("stroke-width", 2)
                .attr("d", lineGenerators[topic]);
        });

// Add axes
        const xAxis = d3.axisBottom(vis.xScale);
        const yAxis = d3.axisLeft(vis.yScale);

        this.chart
            .append("g")
            .attr("transform", `translate(0, ${vis.height})`)
            .call(xAxis);

        this.chart
            .append("g")
            .call(yAxis);

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

