class GlobeChart {
  constructor(svgContainer, data) {
    this.svg = svgContainer;
    this.data = data;

    this.selectedCountry = null;
    this.countries = null;
    this.path = null;

    // Prep for section changes
    this.localSectionIndex = null;

    // Set up button handling
    d3.select('#exploreGlobe').on('click', () => this.toggleProjection());
    d3.select('#resetGlobe').on('click', () => this.resetProjection());

    // Render the chart
    this.init();
  }

  init() {
    // Listen for the sectionChange event and update the chart accordingly to highlight specific countries
    document.addEventListener('sectionChange', () => {
      if ([11, 12, 13].includes(globalSectionIndex)) {
        this.handleCountryClick();
      } else if ([12].includes(globalSectionIndex)) {
        // this.doSomething()
      } else if ([13].includes(globalSectionIndex)) {
        // this.doSomething()
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
      top: 10, right: 10, bottom: 10, left: 10,
    };

    // Declare dimensions for local chart
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = localHeight - this.margin.top - this.margin.bottom;

    // Calculate the initial scale for the projections to fit the map within the container
    this.mapScale = Math.min(this.width / 2, this.height / 2);

    // Define projection scales
    this.initialProjection = d3.geoOrthographic().scale(this.mapScale).translate([this.width * 0.5, this.height * 0.5]);
    //this.equirectangularProjection = d3.geoEquirectangular().scale(this.mapScale * 0.6).translate([this.width * 0.41, this.height * 0.68]);

    const widthToHeightRatio = this.width / this.height;
    const maxScale = 0.3; // Controls the scale of the map

    this.equirectangularProjection = d3.geoEquirectangular()
      .scale(Math.min(widthToHeightRatio * this.mapScale * maxScale, this.mapScale)) // Dynamic scaling based on width
      .translate([this.width / 2, this.height * 0.5]); // Centering projection within the container

    // Create a chart group that will hold the actual chart
    // (The parent SVG will hold multiple chart groups and display them as needed)
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('class', 'deactivated'); // Hide the chart until it's called by the Display class

    // Create tooltip skeleton
    this.tooltip = d3.select('#vis-container').append('div')
      .attr('class', 'globe-tooltip')
      .style('opacity', 0);

    this.render();
    // this.updateMap([null]);
  }

  render() {
    const vis = this;

    this.path = d3.geoPath().projection(this.initialProjection);

    // Create a background for the globe
    this.chart.append('g')
      .attr('class', 'globe-background-circle')
      .append('circle')
      .attr('cx', this.width / 2)
      .attr('cy', this.height / 2)
      .attr('r', this.mapScale)
      .attr('class', 'globe-background');

    // Define the countries
    this.countries = topojson.feature(this.data, this.data.objects.countries).features;

    // Create the map
    this.chart.selectAll('.country')
      .data(this.countries)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', this.path)
      .on('click', (event, d) => this.handleCountryClick(event, d))
      .on('mouseover', (event, d) => {
        const vis = this;
        vis.handleMouseOver(event, d, vis);
      })
      .on('mouseout', (event, d) => {
        const vis = this;
        vis.handleMouseOut(event, d, vis);
      });

    this.rotateGlobe();
  }

  toggleProjection() {
    const vis = this;
    vis.path = (vis.path.projection() === vis.initialProjection)
      ? d3.geoPath().projection(vis.equirectangularProjection)
      : d3.geoPath().projection(vis.initialProjection);

    vis.isEquirectangular = vis.path.projection() === vis.equirectangularProjection;

    const backgroundOpacity = (vis.isEquirectangular) ? 0 : 100;

    vis.chart.selectAll('.globe-background-circle')
      .transition()
      .duration(50)
      .attr('opacity', backgroundOpacity);

    vis.chart.selectAll('.country')
      .transition()
      .duration(100)
      .attr('d', vis.path);
  }

  resetProjection() {
    const vis = this;
    // Update global countrySection variable and trigger change detection
    globalCountrySelection = null;
    triggerCountryChange();
    // console.log('global selectedCountry is:', globalCountrySelection);

    // Deselect all countries on the globe
    vis.svg.selectAll('.country')
      .classed('selected', false);

    // Update globe projection
    vis.path = d3.geoPath().projection(vis.initialProjection);

    vis.chart.selectAll('.country')
      // .transition()
      // .duration(1000)
      .attr('d', vis.path);

    vis.chart.raise();

    vis.isEquirectangular = vis.path.projection() === vis.equirectangularProjection;

    d3.timerFlush();
  }

  rotateGlobe() {
    d3.timer((elapsed) => {
      this.initialProjection.rotate([elapsed / 100, 0]);

      this.chart.selectAll('path')
        .attr('d', this.path);

      return false;
    });
  }

  updateMap(countriesToHighlight) {
    const vis = this;
    // Pass in an array of country names to highlight based on global index
    vis.highlightList = countriesToHighlight;

    // Reset country color classes
    vis.chart.selectAll('.country')
      .attr('class', '')
      .attr('class', 'country country-disabled');

    // Update the map with new color classes
    vis.chart.selectAll('.country')
      .attr('class', (d) => {
        const countryName = vis.getCountryName(d);
        if (vis.highlightList.includes(countryName)) {
          let className;
          switch (countryName) {
            case 'Mexico':
              className = 'country-mx';
              break;
            case 'United Kingdom':
              className = 'country-uk';
              break;
            case 'China':
              className = 'country-ch';
              break;
            case 'Afghanistan':
              className = 'country-af';
              break;
            case 'Iran':
              className = 'country-ir';
              break;
            case 'Russia':
              className = 'country-ru';
              break;
            case 'Syria':
              className = 'country-sy';
              break;
            case 'Cuba':
              className = 'country-cu';
              break;
            case 'North Korea':
              className = 'country-nk';
              break;
            default:
              className = 'country';
          }
          return `country ${className}`; // Add both 'country' and specific class
        } else if (countryName === 'Antarctica') {
          return `country country-hidden`;
        }
        return 'country country-disabled'; // Default class
      });

    vis.chart.selectAll('.country')
      .on('mouseover', (event, d) => {
        const vis = this;
        vis.handleMouseOver(event, d, vis);
      })
      .on('mouseout', (event, d) => {
        const vis = this;
        vis.handleMouseOut(event, d, vis);
      });
  }

  handleCountryClick(event, d) {
    const vis = this;

    // Check if map is in explore mode
    if (vis.path.projection() === vis.equirectangularProjection) {

      // Check if d exists
      if (d) {
        // If d exists, then we came from a click event
        // Get the name of the clicked country
        const clickedCountryName = vis.getCountryName(d);
        // console.log('clickedCountryName is', clickedCountryName);

        // Update local class property
        vis.selectedCountry = (vis.selectedCountry === clickedCountryName) ? null : clickedCountryName;
        // console.log('selectedCountry is', vis.selectedCountry);

        if (vis.selectedCountry) {
          // Update global countrySection variable and trigger change detection
          globalCountrySelection = vis.selectedCountry;
          triggerCountryChange();
          // console.log('global selectedCountry is:', globalCountrySelection);
        } else {
          // reset the vis to its previous state
          switch (globalSectionIndex) {
            case 11:
              vis.selectedCountry = null;
              vis.updateMap([vis.selectedCountry]);
              globalCountrySelection = vis.selectedCountry;
              triggerCountryChange();
              break;
            case 12:
              vis.selectedCountry = ['Mexico', 'United Kingdom'];
              vis.updateMap(vis.selectedCountry);
              globalCountrySelection = vis.selectedCountry;
              triggerCountryChange();
              break;
            case 13:
              vis.selectedCountry = ['China', 'Afghanistan', 'Iran', 'Russia', 'Syria', 'Cuba', 'North Korea'];
              vis.updateMap(vis.selectedCountry);
              globalCountrySelection = vis.selectedCountry;
              triggerCountryChange();
              break;
            default:
              vis.updateMap([null]);
              break;
          }
        }

        // Update global countrySection variable and trigger change detection
        // globalCountrySelection = vis.selectedCountry;
        // triggerCountryChange();
        // console.log('global selectedCountry is:', globalCountrySelection);

        // Update GlobeChart styles
        // noinspection RedundantConditionalExpressionJS
        vis.chart.selectAll('.country')
          // eslint-disable-next-line no-unneeded-ternary
          .classed('selected', (country) => ((vis.getCountryName(country) === vis.selectedCountry) ? true : false));
      } else {
        // If there's no d, then we just came from the sectionChange event listener
        // For the initial section
        if (globalSectionIndex <= 11) {
          if (this.localSectionIndex === 11) {
          } else {
            // Reset the map
            vis.resetProjection();
            vis.selectedCountry = null;
            vis.updateMap([null]);

            // Update local section index to avoid repeat animations
            vis.localSectionIndex = 11;
          }
        } else if (globalSectionIndex === 12) {
          if (this.localSectionIndex === 12) {
          } else {
            // Set the map to expanded mode
            vis.resetProjection();
            vis.toggleProjection();
            vis.updateMap(['Mexico', 'United Kingdom']);

            // Highlight the relevant countries
            vis.selectedCountry = null;

            // Update local section index to avoid repeat animations
            vis.localSectionIndex = 12;
          }
        } else if (globalSectionIndex === 13) {
          if (this.localSectionIndex === 13) {
          } else {
            // Set the map to expanded mode
            vis.resetProjection();
            vis.toggleProjection();
            vis.updateMap(['China', 'Afghanistan', 'Iran', 'Russia', 'Syria', 'Cuba', 'North Korea']);

            // Highlight the relevant countries
            vis.selectedCountry = null;

            // Update local section index to avoid repeat animations
            vis.localSectionIndex = 13;
          }
        }
      }

    } else if (vis.path.projection() === vis.initialProjection) {
      // If the map isn't in explore mode, activate explore mode
      vis.toggleProjection();
    }
  }

  getCountryName(d) {
    return (d && d.properties && d.properties.name) ? d.properties.name : null;
  }

  handleMouseOver(event, d, vis) {
    // Show tooltip on mouseover
    // Get the client offsets so the tooltip appears over the mouse
    const { offsetX, offsetY } = offsetCalculator.getOffsets(event.clientX, event.clientY);

    // Update tooltip position
    vis.tooltip
      .transition()
      .duration(200)
      .style('opacity', 0.9)
      .style('left', `${offsetX + 10}px`)
      .style('top', `${offsetY - 20}px`);

    // Update tooltip content
    // Find the country info
    const countryName = vis.getCountryName(d);
    vis.tooltip.html(`<strong class="label">${countryName}</strong>`);
  }

  handleMouseOut(event, d, vis) {
    // Hide tooltip on mouseout
    vis.tooltip
      .transition()
      .duration(200)
      .style('opacity', 0);
  }


  activate() {
    // Method allows Display class to show this chart
    this.chart.raise();
    this.chart.classed('deactivated', false);
    // this.chart.classed('activated', true);
  }

  deactivate() {
    // Method allows Display class to hide this chart
    // this.chart.classed('activated', false);
    this.chart.classed('deactivated', true);
    this.chart.lower();
  }
}
