let w = 800; // Increase the width
let h = 600; // Increase the height
let initTime = [0,12];
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

let color = d3.scaleQuantize()
            .range(['rgb(240,249,232)','rgb(186,228,188)','rgb(123,204,196)','rgb(67,162,202)','rgb(8,104,172)'])

const map = svg.append("g");

// Create projection
let projection = d3.geoMercator()
    .center([32, 49])
    .translate([w/2, h/2])
    .scale(2000);

// Create geoPath
let path = d3.geoPath()
    .projection(projection);

// var csvData = `Indicator,Region,Frequency,2021-M01,2021-M02,2021-M03,2021-M04,2021-M05,2021-M06,2021-M07,2021-M08,2021-M09,2021-M10,2021-M11,2021-M12,2022-M01
// Migration population growth,Ukraine,Monthly,25966,60400,94382,124303,158414,197773,244653,291313,354833,399465,439948,476925,30955`;

// Parse the CSV data
// var data = d3.csv("ukr_migration (1).csv");

// Transform the data to have date and migration number
// var transformedData = data.columns.slice(3).map(function(month) {
//     var dateParts = month.split('-');
//     var formattedDate = dateParts[0] + '-' + dateParts[1].replace('M', '');
//     return {
//         date: d3.timeParse("%Y-%m")(formattedDate),
//         number: +data[0][month]
//     };
// });

// console.log(transformedData);
// Specify the region
// Specify the region
async function fetchLineData(region, migrationType, hover = false) {
    // let region = 'Kyiv';
    if (migrationType = "growth")
    {
        migrationType = "Migration population growth"
    }
    else {
        migrationType = "Migration population reduction"
    }
    //console.log("fetch line data of region: ", region)
    // Read the CSV file
    let data = await d3.csv('ukr_migration (1).csv');
    // console.log(data)
    // Filter rows for the specified region
    let filteredData = data.filter(row => (row.Region === region && row.Indicator === "Migration population growth") );
    
    // Log the filtered data
    // console.log("data: ", filteredData);
    // console.log("columns: ", Object.keys(filteredData[0]));
    let { Indicator, Region, Frequency, ...rest} = filteredData[0]
    // console.log("data: ", rest);
    // return rest;

    // console.log("hey: ",rest)
    // for (const [key, value] of Object.entries(rest)) {
    //     console.log(`Key: ${key}, Value: ${value}`);
    // }
    let lineData = []
        for (const [key, value] of Object.entries(rest)) {
            let date = key.split('-')
            let formattedDate = date[0] + '-' + date[1].replace('M', '');
            lineData.push({
                date: d3.timeParse("%Y-%m")(formattedDate),
                number: +value
            })
        }
    //console.log("lineData: ", lineData)
    
    lineChart(lineData, hover)
}
fetchLineData('Kyiv', "growth")

//filter value
let svg1 = null;
function lineChart(dataset, hover){

    // let padding = 10
    // d3.select("#line_chart").select("svg").remove();
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
    d3.select("#line_chart").select("svg").remove();
    d3.select("#line_chart").select("div").remove();
    svg1 = d3.select("#line_chart")
        .append("svg")
        .attr("id", "line_chart_svg")
        .attr("width", w)
        .attr("height", h)
        .style("overflow", "visible")
        // .style("margin", "50px")
        .style("border","1px solid black")  
        // .style("visibility", "hidden")

    if (hover) {
        svg1.style("visibility", "visible");
    } else {
        svg1.style("visibility", "hidden");
    }

    svg1.append("path") 
        .datum(dataset)
        .attr("class", "line")
        .attr("d", line)
        .style("fill", "none")

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
    // svg1.append("line")
    //     .attr("class", "line halfMilMark")
    //     .attr("x1", padding)
    //     .attr("x2", w)
    //     .attr("y1", yScale(500000))
    //     .attr("y2", yScale(500000))
    //     .style("stroke", "red")

    // svg1.append("text")
    //     .attr("class", "halfMilLabel")
    //     .attr("x", padding + 10)
    //     .attr("y", yScale(500000) - 7)
    //     .text("Half a million unemployed")
    //     .style("stroke", "red")

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

// lineChart(transformedData); 


//Calculate the average of selected time
function calculateAverage(dataset, timeRange){
    let result = 0;
    let startMonth = timeRange[0];
    let endMonth = timeRange[1];
    if(dataset.length == 0) return 0;
    if(startMonth == endMonth) {
        result = Math.abs(dataset[startMonth]);
    }
    else{
        result = Math.abs((dataset[endMonth - 1] - dataset[startMonth] + dataset[endMonth])/(endMonth - startMonth)); 
    }
    return Math.floor(result);
}

async function fetchData(type, color, timeRange) {
    const [geoJson, migrationData] = await Promise.all([
        d3.json("ukr (1).json"),
        d3.json("ukr_migration.json"),
    ]);

    migrationData.features.forEach((data) => {
        let dataRegion = data.name;
        const dataValue = data.data;
        //console.log("hello: " + dataRegion) 
        //console.log("data:", dataValue)
        geoJson.features.forEach((jsonRegion) => {
            let jsonRegionName = jsonRegion.name;
            
            if (jsonRegionName === dataRegion) {
                jsonRegion.value = dataValue;
                return;
            }
        });
        
    })

    let maxValues = [];
    geoJson.features.forEach((jsonRegion) => {
        
        let average = calculateAverage(jsonRegion.value.migrationGrowth, timeRange);
        if(type != "in") {
            average = calculateAverage(jsonRegion.value.migrationReduction, timeRange);
        }
        maxValues.push(average);
    })

    console.log("MaxValues" + maxValues + "\n" + d3.max(maxValues));
    color.domain([0, d3.max(maxValues)])

    let index = 0;

    svg.selectAll("path")
        .data(geoJson.features)
        .enter()
        .append("path")
        .on("mouseover", function (d) {
            d3.select(this).attr("fill", "orange");
            d3.select(this).style("cursor", "pointer");
            let region = d.name;
            let value = calculateAverage(d.value.migrationGrowth, timeRange);
                if(type != "in") {
                    value = calculateAverage(d.value.migrationReduction, timeRange);
                }
            if (region) {
                let text = svg
                    .append("text")
                    .attr("id", "hoverText")
                    .text((d) => region + " Migration: " + value)
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "14px")
                    .attr("fill", "black")
                    .style("pointer-events", "none")
                
                let box = svg
                    .append("rect")
                    .attr("id", "hoverRect")
                    // .attr("x")
                    .attr("fill", "transparent")
                    .attr("stroke", "black")
                    .attr("stroke-width", "1px")
                    .attr("width", 100)
                    .attr("height", 100)
                    .style("pointer-events", "none");
                
                let textLength = text.node().getComputedTextLength();
                text.attr("transform", `translate(${-textLength / 2}, -5)`);
                box.attr("transform", "translate(20, -10)")
            }
            // lineChart()
            fetchLineData(region, "growth", true)
        })
        .on("mousemove", function (d) {
            let region = d.name
            if (region) {
                let coord = d3.mouse(this);
                svg.select("#hoverText").attr("x", coord[0]).attr("y", coord[1]);
                svg.select("#hoverRect").attr("x", coord[0]).attr("y", coord[1]);
            }
        })
        .on("mouseout", function (d) {
            d3.select(this).attr("fill", (d) => {
                //let value = d.properties.value;
                let value = calculateAverage(d.value.migrationGrowth, timeRange);
                if(type != "in") {
                    value = calculateAverage(d.value.migrationReduction, timeRange);
                }
                // console.log("Mouseout:", value);
                return value ? color(value) : "#808080";
            });

            if (svg1) svg1.style("visibility", "hidden");
            d3.select(this).style("cursor", "default");
            svg.select("#hoverText").remove();
            svg.select("#hoverRect").remove();
        })
        .attr("d", path)
        .call(zoom)
        .attr("fill", (d) => {
            let value = calculateAverage(d.value.migrationGrowth, timeRange);
            if(type != "in") {
                value = calculateAverage(d.value.migrationReduction, timeRange);
            }
            console.log("Color:" + d.name + " Color" + color(value));
            return value ? color(value) : "#808080";
        })
        .style("stroke", "black")
        .style("stroke-width", "0.5px")
}

fetchData("in", color, initTime)


function calculateJaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(''));
    const set2 = new Set(str2.toLowerCase().split(''));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

function findMostSimilarString(inputString, stringArray) {
    let maxSimilarity = -1;
    let mostSimilarString = null;

    stringArray.forEach(str => {
        const similarity = calculateJaccardSimilarity(inputString, str);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilarString = str;
        }
    });

    return mostSimilarString;
}

const twoRadioButton = document.querySelectorAll(
    "input[type=radio][name=migration]"
);

twoRadioButton.forEach((radio) => {
    radio.addEventListener("click", async (e) => {
        const value = e.target.value;
        if (value === "in") {
            svg.selectAll("path").remove()
            let color = d3.scaleQuantize()
                            .range(['rgb(240,249,232)','rgb(186,228,188)','rgb(123,204,196)','rgb(67,162,202)','rgb(8,104,172)'])
            await fetchData("in", color, initTime);
        }
        else 
        {
            svg.selectAll("path").remove();
            let color = d3.scaleQuantize()
                        .range(['rgb(254,229,217)','rgb(252,174,145)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)'])
            await fetchData("out", color, initTime)
        }
    });
})

//Creating a time slider
const minDate = new Date('2021-01-01');
const maxDate = new Date('2022-01-01');
const interval = maxDate.getFullYear() - minDate.getFullYear();
const startYear = minDate.getFullYear();
let dataMonths = [];
for (let year = 0; year <= interval; year++) {
    for (let month = 0; month < 12; month++) {
        if (year === interval && month > 0) break;
        dataMonths.push(new Date(startYear + year, month, 1));
    }
}

const sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataMonths))
    .max(d3.max(dataMonths))
    .marks(dataMonths)
    .width(500)
    .tickFormat(d3.timeFormat('%b %Y'))
    .tickValues(dataMonths.filter(d => d.getMonth === 0))
    .default([d3.min(dataMonths), d3.max(dataMonths)])
    .on('onchange', (value) => {
        console.log(value);
    });

const gTime = d3
    .select('#time_slider')
    .append('svg')
    .attr('width', 600)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

gTime.call(sliderTime);



//bar chart space
// var w = 600;
// var h = 400;
var dataset = []
var numValues = 22;
var maxValue = 30
var minValue = 1
var fontSize = 16
var ascSort = true
// Generate new random numbers
for (var i = 0; i < numValues; i++) {
    newNumber = Math.floor(Math.random() * (maxValue - minValue) + minValue)
    dataset.push(newNumber);
}
async function fetchBarData() {
    let rawData = await d3.json("ukr_migration.json");
    let barData = []
    // for (const [key, value] of Object.entries(data)) {
    //     let date = key.split('-')
    //     let formattedDate = date[0] + '-' + date[1].replace('M', '');
    //     barData.push({
    //         date: d3.timeParse("%Y-%m")(formattedDate),
    //         number: +value
    //     })
    // }
    rawData.features.forEach((data) => {
        let dataRegion = data.name;
        let dataValue = data.data;
        barData.push({
            region: dataRegion,
            migrationGrowth: dataValue.migrationGrowth[0],
            migrationReduction: dataValue.migrationReduction[0]
        });
    
    })
    console.log(barData)
    updateData(barData)
    // return barData;
}

fetchBarData()
var transitionName = "easeCircleIn"



var svg2 = d3.select("#bar")
    .append("svg")
    .attr("width", 1200)
    .attr("height", h)
    // .style("padding", "10px")
    // .style("margin-left", "auto")
    // .style("margin-right", "auto")
    .style("overflow", "visible")
    // .style("margin", "0 auto")
    // .style("width", "100%")
    // .attr("preserveAspectRatio", "none")
function updateData(dataset) {
    console.log("dataset length: ", dataset)
    const migrationGrowthValues = dataset.map(data => data.migrationGrowth)
                                        .filter(value => typeof value === 'number');

    const regionValues = dataset.map((data) => {
        return {
            migration: data.migrationGrowth,
            region: data.region
        }
    })

    // Find the maximum value using Math.max()
    const maxMigrationGrowth = Math.max(...migrationGrowthValues);

    // Print the maximum migrationGrowth value
    console.log("Maximum migrationGrowth:", migrationGrowthValues);

    var xScale = d3.scaleBand()
            .rangeRound([0, 1200])
            .paddingInner(0.1)
            // .domain([0, dataset.length])
    var yScale = d3.scaleLinear()
                .domain([0, maxMigrationGrowth])
                .range([h, 0])

    var xAxis = d3.axisBottom()
                .ticks(5)
                .scale(xScale);

    var yAxis = d3.axisLeft()
                .ticks(5)
                .scale(yScale);
    // Update scales
    xScale.domain(d3.range(dataset.length))    
    yScale.domain([0, maxMigrationGrowth])
                
    // Update bars
    var bars = svg2.selectAll("rect")
                    .data(migrationGrowthValues)

    //Sort function
    var sortBars = function(check){
        svg2.selectAll("rect")
            .sort(function(a, b) {
                console.log(check)
                if (check) {
                    return d3.ascending(a, b)
                }
                else return d3.descending(a, b)
                
            })
            .transition()
            .duration(200)
            .attr("x", function(d, i) {
                return xScale(i);
            })
    }

    d3.select("#sort")
        .on("click", function() { // Toggle sort order
            if (ascSort) { // If sorting ascending
                ascSort = false // Set to false
                sortBars(true) // Sort descending
            }
            else { // Otherwise
                ascSort = true // Set to true
                sortBars(false) // Sort ascending
            }
        })

    // Enter new bars                
    bars.enter()
        .append("rect")
        .merge(bars)
        //Handling the mouse over event for the bars
        .on("mouseover", function() {
            d3.select(this)
                // .attr("fill", "transparent")
                .style("stroke-width", "2")
                .style("stroke", "black")

            d3.select(this)
                .append("title")
                .text((d) => `This value is ${d}`);

            var xPosition = parseFloat(d3.select(this).attr("x"))
            var yPosition = parseFloat(d3.select(this).attr("y")) - 16
            // var yPosition = parseFloat(d3.select(this).attr("y")) + (h - d3.select(this).attr("y")) / 2
            svg2.append("text")
                .attr("id", "tooltip")
                .attr("x", xPosition + xScale.bandwidth() / 2)
                .attr("y", yPosition + fontSize / 2)
                .attr("font-size", fontSize)
                .attr("text-anchor", "middle")
                .text(d3.select(this).data()[0])
                .style("pointer-events", "none")

            svg2.append("text")
                .attr("id", "tooltip2")
                .attr("x", xPosition + xScale.bandwidth() / 2)
                .attr("y", h + fontSize / 2 + 30)
                .attr("font-size", fontSize)
                .attr("text-anchor", "middle")
                .text(regionValues.filter(data => data.migration === d3.select(this).data()[0])[0].region)
                .style("pointer-events", "none");
            // regionValues.filter(data => data.migration === d3.select(this).data()[0])[0]
        })
        //Handling the mouse out event for the bars
        .on("mouseout", function(event, d) {
            d3.select("#tooltip").remove()
            d3.select("#tooltip2").remove()
            d3.select(this)
                .attr("fill", (d) => "hsl(210, 100%, " + (d / maxMigrationGrowth * 120) + "%)")
                .style("stroke-width", "0")
                .style("stroke", "transparent")
        })
        .transition()
        .duration(200)
        .ease(d3[transitionName])
        // .delay(function(d, i){
        //     return i / dataset.length * 1000;
        // })
        .attr("x", function(d, i) {
            return xScale(i);
        })
        .attr("y", function(d) {
            return h - yScale(d);
        })

        .attr("width", xScale.bandwidth())
        .attr("height", function(d) {
            return yScale(d);
        })
        .attr("fill", function(d) {
            return "hsl(210, 100%, " + (d / maxMigrationGrowth * 120) + "%)";
        })



    // Append text to each bar
    bars.append("text")
        .merge(bars)
        .text(function(d) {
            return "hello";  // assuming `region` is the property with the region name
        })
        .attr("x", function(d, i) {
            return xScale(i) + xScale.bandwidth() / 2;  // center the text in the bar
        })
        .attr("y", function(d) {
            return yScale(d.value);  // position the text at the top of the bar
        })
        .attr("dy", "-.35em")  // adjust position to above the bar
        .attr("text-anchor", "middle")  // center the text
        .attr("font-size", "12px")  // adjust as needed
        .attr("fill", "black");  // adjust as needed

    // Create axes
    svg2.append("g")
        .attr("transform", `translate(0, ${h})`)
        .call(xAxis);
    svg2.append("g")
        // .attr("transform", `translate(${padding}, 0)`)
        .call(yAxis);
    /*Handling the exit selection*/
    bars.exit()
    .transition()
    .duration(500)
    .attr("x", w)
    .remove();
}

let svg3 = d3.select("#demo")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .style("border", "1px solid black")
            
// Assuming you have a scale for your data
var dataScale = d3.scaleLinear()
    .domain([0, 200])
    .range([0, w]);

// Create a scale for the color gradient
var colorScale = d3.scaleQuantize()
    .domain([10, 50])
    .range(['rgb(240,249,232)','rgb(186,228,188)','rgb(123,204,196)','rgb(67,162,202)','rgb(8,104,172)']);

let data = [10, 20, 30, 40, 50]
// Create the gradient bar
svg3.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function(d) { return dataScale(d); })
    .attr("width", function(d) { return 50; })
    .attr("height", 30)
    .style("fill", function(d) { return colorScale(d); });

// updateData(dataset)
