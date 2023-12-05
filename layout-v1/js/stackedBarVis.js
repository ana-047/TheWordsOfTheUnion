/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */

class StackedBarVis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 250, bottom: 60, left: 120};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        // Scales and axes
        vis.y = d3.scaleBand()
            .range([vis.height, 0])
            .padding(0.1);

        vis.x = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height) + ")");
        // legend

        vis.keys = Object.keys(vis.data[0]).slice(2)

        // Get theme colors from main and convert to array
        vis.themeColors = Object.values(themeColors);

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.keys)
            // .range(["#FFD28F",  "#6BD425", "#83A2FF", "#EB4747", "#2274A5", "#F7AEF8", "#5BD1D7"]);
            .range(vis.themeColors);

        var size=20

        vis.svg.append("g")
            .attr("class", "legend")
            .selectAll(".myLegend2")
            .data(vis.keys)
            .enter()
            .append("rect")
            .attr("class", "myLegend2")
            .attr("x", vis.width + vis.margin.right -170)
            .attr("y", function(d,i){ return 10 + i*(size+5)})
            .attr("width", size)
            .attr("height", size)
            .style("fill", function(d){ return  vis.colorScale(d)})

        vis.svg.append("g")
            .attr("class", "legend")
            .selectAll("mylabels2")
            .data(vis.keys)
            .enter()
            .append("text")
            .attr("x", vis.width + vis.margin.right -170 + size*1.2)
            .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)})
            .style("fill", "black")
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")

        this.wrangleData();

    }

    wrangleData(){
        let vis = this;

        let sortData = vis.data.sort((a,b) => {return a.year - b.year});

        //vis.keys = Object.keys(sortData[0]).slice(3)


        // Stack the data per subgroup
        vis.displayData = d3.stack()
            .keys(vis.keys)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone)
            (sortData)
            .map((data, i) => {
                let cumulativeValue = 0;
                return data.map(d => {
                    cumulativeValue += d[1] - d[0];
                    return {
                        name: d.data.name,
                        key: vis.keys[i],
                        value: d[1] - d[0],
                        value_d0: d[0],
                        value_d1: d[1],
                        cumulativeValue: cumulativeValue,
                    };
                });
            });


        // Flatten the nested structure
        vis.displayData = vis.displayData.flat();

        // Extract unique president names for y-axis domain
        vis.y.domain(vis.displayData.map(d => d.name));

        vis.updateVis();

    }

    updateVis(){
        let vis = this;

        var t = 800;


        var myMax = d3.max(vis.displayData, d => d.value_d1);


        /*
        // color scale
        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.keys)
            .range(["#61E8E1", "#EB4747", "#FFD28F", "#83A2FF", "#1D3354", "#52489C", "#0F7173", "#CD3983", "#AF2BBF", "#857AB7", "#00487C"]);
*/

        vis.x.domain([0, myMax])

        vis.svg.select(".x-axis")
            .transition()
            .duration(t)
            .call(vis.xAxis);

        vis.svg.select(".y-axis")
            .transition()
            .duration(t)
            .call(vis.yAxis);


        vis.bars = vis.svg.selectAll(".stackedBars")
            .data(vis.displayData);

        vis.bars.enter()
            .append("rect")
            .attr("class", "stackedBars")
            .merge(vis.bars)
            .each(function (d) {
            })
            .transition()
            .duration(t)
            .attr("x", d => vis.x(d.value_d0))
            .attr("y", d => vis.y(d.name))
            .attr("width", d => vis.x(d.value_d1) - vis.x(d.value_d0))
            .attr("height", vis.y.bandwidth())
            .attr("fill", d => vis.colorScale(d.key));

        vis.bars.exit().remove();

        /*
                /// Update the rectangles
                vis.svg.selectAll("rect")
                    .data(vis.displayData)
                    .join("rect")
                    .transition()
                    .duration(t)
                    .attr("x", d => vis.x(0))
                    .attr("y", d => vis.y(d.name))
                    .attr("width", d => vis.x(d.value))
                    .attr("height", vis.y.bandwidth())
                    .attr("fill", d => vis.colorScale(d.key));

            */


    }
}