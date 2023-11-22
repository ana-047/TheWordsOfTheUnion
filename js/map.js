
function initializeMapAndScatter() {

   // console.log('initializeMapAndScatter function is called');

    let countries;
    let scatterData;
    let scatterSvg;
    let scatterContainer;

    const mapWidth = 900;
    const mapHeight = 600;

    const scatterWidth = 400;
    const scatterHeight = 300;

    const initialProjection = d3.geoOrthographic().scale(300).translate([mapWidth / 2, mapHeight / 2]);
    const equirectangularProjection = d3.geoEquirectangular().scale(140).translate([mapWidth / 2, mapHeight / 1.4]);

    // container div
    const containerDiv = d3.select('#country_mentions_map');

    let svg = containerDiv.select('.map-container').append('svg').attr('width', mapWidth).attr('height', mapHeight);
    let g = svg.append('g');
    let path = d3.geoPath().projection(initialProjection);

    // Create a zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

    // Add a hidden tooltip element
    // containerDiv.append('div')
    //     .attr('id', 'tooltip')
    //     .style('position', 'absolute');

    // Add a button to toggle between projections
    containerDiv.select('#exploreButton')
        .on('click', toggleProjection);

    // Add a reset button
    containerDiv.select('#resetButton')
        .on('click', resetProjection);

    // Add a container for the scatter plot -initially hide the scatter plot container

    scatterContainer = containerDiv.append('div')
        .attr('class', 'scatter-container')
        .style('position', 'absolute')
        .style('background-color', '#f0f0f0')
        .style('border', '1px solid #ccc')
        .style('padding', '10px')
        .style('z-index', 999)
        .style('display', 'none');

// Add a container for the scatter plot SVG
    const scatterBox = scatterContainer.append('div')
        .attr('class', 'scatter-box');

    // Load the world map data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(
        mapData => {

            countries = topojson.feature(mapData, mapData.objects.countries).features;

            // Append path elements to the group
            g.selectAll('.country')
                .data(countries)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .on('click', function (event, d) {
                    const clickedCountryName = getCountryName(d);

                    if (clickedCountryName) {
                        updateScatterPlot(clickedCountryName);
                    }
                })
                .on('mouseover', function (d) {
                    const tooltip = d3.select('#tooltip');
                    tooltip.html(getCountryName(d))
                        .style('visibility', 'visible');

                    if (path.projection() === equirectangularProjection) {
                        // Display scatter plot next to the mouse coordinates
                        const [x, y] = d3.pointer(event);

                        scatterContainer.style('left', (x + 10) + 'px')
                            .style('top', (y + 10) + 'px');

                        // Update scatter plot data and dimensions based on the hovered country
                        const hoveredCountryName = getCountryName(d);
                        updateScatterPlot(hoveredCountryName);
                    }
                })
                .on('mouseout', function () {
                    const tooltip = d3.select('#tooltip');
                    tooltip.style('visibility', 'hidden');

                    // Hide scatter plot when mouse leaves the country
                    scatterContainer.style('display', 'none');
                });

            // Apply the zoom behavior to the SVG
            svg.call(zoom);

            // Start the rotation animation
            rotateGlobe();
        }
    );

    function getCountryName(d) {
        if (d && d.properties && d.properties.name) {
            return d.properties.name;
        } else {
            return null;
        }
    }

    function updateScatterPlot(selectedCountryName) {

        console.log('updateScatterPlot function is called with country:', selectedCountryName);

        d3.csv('data/cleaned_data/csv_format_d3/countries_long.csv').then(data => {
            scatterData = data;
            const filteredData = scatterData.filter(d => d.Country === selectedCountryName);

            // Check if there is data for the selected country
            if (filteredData.length === 0) {
                // Hide scatter plot if there is no data
                scatterContainer.style('display', 'none');
                return;
            }

            // Clear existing scatter plot contents
            scatterSvg = scatterContainer.select('svg');
            if (!scatterSvg.node()) {
                scatterSvg = scatterContainer.append('svg')
                    .attr('width', scatterWidth)
                    .attr('height', scatterHeight)
                    .attr('class', 'scatter');
            } else {
                scatterSvg.selectAll('*').remove();
            }

            // Create scatter plot
            const margin = { top: 20, right: 20, bottom: 40, left: 40 };

            const xScale = d3.scaleLinear()
                .domain([d3.min(filteredData, d => +d.Year), d3.max(filteredData, d => +d.Year)])
                .range([margin.left, scatterWidth - margin.right]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => +d.Mentions)])
                .range([scatterHeight - margin.bottom, margin.top]);

            const xAxis = d3.axisBottom(xScale)
                .tickFormat(d3.format('d'));

            const yAxis = d3.axisLeft(yScale);

            const scatterLeft = (mapWidth * 0.35) + 'px'; // Adjust the percentage as needed
            const scatterTop = '10px'; // Adjust the top position as needed

            scatterContainer.style('left', scatterLeft)
                .style('top', scatterTop);

            scatterSvg.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0, ${scatterHeight - margin.bottom})`)
                .call(xAxis);

            scatterSvg.append('g')
                .attr('class', 'y-axis')
                .attr('transform', `translate(${margin.left}, 0)`)
                .call(yAxis);

            scatterSvg.append('text')
                .attr('x', scatterWidth / 2)
                .attr('y', margin.top)
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('font-weight', 'bold')
                .text(selectedCountryName);

            scatterSvg.append('text')
                .attr('x', scatterWidth / 2)
                .attr('y', scatterHeight - 5)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .text('Year');

            scatterSvg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('x', -scatterHeight / 2)
                .attr('y', 10)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .text('Mentions');

            scatterSvg.selectAll('circle')
                .data(filteredData)
                .enter()
                .filter(d => +d.Mentions > 0)
                .append('circle')
                .attr('cx', d => xScale(+d.Year))
                .attr('cy', d => yScale(+d.Mentions))
                .attr('r', 3)
                .attr('fill', d => {
                    if (d.Party === 'Republican') {
                        return 'red';
                    } else if (d.Party === 'Democratic') {
                        return 'blue';
                    } else {
                        return 'grey';
                    }
                });

            // Display the scatter plot container
            scatterContainer.style('display', 'block');
        });
    }

    function updateScatterDimensions() {
        // Adjust the positioning of the scatter plot container
        scatterContainer.style('left', (mapWidth + 10) + 'px')
            .style('top', '10px');
    }

    function resetProjection() {
        // Switch back to the orthographic projection
        path = d3.geoPath().projection(initialProjection);

        // Update paths with the new projection
        g.selectAll('.country')
            .transition()
            .duration(1000)
            .attr('d', path);

        // Hide the scatter plot container
        scatterContainer.style('display', 'none');

        // Stop the rotation animation
        d3.timerFlush();
    }

    function showAxis() {

        scatterSvg.selectAll('.x-axis, .y-axis').style('display', 'block');
    }


    function hideAxis() {

        scatterSvg.selectAll('.x-axis, .y-axis').style('display', 'none');
    }

    function toggleProjection() {
        // Toggle the projection between orthographic and equirectangular
        path = (path.projection() === initialProjection) ? d3.geoPath().projection(equirectangularProjection) : d3.geoPath().projection(initialProjection);

        // Update paths with the new projection
        g.selectAll('.country')
            .transition()
            .duration(1000)
            .attr('d', path);

        if (path.projection() === equirectangularProjection) {
            const selectedCountry = d3.select('.country.active').data()[0];
            if (selectedCountry) {
                const selectedCountryName = getCountryName(selectedCountry);
                const filteredData = scatterData.filter(d => d.Country === selectedCountryName);

                if (filteredData.length > 0) {
                    if (!scatterSvg) {
                        // Append scatter plot SVG to the scatterContainer
                        scatterSvg = scatterContainer.append('svg')
                            .attr('width', scatterWidth)
                            .attr('height', scatterHeight)
                            .attr('class', 'scatter');
                    }

                    scatterContainer.style('display', 'block'); // Show the scatter plot container
                    scatterSvg.call(zoom); // Apply zoom only when using equirectangular projection
                    showAxis(); // Call a function to show the axis

                    updateScatterDimensions(); // Adjust the dimensions and position of the scatter plot container
                } else {
                    // Hide the scatter plot container if no data is available
                    scatterContainer.style('display', 'none');
                }
            } else {
                // Hide the scatter plot container if no country is selected
                scatterContainer.style('display', 'none');
            }
        } else {
            scatterContainer.style('display', 'none');
            scatterSvg.on('.zoom', null);
            hideAxis();
        }
    }


    function rotateGlobe() {
        d3.timer(function (elapsed) {
            initialProjection.rotate([elapsed / 100, 0]);

            g.selectAll('path')
                .attr('d', path);

            return false;
        });
    }

    function zoomed(event) {
        const transform = event.transform;

        if (path.projection() === equirectangularProjection) {
            const newProjection = d3.geoEquirectangular()
                .scale(140 * transform.k)
                .translate([mapWidth / 2 + transform.x, mapHeight / 1.4 + transform.y]);

            path = d3.geoPath().projection(newProjection);


            g.selectAll('.country')
                .transition()
                .duration(50)
                .attr('d', path);
        }
    }

    document.addEventListener('DOMContentLoaded', initializeMapAndScatter);
}


document.addEventListener('DOMContentLoaded', initializeMapAndScatter);
