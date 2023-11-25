function initializeMapAndScatter() {
    let countries;
    let scatterData;
    let scatterSvg;
    let scatterContainer;
    let selectedCountry = null;

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

    // Add a button to toggle between projections
    containerDiv.select('#exploreButton')
        .on('click', toggleProjection);

    // Add a reset button
    containerDiv.select('#resetButton')
        .on('click', resetProjection);

    // Add a container for the scatter plot
    scatterContainer = containerDiv.append('div')
        .attr('class', 'scatter-container')
        .style('position', 'absolute')
        .style('background-color', '#f0f0f0')
        .style('border', '1px solid #ccc')
        .style('padding', '10px')
        .style('z-index', 999)
        .style('display', 'none');


    scatterSvg = scatterContainer.append('svg')
        .attr('width', scatterWidth)
        .attr('height', scatterHeight)
        .attr('class', 'scatter');

    // Load the world map data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(
        mapData => {
            countries = topojson.feature(mapData, mapData.objects.countries).features;


            g.selectAll('.country')
                .data(countries)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .on('click', function (event, d) {
                    //update if the projection is equirectangular
                    if (path.projection() === equirectangularProjection) {
                        const clickedCountryName = getCountryName(d);
                        selectedCountry = (selectedCountry === clickedCountryName) ? null : clickedCountryName;
                        updateScatterPlot(selectedCountry);
                    }
                })

                .on('mouseout', function () {
                    const tooltip = d3.select('#tooltip');
                    tooltip.style('visibility', 'hidden');
                });

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
            if (!selectedCountryName || filteredData.length === 0) {
                // Hide scatter plot if there is no data or if no country is selected
                scatterContainer.style('display', 'none');
                return;
            }


            scatterSvg.selectAll('*').remove();

            // Add title
            scatterSvg.append('text')
                .attr('class', 'scatter-title')
                .attr('x', scatterWidth / 2)
                .attr('y', 20)
                .style('text-anchor', 'middle')
                .style('font-size', '16px')
                .text(selectedCountryName);

            // Create the scatter plot
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

            const scatterLeft = (mapWidth * 0.35) + 'px';
            const scatterTop = '10px';

            scatterContainer.style('left', scatterLeft)
                .style('top', scatterTop)
                .style('display', 'block');

            scatterSvg.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0, ${scatterHeight - margin.bottom})`)
                .call(xAxis);

            scatterSvg.append('g')
                .attr('class', 'y-axis')
                .attr('transform', `translate(${margin.left}, 0)`)
                .call(yAxis);

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
                })
                .on('mouseover', function (event, d) {
                    // Show tooltip on mouseover
                    scatterSvg.append("text")
                        .attr("class", "scatter-tooltip")
                        .attr("x", xScale(+d.Year))
                        .attr("y", yScale(+d.Mentions) - 10)
                        .text(`Year: ${d.Year}\nPresident: ${d.President}-\n ${d.Party}`);
                })
                .on('mouseout', function () {
                    // Hide tooltip on mouseout
                    scatterSvg.select(".scatter-tooltip").remove();
                });
        });
    }

    function resetProjection() {
      //user clicks on the reset button to switch back to orthographic
        path = d3.geoPath().projection(initialProjection);

        // Update paths with the new projection
        g.selectAll('.country')
            .transition()
            .duration(1000)
            .attr('d', path);

        // Hide the scatter plot container - it only appears when the projection is equirectangular
        scatterContainer.style('display', 'none');

        // Stop the rotation animation
        d3.timerFlush();
    }

    function rotateGlobe() {
        d3.timer(function (elapsed) {
            initialProjection.rotate([elapsed / 100, 0]);

            g.selectAll('path')
                .attr('d', path);

            return false;
        });
    }

    function toggleProjection() {
        // Toggle the projection between orthographic and equirectangular
        path = (path.projection() === initialProjection) ? d3.geoPath().projection(equirectangularProjection) : d3.geoPath().projection(initialProjection);

        // Update paths with the new projection
        g.selectAll('.country')
            .transition()
            .duration(1000)
            .attr('d', path);

        // Check if the current projection is equirectangular
        const isEquirectangular = path.projection() === equirectangularProjection;

        // Show or hide the scatter plot container based on the projection type
        scatterContainer.style('display', isEquirectangular ? 'block' : 'none');

        // If there is a selected country and the projection is equirectangular, update the scatter plot
        if (isEquirectangular && selectedCountry) {
            updateScatterPlot(selectedCountry);
        } else {
            // If the projection is orthographic, hide the scatter plot container
            scatterContainer.style('display', 'none');
        }
    }



    document.addEventListener('DOMContentLoaded', initializeMapAndScatter);
}

document.addEventListener('DOMContentLoaded', initializeMapAndScatter);
