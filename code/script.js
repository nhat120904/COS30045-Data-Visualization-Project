let w = 800; // Increase the width
let h = 600; // Increase the height
function zoomed() {
    map.attr('transform', d3.event.transform);
}
const zoom = d3.zoom().scaleExtent([1, 40]).on('zoom', zoomed);;
let svg = d3.select("#area_map")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("border","1px solid black")  
    .call(zoom)

const map = svg.append("g");

// Create projection
let projection = d3.geoMercator()
    .center([30, 50])
    .translate([w/2, h/2])
    .scale(2000);

// Create geoPath
let path = d3.geoPath()
    .projection(projection);


//Load data and draw map
d3.json("ukr.json").then(function(json){
    map.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill","gray")
})

var csvData = `Indicator,Region,Frequency,2021-M01,2021-M02,2021-M03,2021-M04,2021-M05,2021-M06,2021-M07,2021-M08,2021-M09,2021-M10,2021-M11,2021-M12,2022-M01
Migration population growth,Ukraine,Monthly,25966,60400,94382,124303,158414,197773,244653,291313,354833,399465,439948,476925,30955`;

// Parse the CSV data
var data = d3.csvParse(csvData);

// Transform the data to have date and migration number
var transformedData = data.columns.slice(3).map(function(month) {
    var dateParts = month.split('-');
    var formattedDate = dateParts[0] + '-' + dateParts[1].replace('M', '');
    return {
        date: d3.timeParse("%Y-%m")(formattedDate),
        number: +data[0][month]
    };
});

console.log(transformedData);

function lineChart(dataset){

    let padding = 10

    //set up the scale
    let xScale = d3.scaleTime()
    .domain([d3.min(dataset, d => d.date), d3.max(dataset, d => d.date)])
    .range([0, w]);

    let yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.number)])
        .range([h, 0]);

    //set up the line
    let line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.number));

    // let area = d3.area()
    //     .x(d => xScale(d.date))
    //     .y0(yScale.range()[0])
    //     .y1(d => yScale(d.number))
        
    //set up svg and path
    let svg1 = d3.select("#line_chart")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .style("overflow", "visible")
        .style("margin", "50px")

    svg1.append("path") 
        .datum(dataset)
        .attr("class", "line")
        .attr("d", line)
        .style("fill", "#6c8092")

    //add axis
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale);

    svg1.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (h) + ")")
        .call(xAxis);

    svg1.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // //add annotations
    svg1.append("line")
        .attr("class", "line halfMilMark")
        .attr("x1", padding)
        .attr("x2", w)
        .attr("y1", yScale(500000))
        .attr("y2", yScale(500000))
        .style("stroke", "red")

    svg1.append("text")
        .attr("class", "halfMilLabel")
        .attr("x", padding + 10)
        .attr("y", yScale(500000) - 7)
        .text("Half a million unemployed")
        .style("stroke", "red")

    // add tooltip
    let tooltip = d3.select("#line_chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // add mouseover event handler
    svg1.selectAll("path")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.number))
        .attr("r", 5)
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("x: " + d.date + "<br/>" + "y: " + d.number)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

lineChart(transformedData); 