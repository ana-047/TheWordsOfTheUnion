
function initializeMapAndScatter() {
    let selectedCountry;
    let countries;
    let scatterData; // Add this line to declare scatterData variable

    const mapWidth = 900;
    const mapHeight = 600;

    // Declare separate dimensions for scatter plot
    const scatterWidth = 400;
    const scatterHeight = 300;

    // Declare scatterSvg variable
    let scatterSvg;

    const initialProjection = d3.geoOrthographic().scale(300).translate([mapWidth / 2, mapHeight / 2]);
    const equirectangularProjection = d3.geoEquirectangular().scale(140).translate([mapWidth / 2, mapHeight / 1.4]);

    // Select the container div
    const containerDiv = d3.select('#country_mentions_map');

    // Append SVG to the map-container div
    let svg = containerDiv.select('.map-container').append('svg').attr('width', mapWidth).attr('height', mapHeight);
    let g = svg.append('g');
    let path = d3.geoPath().projection(initialProjection);

    // Create a zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Set the scale extent (minimum and maximum zoom levels)
        .on('zoom', zoomed);

    // Function to get the country name from a feature
    function getCountryName(d) {
        if (d && d.properties && d.properties.name) {
            return d.properties.name;
        } else {
            return null;
        }
    }

    // Add a hidden tooltip element
    containerDiv.append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute');

    // Add a button to toggle between projections
    containerDiv.select('#exploreButton')
        .on('click', toggleProjection);


// Add a reset button
    containerDiv.select('#resetButton')
        .on('click', resetProjection);

    // Load the world map data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(
        mapData => {
            console.log('Map Data:', mapData);

            // Extract the features from the data
            const countries = topojson.feature(mapData, mapData.objects.countries).features;

            // Assign the features to the global variable
            window.countries = countries;

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
                        console.log('Clicked Country Name:', clickedCountryName);

                        // Check if the clicked country is in the scatter plot data
                        const isCountryInScatterData = scatterData && scatterData.some(entry => entry.Country === clickedCountryName);

                        if (isCountryInScatterData) {
                            console.log('Country is in scatter data. Updating scatter plot...');
                            updateScatterPlot(clickedCountryName);
                        } else {
                            console.log('Country is not in scatter data.');
                        }
                    } else {
                        console.error('Invalid country data:', d);
                    }
                })
                .on('mouseover', function (d) {
                    // Display country name in tooltip on mouseover
                    const tooltip = d3.select('#tooltip');
                    tooltip.html(getCountryName(d))
                        .style('visibility', 'visible');
                })
                .on('mouseout', function () {
                    // Hide tooltip on mouseout
                    const tooltip = d3.select('#tooltip');
                    tooltip.style('visibility', 'hidden');
                });

            // Apply the zoom behavior to the SVG
            svg.call(zoom);

            // Start the rotation animation
            rotateGlobe();
        }
    );

    function showAxis() {
        // Show the axes only if the user has clicked on a country
        if (userClickedCountry) {

            scatterSvg.selectAll('.x-axis, .y-axis').style('display', 'block');
        }
    }

    function hideAxis() {
        // Hide the axes when switching back to orthographic projection
        scatterSvg.selectAll('.x-axis, .y-axis').style('display', 'none');
    }

    // Function to toggle between orthographic and equirectangular projections
    function toggleProjection() {
        path = (path.projection() === initialProjection) ? d3.geoPath().projection(equirectangularProjection) : d3.geoPath().projection(initialProjection);

        // Update paths with the new projection
        g.selectAll('.country')
            .transition()
            .duration(1000)
            .attr('d', path);

        if (path.projection() === equirectangularProjection) {
            if (!scatterSvg) {
                scatterSvg = containerDiv.select('.scatter-container')
                    .append('svg')
                    .attr('width', scatterWidth)
                    .attr('height', scatterHeight)
                    .attr('class', 'scatter')
                    .style('display', 'none'); // Initially hide the scatter plot
            }

            scatterSvg.style('display', 'block'); // Show the scatter plot
            scatterSvg.call(zoom); // Apply zoom only when using equirectangular projection
            showAxis(); // Call a function to show the axis
        } else {
            scatterSvg.style('display', 'none'); // Hide the scatter plot
            scatterSvg.on('.zoom', null); // Remove zoom behavior when not using equirectangular projection
            hideAxis(); // Call a function to hide the axis
        }
    }

    // Add a boolean variable to track whether the user has clicked on a country
    let userClickedCountry = false;

    function resetProjection() {
        // Switch back to the orthographic projection
        path = d3.geoPath().projection(initialProjection);

        // Update paths with the new projection
        g.selectAll('.country')
            .transition()
            .duration(1000)
            .attr('d', path);

        // Hide the scatter plot
        if (scatterSvg) {
            scatterSvg.style('display', 'none');
        }

        // Stop the rotation animation
        d3.timerFlush();
    }

    function rotateGlobe() {
        d3.timer(function (elapsed) {
            // Rotate the globe (adjust the rotation speed as needed)
            initialProjection.rotate([elapsed / 100, 0]);

            // Update paths with the new rotation
            g.selectAll('path')
                .attr('d', path);

            // Return false to continue the animation
            return false;
        });
    }

    function zoomed(event) {
        // Get the current zoom transform
        const transform = event.transform;

        // Update the projection based on the zoom transform
        const newProjection = d3.geoEquirectangular()
            .scale(140 * transform.k) // Scale based on the zoom level
            .translate([mapWidth / 2 + transform.x, mapHeight / 1.4 + transform.y]); // Update the translation based on the zoom transform

        // Update the path generator with the new projection
        path = d3.geoPath().projection(newProjection);

        // Update the paths with the new projection
        g.selectAll('.country').attr('d', path);
    }

    // Function to update scatter plot dimensions during zoom
    function updateScatterDimensions() {
        // Calculate the translate values based on the width of the map and scatter plot
        const mapTranslate = mapWidth / 2;
        const scatterTranslate = mapWidth + (mapWidth - scatterWidth) / 2;

        // Update the translate attribute for the scatter plot SVG
        scatterSvg.attr('transform', `translate(${scatterTranslate}, -300)`);
    }

    function updateScatterPlot(selectedCountryName) {
        userClickedCountry = true;
        // Load CSV data for the selected country
        d3.csv('data/cleaned_data/csv_format_d3/countries_long.csv').then(data => {
            scatterData = data;

            // Define filteredData here before using it
            const filteredData = scatterData.filter(d => d.Country === selectedCountryName);

            // Clear existing scatter plot contents
            if (!scatterSvg) {
                scatterSvg = containerDiv.select('.scatter-container')
                    .append('svg')
                    .attr('width', scatterWidth)
                    .attr('height', scatterHeight)
                    .attr('class', 'scatter')
                    .style('display', 'none'); // Initially hide the scatter plot
            } else {
                // Clear existing scatter plot contents
                scatterSvg.selectAll('*').remove();
            }

            // Update scatter plot dimensions during zoom
            updateScatterDimensions();

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
                .attr('y', margin.top )
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
                    // Log the "Party" values to the console for debugging
                    console.log('Party:', d.Party);

                    // Use a conditional statement to set the fill color based on the "Party" column
                    if (d.Party === 'Republican') {
                        return 'red';
                    } else if (d.Party === 'Democratic') {
                        return 'blue';
                    } else {
                        return 'grey';
                    }
                });
        });
    }

    // Initial load of scatter plot
    updateScatterPlot();
}

// Call the function when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeMapAndScatter);
