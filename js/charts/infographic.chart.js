class InfographicChart {
    constructor(svgContainer, data) {
        // Container assignment
        this.svg = svgContainer;
        this.data = data;

        // Render the chart
        this.init();
    }

    init(){
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
            top: 5, right: 5, bottom: 5, left: 5,
        };

        // Declare dimensions for local chart
        this.width = containerWidth - this.margin.left - this.margin.right;
        this.height = localHeight - this.margin.top - this.margin.bottom;

        // Create a chart group that will hold the actual chart
        // (The parent SVG will hold multiple chart groups and display them as needed)
        this.chart = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
            .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

        const textData = [
            { title: "Leadership", text: "The annual State of the Union address is a testament to the multifaceted nature of leadership and the resilience of a nation navigating through its unique history." },
            { title: "National Priorities", text: "In essence, this tradition is about addressing the collective concerns and aspirations of the American people. It transcends political divisions, emphasizing the national priorities that unite us." },
            { title: "Resonance", text: "The resonance of past themes in contemporary addresses serves as a stark reminder that the challenges and aspirations faced by the nation are not isolated incidents but part of an enduring narrative." }
        ];

        const rowGap = 30;
        const rectWidth= (this.width/3) - (rowGap*2);

        const myInfo = vis.chart.append("image")
            .attr("x", d => 0)
            .attr("y", d => 0)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("xlink:href", "images/infographic.svg");

        /*
        myInfo
            .enter()
            .append('rect')
            .attr('class', 'infographic-box')
            .attr('y', this.height/4)
            .attr('x', (d, i) => (i * (rectWidth + rowGap)))
            .attr('width', rectWidth)
            .attr('height', this.height/2)
            .attr("fill", "#83A2FF")

        myInfo
            .enter()
            .append('div')
            .attr('class', 'infographic-box')
            .attr('y', this.height/3)
            .attr('x', (d, i) => (i * (rectWidth + rowGap) +30))
            .attr("fill", "white")
            .html(d => `<p class="infographic-text">${d.title}</p>`);


        myInfo
            .enter()
            .append('div')
            .attr('class', 'infographic-box')
            .attr('y', this.height/2.5)
            .attr('x', (d, i) => (i * (rectWidth + rowGap) +30))
            .attr("fill", "white")
            .html(d => `<p class="infographic-text">${d.text}</p>`);
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