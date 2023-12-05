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
            .selectAll(".myLabels")
            .data(keys)
            .enter()
            .append("text")
            .attr("class", "myLabels")
            .attr("x", vis.width-100 + size*1.2)
            .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)})
            .style("fill", function(d){ return color(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")

        vis.displayData = vis.data.sort((a,b) => {return a.year - b.year});


        var t = 800;

        vis.x.domain([0, 20000]);
        vis.y.domain(vis.displayData.map(d => d.name));

        //console.log(vis.displayData.map(d => d.name))

        d3.select("#presidents")
            .selectAll("option")
            .data(vis.displayData.map(d => d.name).reverse())
            .enter()
            .append("option")
            .attr("value", d=>d)
            .text(d=>d)


        vis.svg.select(".y-axis")
            .transition()
            .duration(t)
            .call(vis.yAxis);

        vis.svg.select(".x-axis")

            .call(vis.xAxis)
            .attr("color", "#EFEFEF");



        // Add a button to start the animation
        d3.select("#startBars")
            .on("click", () =>  this.wrangleData());  // Call startAnimation when the button is clicked


        d3.select("#resetBars")
            .on("click", () =>  this.resetAnimation());  // Call startAnimation when the button is clicked

        // Create a tooltip div
        vis.tooltip = d3.select("#presidents").append("div")
            .attr("class", "tooltip")
            .style('opacity', 0)
            .style('pointer-events', 'none')
            // .style('background-color', 'lightgrey')
            .style('box-shadow', '2px 2px 6px rgba(0,0,0,0.3)');


    }

    wrangleData(){
        let vis = this;

        vis.displayData = vis.data.sort((a,b) => {return a.year - b.year}).slice();

        vis.avg_democrat = d3.mean(vis.displayData.filter(d=>d.party == "Democratic"), d=> d.word_count)
        vis.avg_republican = d3.mean(vis.displayData.filter(d=>d.party == "Republican"), d=> d.word_count)

        vis.avg_overall = d3.mean(vis.displayData, d=> d.word_count)


        vis.updateVis();

    }

    updateVis(){
        let vis = this;

        var t = 1200;

        var myPres = d3.select("#presidents").property("value")

        //d3.select("#startBars").attr("disabled", true);

        vis.svg.select(".x-axis")
            .transition()
            .duration(t)
            .delay(10000)
            .attr("color", "black");

        //overall line
        vis.svg.append("line")
            .attr("class", "vertical-line")
            .attr("x1", vis.x(vis.avg_overall))
            .attr("y1", 0)
            .attr("y2", vis.height)
            .attr("x2", vis.x(vis.avg_overall))
            .transition()
            .duration(t)
            .delay(11000)
            .style("stroke", "black")
            .style("stroke-width", 25)
            .style("stroke-dasharray", "5,5");

        //democratic
        vis.svg.append("line")
            .attr("class", "vertical-line party-democrat")
            .attr("x1", vis.x(vis.avg_democrat))
            .attr("y1", 0)
            .attr("y2", vis.height)
            .attr("x2", vis.x(vis.avg_democrat))
            .transition()
            .duration(t)
            .delay(11000)
            .style("stroke", "#83A2FF")
            .style("stroke-width", 25)
            .style("stroke-dasharray", "5,5");

        //republican
        vis.svg.append("line")
            .attr("class", "vertical-line party-republican")
            .attr("x1", vis.x(vis.avg_republican))
            .attr("y1", 0)
            .attr("y2", vis.height)
            .attr("x2", vis.x(vis.avg_republican))
            .transition()
            .duration(t)
            .delay(11000)
            .style("stroke", "#FF8B8B")
            .style("stroke-width", 25)
            .style("stroke-dasharray", "5,5");


        vis.bars = vis.svg.selectAll(".racingBars")
            .data(vis.displayData);

        vis.bars.enter()
            .append("rect")
            .attr("class", "racingBars")
            .attr("y", d => vis.y(d.name))
            .attr("height", vis.y.bandwidth())
            .attr("x", 0)
            //.attr("width", d => vis.x(0))
            .attr("fill", d=>{

                if(d.name == myPres) {
                    return "pink"
                } else {
                    return "grey"
                }

            })

            .on("mouseover", function (event, d) {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                vis.tooltip.html(
                    `President: ${d.name}<br/>Average Speech Length: ${d.word_count} words<br/>Party: ${d.party}`
                )
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");

            })
            .on("mousemove", function (event) {
                vis.tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<2000){return vis.x(d.word_count)} else{return vis.x(2000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<4000){return vis.x(d.word_count)} else{return vis.x(4000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<6000){return vis.x(d.word_count)} else{return vis.x(6000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<8000){return vis.x(d.word_count)} else{return vis.x(8000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<10000){return vis.x(d.word_count)} else{return vis.x(10000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<12000){return vis.x(d.word_count)} else{return vis.x(12000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<14000){return vis.x(d.word_count)} else{return vis.x(14000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<16000){return vis.x(d.word_count)} else{return vis.x(16000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => {
                if(d.word_count<18000){return vis.x(d.word_count)} else{return vis.x(18000)}
            })
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("width", d => vis.x(d.word_count))
            .transition()
            .delay(1200)
            .duration(1200)
            .attr("fill", d => {
                if(d.party === "Republican"){
                    return partyColors["party-republican"]
                }else if(d.party === "Democratic"){
                    return partyColors["party-democrat"]
                }else{
                    return partyColors["party-other"]
                }
            })



            /*
            .attr("class", d=>{
                if(d.party === "Republican"){
                    return "racingBars party-republican"
                }else if(d.party === "Democratic"){
                    return "racingBars party-democrat"
                }else{
                    return "racingBars party-other"
                }
            })
            */

            // this part doesn't work
            /*
            .on("end", function (d) {
                // Append image at the end of each bar
                vis.svg.append("image")
                    .attr("xlink:href", d => `images/Portraits/${d.image}-*.jpeg`)
                    .attr("x", vis.x(d.word_count)) // Adjust the position based on your requirements
                    .attr("y", vis.y(d.name))
                    .attr("width", vis.x(20)) //
                    .attr("height", vis.y.bandwidth());
            })
            */

            ;

        vis.bars.exit().remove();

        //d3.select("#startBars").attr("disabled", false);

    }

    resetAnimation() {
        let vis = this;

        vis.svg.selectAll(".racingBars").remove();

        vis.svg.selectAll(".vertical-line").remove();

        vis.svg.select(".x-axis").attr("color", "#EFEFEF");


    }


}