//**heatmap**
const width = 800;
const height = 600;
const margin = { top: 70, right: 70, bottom: 200, left: 170 };


const svg = d3.select('#speech_heatmap')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);


d3.csv('data/cleaned_data/csv_format_d3/speech_similarity_scores.csv').then(data => {
    const years = data.columns.slice(1);
    const matrixData = data.map(d => years.map(year => +d[year]));

    //Color scale
    const colorScale = d3.scaleSequential(d3.interpolateGnBu)
        .domain([d3.min(matrixData, row => d3.min(row)), d3.max(matrixData, row => d3.max(row))]);

    // Heatmap
    const rows = svg.selectAll('g')
        .data(matrixData)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0, ${i * (height / matrixData.length)})`);

    rows.selectAll('rect')
        .data((d, i) => d.map((value, j) => ({ value, year: years[j], index: i })))
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (width / years.length))
        .attr('width', width / years.length)
        .attr('height', height / matrixData.length)
        .style('fill', d => colorScale(d.value))
        .on('mouseover', function (event, d) {
            const x = event.pageX;
            const y = event.pageY;


            const adjustedX = x + 1;
            const adjustedY = y - 5;

            // Show tooltip on mouseover
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`${d.year} vs ${data[d.index].year}<br>Score: ${d.value}`)
                .style('left', `${adjustedX}px`)
                .style('top', `${adjustedY}px`);
        })



    // Add X axis
    const xAxisScale = d3.scaleBand().domain(years).range([0, width]);
    const xAxis = d3.axisBottom(xAxisScale);

    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // Add Y axis
    const yAxisScale = d3.scaleBand().domain(data.map(d => d.year)).range([0, height]);
    const yAxis = d3.axisLeft(yAxisScale);

    svg.append('g')
        .call(yAxis);

    // Add X axis label
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${width / 2}, ${height + margin.top / 2})`);


    // Add Y axis label
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${-margin.left / 2}, ${height / 2})rotate(-90)`)
        //.text('Speech');

    const tooltip = d3.select('#speech_heatmap').append('div')
        .attr('class', 'tooltip_heatmap')
        .style('opacity', 0);

    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 10}, 0)`); // Adjust the position based on your layout

//legend
    const legendRects = legend.selectAll('rect')
        .data(colorScale.ticks(5))
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20)
        .attr('width', 20)
        .attr('height', 20)
        .style('fill', d => colorScale(d));


    const legendLabels = legend.selectAll('text')
        .data(colorScale.ticks(5))
        .enter()
        .append('text')
        .attr('x', 30)
        .attr('y', (d, i) => i * 20 + 12)
        .text(d3.format(".6f"));// Format the score as needed




});