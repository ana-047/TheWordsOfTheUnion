class RadialBarChart {
  constructor(containerId, data) {
    this.containerId = containerId;
    this.data = data.map((d) => ({
      label: d.year,
      value: Object.keys(d.tagged_text).length,
    }));

    this.margin = {
      top: 20, right: 20, bottom: 30, left: 40,
    };
    this.width = 400 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;

    this.init();
    this.update();
  }

  init() {
    console.log(this.constructor.name, 'initializing');
    this.radius = Math.min(this.width, this.height) / 2;

    this.svg = d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`)
      .attr('class', 'deactivated');

    this.color = d3.scaleOrdinal()
      .range(d3.schemeCategory10);

    this.arc = d3.arc()
      .innerRadius(0)
      .outerRadius(this.radius);

    this.pie = d3.pie()
      .value((d) => d.value)
      .sort(null);
  }

  update() {
    const { data } = this;

    const arcs = this.svg.selectAll('.arc')
      .data(this.pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', this.arc)
      .attr('fill', (d, i) => this.color(i));

    arcs.append('text')
      .attr('transform', (d) => `translate(${this.arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .text((d) => d.data.label)
      .style('text-anchor', 'middle');
  }

  activate() {
    this.svg.classed('deactivated', false);
    this.svg.classed('activated', true);
  }

  deactivate() {
    this.svg.classed('activated', false);
    this.svg.classed('deactivated', true);
  }
}
