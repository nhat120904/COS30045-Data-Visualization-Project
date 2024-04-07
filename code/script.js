let w = 800; 
let h = 600; 
let initTime = [0, 12];
function zoomed() {
    map.attr('transform', d3.event.transform);
}
const zoom = d3.zoom().scaleExtent([1, 40]).on('zoom', zoomed);;
let svg = d3.select("#area_map")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .call(zoom)
    .style("overflow", "visible")


let color = d3.scaleQuantize()
            .range(['rgb(240,249,232)','rgb(186,228,188)','rgb(123,204,196)','rgb(67,162,202)','rgb(8,104,172)'])

const map = svg.append("g");
let typeMap = "in"
// Create projection
let projection = d3.geoMercator()
    .center([32, 49])
    .translate([w/2, h/2])
    .scale(2000);

// Create geoPath
let path = d3.geoPath()
    .projection(projection);

const monthsArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const monthYearArray = monthsArray.map(monthIndex => {
  const date = new Date((monthIndex === 12 ? 2022 : 2021), monthIndex % 12, 1);

  const options = { month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
});

console.log(monthYearArray);

async function fetchLineData(region, migrationType, hover = false) {
    console.log("line region: ",region)
    if (migrationType = "growth")
    {
        migrationType = "Migration population growth"
    }
    else {
        migrationType = "Migration population reduction"
    }

    let data = await d3.csv('ukr_migration.csv');

    let filteredData = data.filter(row => (row.Region === region && row.Indicator === "Migration population growth") );
    let filteredDataOut = data.filter(row => (row.Region === region && row.Indicator === "Migration population reduction") );
    let { Indicator, Region, Frequency, ...rest} = filteredData[0]
    let { Indicator2, Region2, Frequency2, ...rest2} = filteredDataOut[0]
    delete filteredDataOut[0]['Frequency'];
    delete filteredDataOut[0]['Indicator'];
    delete filteredDataOut[0]['Region'];

    let lineData = []
        for (const [key, value] of Object.entries(rest)) {
            let date = key.split('-')
            let formattedDate = date[0] + '-' + date[1].replace('M', '');
            lineData.push({
                date: d3.timeParse("%Y-%m")(formattedDate),
                number: +value
            })
        }
    let lineDataOut = []
        for (const [key, value] of Object.entries(filteredDataOut[0])) {
            let date = key.split('-')
            let formattedDate = date[0] + '-' + date[1].replace('M', '');
            lineDataOut.push({
                date: d3.timeParse("%Y-%m")(formattedDate),
                number: +value
            })
        }
    
    lineChart(lineData, lineDataOut, hover, region)
}
fetchLineData('Kyiv', "growth")

//filter value
let svg1 = null;
function lineChart(dataset, dataOut, hover, region){

    //set up the scale
    let xScale = d3.scaleTime()
    .domain([d3.min(dataset, d => d.date), d3.max(dataset, d => d.date)])
    .range([0, w]);
    let max;
    if (d3.max(dataset, d => d.number) > d3.max(dataOut, d => d.number)) {
        max = d3.max(dataset, d => d.number)
    }
    else {
        max = d3.max(dataOut, d => d.number)
    }
    let yScale = d3.scaleLinear()
        .domain([0, max + 10000])
        .range([h - 100, 0]);

    //set up the line
    let line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.number));
        
    //set up svg and path
    d3.select("#line_chart").select("svg").remove();
    d3.select("#line_chart").select("div").remove();
    svg1 = d3.select("#line_chart")
        .append("svg")
        .attr("id", "line_chart_svg")
        .attr("width", w)
        .attr("height", h)
        .style("overflow", "visible")

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
        .style("stroke", "blue")
        .style("stroke-width", 3)

    svg1.append("path")
        .datum(dataOut)
        .attr("class", "line")
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", "red")
        .style("stroke-width", 3)
    //add axis
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale).ticks(5, "s").tickSize(-w );

    svg1.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (h - 100) + ")")
        .call(xAxis)
        .call(g => {
            g.selectAll("text")
            .style("text-anchor", "middle")
            .attr("y", 20)
            .attr('fill', '#A9A9A9')
            .style("font-size", "12px") 
            g.selectAll("line")
            .attr('stroke', '#A9A9A9')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7)
            g.select(".domain").remove()
        });

    svg1.append("g") 
        .attr("class", "yAxis")
        .attr("transform",`translate(${0},0)`)
        .call(yAxis)
        .call(g => {
            g.selectAll("text")
            .style("text-anchor", "middle")
            .attr("x", -40)
            .attr('fill', '#A9A9A9')
            .style("font-size", "16px") 

            g.selectAll("line")
            .attr('stroke', '#A9A9A9')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7)

            g.select(".domain").remove()
            })
            .append('text')
            .attr('x', -35)
            .attr("y", h - 70)
            .attr("fill", "#A9A9A9")
            .style("font-size", "16px") 
            .text("Migrants") 

    // add tooltip
    let tooltip = d3.select("#line_chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    var formatTime = d3.timeFormat("%B %Y");
    // add mouseover event handler
    svg1.selectAll(".date-group")
        .data(dataset) 
        .enter()
        .append("g")
        .attr("class", "date-group")
        .attr("transform", d => `translate(${xScale(d.date)},0)`) 
        .each(function(d, i) {
            // append a circle for migration in
            d3.select(this).append("circle")
                .attr("class", "dot in")
                .attr("cy", yScale(d.number))
                .attr("r", 8)
                .style("fill", "blue")
                .on("mouseover", function(d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(formatTime(d.date) + "<br/>" + "Migration in: " + d.number)
                        .style("left", (d3.event.pageX + 10) + "px") 
                        .style("top", (d3.event.pageY - 28) + "px")
                        .style("background-color", "hsl(36, 84%, 85%)") 
                        .style("padding", "10px")
                        .style("width", "200px")
                        .style("border-radius", "20px")
                })
                
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // append a circle for migration out, using the corresponding item from dataOut
            const outData = dataOut[i]; // This assumes dataOut is aligned and has the same index for corresponding dates
            d3.select(this).append("circle")
                .attr("class", "dot out")
                .attr("cy", yScale(outData.number)) 
                .attr("r", 8)
                .style("fill", "red")
                .on("mouseover", function(d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(formatTime(outData.date) + "<br/>" + "Migration out: " + outData.number)
                        .style("left", (d3.event.pageX + 10) + "px") 
                        .style("top", (d3.event.pageY - 28) + "px")
                        .style("width", "200px"); 
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        });
        const legend = svg1.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(700, 600)");

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "blue");

        legend.append("text")
            .attr("x", 15)
            .attr("y", 10)
            .text("Migration In");

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "red");

        legend.append("text")
            .attr("x", 15)
            .attr("y", 30)
            .text("Migration Out");
        
        svg1.append("text")
            .attr("x", w / 2)
            .attr("y", h - 20)
            .attr("text-anchor", "middle")
            .text("Migration In and Out of " + region)
            .style("font-size", "20px")
}



//Calculate the average of selected time
function calculateAverage(dataset, timeRange){
    let result = 0;
    let startMonth = timeRange[0];
    let endMonth = timeRange[1];
    if(dataset.length == 0) return 0;
    if(startMonth == endMonth) {
        if(startMonth == 0){
            result = Math.abs(dataset[startMonth]);
        } else {
            result = Math.abs(dataset[endMonth] - dataset[endMonth - 1]);
        }    
    }
    else{
        if(startMonth == 0){
            result = Math.abs((dataset[endMonth])/(endMonth - startMonth + 1)); 
        } else {
            result = Math.abs((dataset[endMonth] - dataset[startMonth - 1])/(endMonth - startMonth + 1)); 
        }    
        
    }
    return Math.floor(result);
}


async function fetchData(type, color, timeRange) {
    console.log("time range: ", timeRange)
    const [geoJson, migrationData] = await Promise.all([
        d3.json("ukr (1).json"),
        d3.json("ukr_migration.json"),
    ]);

    let max = 0;
    migrationData.features.forEach((data) => {
        let dataRegion = data.name;
        const dataValue = data.data;
        
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
    color.domain([0, d3.max(maxValues)])
    let dataRange = [0]
    color.range().forEach(function(colorValue, index) {
        var domainValue = color.invertExtent(colorValue);
        dataRange.push(domainValue[1])
    });


    svg.selectAll("path")
        .data(geoJson.features)
        .enter()
        .append("path")
        .on("mouseover", function (d) {
            let initialColor = d3.select(this).attr("fill");
            d3.select(this).attr("fill", "orange");
            d3.select(this).style("cursor", "pointer");
            d3.select(this).style("stroke-width", "2px")
            let region = d.name;
            let value = calculateAverage(d.value.migrationGrowth, timeRange);
                if(type != "in") {
                    value = calculateAverage(d.value.migrationReduction, timeRange);
                }
            if (region) {

                svg.append("defs")
                .append("linearGradient")
                .attr("id", "rectGradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%")
                .selectAll("stop")
                .data([
                    {offset: "0%", color: "gray"},
                    {offset: "35%", color: "gray"},
                    {offset: "35%", color: "white"},
                    {offset: "100%", color: "white"}
                ])
                .enter().append("stop")
                .attr("offset", function(d) { return d.offset; })
                .attr("stop-color", function(d) { return d.color; });

                svg.append("defs")
                .append("filter")
                .attr("id", "drop-shadow")
                .attr("x", "-20%")
                .attr("y", "-20%")
                .attr("width", "140%")
                .attr("height", "140%")
                .append("feDropShadow")
                .attr("dx", "2")
                .attr("dy", "2")
                .attr("stdDeviation", "4")
                .attr("flood-color", "rgba(0,0,0,0.5)");
                
                let box = svg
                    .append("rect")
                    .attr("id", "hoverRect")
                    .attr("fill", "url(#rectGradient)")
                    .attr("stroke", "black")
                    .attr("stroke-width", "1px")
                    .attr("width", 270)
                    .attr("height", 130)
                    .attr("rx", 10)
                    .attr("ry", 10)
                    .style("filter", "url(#drop-shadow)")
                    .style("pointer-events", "none");

                let textRegion = svg
                    .append("text")
                    .attr("id", "hoverText")
                    .text((d) => region)
                    .attr("font-family", "Tahoma")
                    .attr("font-size", "16px")
                    .attr("fill", "black")
                    .style("font-weight", "bold")
                    .style("pointer-events", "none")
                    .style("fill", color(value));

                let timeRangeText = svg
                    .append("text")
                    .attr("id", "timeRangeText")
                    .text(monthYearArray[timeRange[0]] + " - " + monthYearArray[timeRange[1]]) // replace with your time range variable
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "16px")
                    .style("fill", "black")
                    .style("pointer-events", "none");

                let migrationValueText = svg
                    .append("text")
                    .attr("id", "migrationText")
                    .text("Average migration " +  type +  " value: " + value)
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "16px")
                    .style("fill", "black")
                    .style("pointer-events", "none")
                
                let help = svg
                    .append("text")
                    .attr("id", "help")
                    .text("Click for more details")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "16px")
                    .style("fill", "black")
                    .style("pointer-events", "none")

                timeRangeText.attr("transform", `translate(30, 60)`);
                migrationValueText.attr("transform", `translate(30, 80)`);
                help.attr("transform", `translate(30, 100)`);
                textRegion.attr("transform", `translate(40, 22)`);
                box.attr("transform", "translate(20, -10)")
            }

        })
        .on("click", function (d) {
            let region = d.name;
            fetchLineData(region, "growth", true)
        })
        .on("mousemove", function (d) {
            let region = d.name
            if (region) {
                let coord = d3.mouse(this);
                svg.select("#hoverText").attr("x", coord[0]).attr("y", coord[1]);
                svg.select("#hoverRect").attr("x", coord[0]).attr("y", coord[1]);
                svg.select("#timeRangeText").attr("x", coord[0]).attr("y", coord[1]);
                svg.select("#migrationText").attr("x", coord[0]).attr("y", coord[1]);
                svg.select("#help").attr("x", coord[0]).attr("y", coord[1]);
            }
        })
        .on("mouseout", function (d) {
            d3.select(this).attr("fill", (d) => {
                let value = calculateAverage(d.value.migrationGrowth, timeRange);
                if(type != "in") {
                    value = calculateAverage(d.value.migrationReduction, timeRange);
                }
                return value ? color(value) : "#808080";
            });
            d3.select(this).style("stroke-width", "0.5px")
            d3.select(this).style("cursor", "default");
            svg.select("#hoverText").remove();
            svg.select("#hoverRect").remove();
            svg.select("#timeRangeText").remove();
            svg.select("#migrationText").remove();
            svg.select("#help").remove();
        })
        .attr("d", path)
        .call(zoom)
        .attr("fill", (d) => {
            let value = calculateAverage(d.value.migrationGrowth, timeRange);
            if(type != "in") {
                value = calculateAverage(d.value.migrationReduction, timeRange);
            }
            return value ? color(value) : "#808080";
        })
        .style("stroke", "black")
        .style("stroke-width", "0.5px")
    
    let rangeColor
    if (type === "in") {
        rangeColor = ['rgb(240,249,232)','rgb(186,228,188)','rgb(123,204,196)','rgb(67,162,202)','rgb(8,104,172)']
    }
    else {
        rangeColor = [
            "rgb(254,229,217)",
            "rgb(252,174,145)",
            "rgb(251,106,74)",
            "rgb(222,45,38)",
            "rgb(165,15,21)",
        ];
    }

    var aliasColorScale = d3.scaleQuantize()
        .domain([10, 50])
        .range(rangeColor);

    let alias = [10, 20, 30, 40, 50]

    // Remove previous color schema before appending new color schema
    svg.selectAll(".color_rect").remove();
    svg.selectAll(".color_rect")
        .data(alias)
        .enter()
        .append("rect")
        .attr("class", "color_rect")
        .attr("x", function(d, i) {
            return 200 + i * 70 + 20;
        })
        .attr("y", 580)
        .attr("width", 70)
        .attr("height", 20)
        .attr("fill", (d) => {
            return aliasColorScale(d);
        })
        .on("mouseover", (d) => {
            const target_color = aliasColorScale(d);
            svg.selectAll("path")
                .filter(function () {
                    return d3.select(this).attr("fill") !== target_color;
                })
                .style("filter", "brightness(50%)")
                .attr("stroke", "white")
                .attr("stroke-width", "2");
        })
        .on("mouseout", () => {
            svg.selectAll("path")
                .style("filter", "none")
                .attr("stroke", "none");
        })
        .style("stroke-width", "0.5")
        .style("stroke", "black")
    
    svg.selectAll("text").remove();
    svg.selectAll("text") 
        .data(dataRange)
        .enter()
        .append("text")
        .attr("id", "legend")
        .attr("x", function(d, i) {
            return 200 + i * 70 + 20;
        })
        .attr("y", 570)
        .attr("font-size", fontSize)
        .attr("text-anchor", "middle")
        .text(function(d) {
            console.log(d3.select(this).data())
            return Math.round(d / 100) * 100
        })
    
    svg.append("text")
        .attr("x", 400)
        .attr("y", 50)
        .attr("font-size", "24px")
        .attr("text-anchor", "middle")
        .text("Ukraine Migration Map");
}

fetchData(typeMap, color, initTime)
fetchLineData("Kyiv", "growth", true)

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
            typeMap = "in"
            await fetchData("in", color, initTime);
            await fetchBarData(initTime, "in")
        }
        else 
        {
            svg.selectAll("path").remove();
            let color = d3.scaleQuantize()
                        .range(['rgb(254,229,217)','rgb(252,174,145)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)'])
            typeMap = "out"
            await fetchData("out", color, initTime)
            await fetchBarData(initTime, "out")
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
let premonth = 0
const sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataMonths))
    .max(d3.max(dataMonths))
    .marks(dataMonths)
    .width(500)
    .tickFormat(d3.timeFormat('%b %Y'))
    .tickValues(dataMonths.filter(d => d.getMonth === 0))
    .default([d3.min(dataMonths), d3.max(dataMonths)])
    .on('onchange', async (value) => {
        const date1 = new Date(value[0]);
        const date2 = new Date(value[1]);
        
        let month1 = date1.getMonth() + 1; 
        let month2 = date2.getMonth() + 1;
        if (premonth === 12 & month1 === 1) {
            month1 = 13
        }
        if (month2 === 1 & month1 != 0){
            month2 = 13
        }
        premonth = month1
        if (typeMap === "in") {
            svg.selectAll("path").remove()
            let color = d3.scaleQuantize()
                            .range(['rgb(240,249,232)','rgb(186,228,188)','rgb(123,204,196)','rgb(67,162,202)','rgb(8,104,172)'])
            typeMap = "in"
            await fetchData("in", color, [month1 - 1, month2 - 1]);
            await fetchBarData([month1 - 1, month2 - 1], "in")
        }
        else 
        {
            svg.selectAll("path").remove();
            let color = d3.scaleQuantize()
                        .range(['rgb(254,229,217)','rgb(252,174,145)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)'])
            typeMap = "out"
            await fetchData("out", color, [month1 - 1, month2 - 1])
            await fetchBarData([month1 - 1, month2 - 1], "out")
        }
    });

const gTime = d3
    .select('#time_slider')
    .append('svg')
    .attr('width', 600)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

gTime.call(sliderTime);

var dataset = []
var fontSize = 16
var ascSort = true

async function fetchBarData(timeRange, type) {
    let barData = []

    const [geoJson, migrationData] = await Promise.all([
        d3.json("ukr (1).json"),
        d3.json("ukr_migration.json"),
    ]);

    migrationData.features.forEach((data) => {
        let dataRegion = data.name;
        const dataValue = data.data;
        geoJson.features.forEach((jsonRegion) => {
            let jsonRegionName = jsonRegion.name;
            
            if (jsonRegionName === dataRegion) {
                jsonRegion.value = dataValue;
                return;
            }
        });
    })

    geoJson.features.forEach((jsonRegion) => {
        let region = jsonRegion.name;
        if(type == "in"){
            barData.push({
                name: region,
                number: calculateAverage(jsonRegion.value.migrationGrowth, timeRange)
            })
        } else {
            barData.push({
                name: region,
                number: calculateAverage(jsonRegion.value.migrationReduction, timeRange)
            })
        }
    })
    barData = barData.filter(data => data.name !== "Avtonomna Respublika Krym");
    console.log("BarData", barData)
    if (type === "in") {
        console.log("uising in data")
        updateData(barData, "blue");
    }
    else {
        console.log("usiong out")
        updateData(barData, "red")
    }
    return barData
}

let barData = fetchBarData(initTime, "in")

var svg2 = d3.select("#bar")
    .append("svg")
    .attr("width", 1000)
    .attr("height", h)
    .style("overflow", "visible")
function updateData(dataset, color) {
    svg2.select(".x-axis").remove();
    svg2.select(".y-axis").remove();
    if (color === "blue") {
        color = "hsl(210, 51%, "
    }
    else color = "hsl(0, 100%, "
    const maxMigrationGrowth = d3.max(dataset, d => d.number);

    var xScale = d3.scaleBand()
            .rangeRound([0, w])
            .paddingInner(0.1)
            .domain(dataset.map(d => d.name))
        
    var yScale = d3.scaleLinear()
                .domain([0, maxMigrationGrowth])
                .range([h, 0])

    var xAxis = d3.axisBottom(xScale)
                .tickFormat(d => d.substring(0,3).toUpperCase())

    var yAxis = d3.axisLeft()
                .scale(yScale);
                
    // Update bars
    var bars = svg2.selectAll("rect")
                    .data(dataset)

    var sortBars = function(check){
        if (check) {
            // Sort dataset in descending order
            dataset.sort((a, b) => d3.descending(a.number, b.number));
        } else {
            // Sort dataset in ascending order
            dataset.sort((a, b) => d3.ascending(a.number, b.number));
        }
    
        // Update the xScale domain after sorting
        xScale.domain(dataset.map(d => d.name));
        xAxis = d3.axisBottom(xScale)
        .tickFormat(d => d.substring(0,3).toUpperCase())
        // Select all bars and update data
        svg2.selectAll("rect")
            .data(dataset)
            .transition() // Add transition
            .duration(1000)
            .attr("x", (d, i) => xScale(d.name))
            .attr("y", d => yScale(d.number))
            .attr("height", d => h - yScale(d.number))
            .attr("fill", (d) => color + (90 - (d.number / maxMigrationGrowth * 70)) + "%)")

        // Remove the existing x-axis without transition
        svg2.select(".x-axis").remove();

        // Append and update the x-axis with a transition
        svg2.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${h})`)
            .style("opacity", 0)
            .call(xAxis)
            .transition()
            .duration(1000) // Duration in milliseconds, adjust as needed
            .style("opacity", 1);

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
        .on("mouseover", function(event, d) {
            d3.select(this)
                // .attr("fill", "transparent")
                .style("stroke-width", "2")
                .style("stroke", "black")

            d3.select(this)
                .append("title")
                .text((d) => d.name + ": " + d.number + " migrants");

            var xPosition = parseFloat(d3.select(this).attr("x"));
            var yPosition = parseFloat(d3.select(this).attr("y")) - 16;
            let data = d3.select(this).data()[0];
            svg2.append("text")
                .attr("id", "tooltip")
                .attr("x", xPosition + xScale.bandwidth() / 2)
                .attr("y", yPosition + fontSize / 2)
                .attr("font-size", fontSize)
                .attr("text-anchor", "middle")
                .text(data.number)
                .style("pointer-events", "none")

            svg2.append("text")
                .attr("id", "tooltip2")
                .attr("x", xPosition + xScale.bandwidth() / 2)
                .attr("y", h + fontSize / 2 + 30)
                .attr("font-size", fontSize)
                .attr("text-anchor", "middle")
                .text(data.name)
                .style("pointer-events", "none");
        })
        //Handling the mouse out event for the bars
        .on("mouseout", function(event, d) {
            d3.select("#tooltip").remove()
            d3.select("#tooltip2").remove()
            d3.select(this)
            .attr("fill", (d) => color + (90 - (d.number / maxMigrationGrowth * 70)) + "%)")
            .style("stroke-width", "0")
            .style("stroke", "transparent")
        })
        .transition()
        .duration(500)
        .attr("x", function(d) {
            return xScale(d.name);
        })
        .attr("y", function(d) {
            return yScale(d.number);
        })

        .attr("width", xScale.bandwidth())
        .attr("height", function(d) {
            return h - yScale(d.number);
        })
        .attr("fill", function(d) {
            return color + (90 - (d.number / maxMigrationGrowth * 70)) + "%)";
        })



    // Append text to each bar
    bars.append("text")
        .merge(bars)
        .text(function(d) {
            return "hello";  
        })
        .attr("x", function(d,i) {
            return xScale(i) + xScale.bandwidth() / 2;
        })
        .attr("y", function(d) {
            return yScale(d.number);  
        })
        .attr("dy", "-.35em")  
        .attr("text-anchor", "middle")  
        .attr("font-size", "12px")  
        .attr("fill", "black");  

    // Create axes
    svg2.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${h})`)
        .call(xAxis)
        
       
    svg2.append("g")
        .attr("class", "y-axis")
        .call(yAxis);
    bars.exit()
    .transition()
    .duration(500)
    .remove();

    svg2.select(".title").remove()
    // Add title for the bar chart
    svg2.append("text")
        .attr("x", w / 2)
        .attr("y", -10)
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Comparison of Migration " + typeMap + " between " + "different regions in Ukraine");

}

const region_checkbox = document.getElementsByClassName("region_checkbox");

for (const checkbox of region_checkbox) {
    checkbox.addEventListener("click", async () => {
        if (checkbox.value === 'All') {
            for (const box of region_checkbox) {
                box.checked = checkbox.checked;
            }
        }
        const checkedValues = [...region_checkbox]
            .filter((box) => box.checked)
            .map((box) => box.value);

        console.log(checkedValues)
        let barData = await fetchBarData(initTime, typeMap)
        let barDataArray = Object.values(barData);
        // Filter the dataset to only include the regions that are still checked
        const filteredData = barDataArray.filter(d => checkedValues.includes(d.name));
        if (typeMap === "in") {
            updateData(filteredData, "blue");
        }
        else {
            console.log("usiong out")
            updateData(filteredData, "red")
        }
    });
}

for (const checkbox of region_checkbox) {
    checkbox.checked = true;
}

let svg3 = d3.select("#demo")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .style("border", "1px solid black")
            
var dataScale = d3.scaleLinear()
    .domain([0, 200])
    .range([0, w]);

// Create a scale for the color gradient
var colorScale = d3.scaleQuantize()
    .domain([10, 50])
    .range(['rgb(240,249,232)','rgb(186,228,188)','rgb(123,204,196)','rgb(67,162,202)','rgb(8,104,172)']);

let data = [10, 20, 30, 40, 50]
// Create the gradient bar for the map
svg3.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function(d) { return dataScale(d); })
    .attr("width", function(d) { return 50; })
    .attr("height", 30)
    .style("fill", function(d) { return colorScale(d); });

