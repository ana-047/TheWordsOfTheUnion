/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */

class BarVis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 60, left: 120};
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
        var keys = ["Republican", "Democratic", "Other"];

        // Declare party color variables
        vis.partyColors = Object.values(partyColors).slice(0,3);

        var color = d3.scaleOrdinal()
            .domain(keys)
            // .range(["#FF8B8B", "#83A2FF", "#FFD28F"]);
            .range(vis.partyColors);

        var size=20;

        vis.svg.append("g")
            .attr("class", "legend")
            .selectAll(".myLegend")
            .data(keys)
            .enter()
            .append("rect")
            .attr("class", "myLegend")
            .attr("x", vis.width-100)
            .attr("y", function(d,i){ return 10 + i*(size+5)})
            .attr("width", size)
            .attr("height", size)
            .style("fill", function(d){ return color(d)});

        vis.svg.append("g")
            .attr("class", "legend")
            .selectAll("mylabels")
            .data(keys)
            .enter()
            .append("text")
            .attr("x", vis.width-100 + size*1.2)
            .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)})
            .style("fill", function(d){ return color(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")

        this.wrangleData();

    }

    wrangleData(){
        let vis = this;

        vis.displayData = vis.data.sort((a,b) => {return a.year - b.year});

        vis.updateVis();

    }

    updateVis(){
        let vis = this;

        var t = 800;

        vis.x.domain([0, 20000]) //d3.max(vis.displayData, d => d.word_count)
        vis.y.domain(vis.displayData.map(d => d.name))

        vis.svg.select(".x-axis")
            .transition()
            .duration(t)
            .call(vis.xAxis);

        vis.svg.select(".y-axis")
            .transition()
            .duration(t)
            .call(vis.yAxis);

        vis.bars = vis.svg.selectAll(".racingBars")
            .data(vis.displayData)

        vis.bars.enter()
            .append("rect")
            .attr("class", "racingBars")
            .merge(vis.bars)
            .attr("y", d => vis.y(d.name))
            .attr("height", vis.y.bandwidth())
            .attr("x", 0)
            .transition()
            .duration(1100)
            .attr("width", d => vis.x(d.word_count))

            .attr("class", d=>{
                if(d.party === "Republican"){
                    return "party-republican"
                }else if(d.party === "Democratic"){
                    return "party-democrat"
                }else{
                    return "party-other"
                }
            });

        vis.bars.exit().remove();



    }


}