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

let color = d3.scaleQuantize()
            .range(['rgb(239,243,255)','rgb(189,215,231)','rgb(107,174,214)','rgb(49,130,189)','rgb(8,81,156)'])

const map = svg.append("g");

// Create projection
let projection = d3.geoMercator()
    .center([32, 49])
    .translate([w/2, h/2])
    .scale(2000);

// Create geoPath
let path = d3.geoPath()
    .projection(projection);


// // //Load data and draw map
// d3.json("ukr.json").then(function(json){
//     map.selectAll("path")
//         .data(json.features)
//         .enter()
//         .append("path")
//         .attr("d", path)
//         .attr("fill","gray")
// })

var csvData = `Indicator,Region,Frequency,2021-M01,2021-M02,2021-M03,2021-M04,2021-M05,2021-M06,2021-M07,2021-M08,2021-M09,2021-M10,2021-M11,2021-M12,2022-M01
Migration population growth,Ukraine,Monthly,25966,60400,94382,124303,158414,197773,244653,291313,354833,399465,439948,476925,30955`;

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
async function fetchLineData() {
    let region = 'Kyiv';

    // Read the CSV file
    // let region = 'Kyiv';
    // Read the CSV file
    let data = await d3.csv('ukr_migration (1).csv');
    // Filter rows for the specified region
    let filteredData = data.filter(row => (row.Region === region && row.Indicator === "Migration population growth") );
    
    // Log the filtered data
    // console.log("data: ", filteredData);
    // console.log("columns: ", Object.keys(filteredData[0]));
    const { Indicator, Region, Frequency, ...rest} = filteredData[0]
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

    // console.log("dit cu: ",lineData)
}
fetchLineData()

//filter value
function lineChart(dataset){

    // let padding = 10

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
        // .style("margin", "50px")
        .style("border","1px solid black")  

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

const demo = document.getElementById("demo")
demo.innerHTML = "fuck"
async function fetchData(dataset, color) {
    // console.log(dataset)
    // console.log(color)
    const [geoJson, migrationData] = await Promise.all([
        d3.json("ukr.json"),
        d3.csv(dataset),
    ]);

    const migrationArray = migrationData.map((d) => ({...d}));
    let jsonRegions = []
    geoJson.features.forEach((jsonRegion) => {
        let jsonRegionName = jsonRegion.properties["name:en"];
        jsonRegionName = jsonRegionName.replace(" Oblast", "");
        jsonRegions.push(jsonRegionName)
    })
    // console.log(jsonRegions)
    migrationArray.forEach((data) => {
        let dataRegion = data.region;
        // console.log(dataRegion)
        dataRegion = dataRegion.replace("ska", "")
        // console.log(dataRegion)
        dataRegion = findMostSimilarString(dataRegion, jsonRegions)
        const dataValue = parseFloat(data.migration);
        // console.log(dataRegion)
        geoJson.features.forEach((jsonRegion) => {
            let jsonRegionName = jsonRegion.properties["name:en"];
            jsonRegionName = jsonRegionName.replace(" Oblast", "");
            // console.log(jsonRegionName)
            if (jsonRegionName === dataRegion) {
                jsonRegion.properties.value = dataValue;
                // console.log("assigned ", jsonRegionName, " with ", dataRegion)
                return;
            }
        });
    })
    
    // console.log(migrationArray["region"])
    const minValue = d3.min(migrationArray, (d) => parseFloat(d.migration));
    const maxValue = d3.max(migrationArray, (d) => parseFloat(d.migration));
    color.domain([minValue / 100, maxValue / 100])

    // console.log(minValue / 100)
    // console.log(maxValue / 1000)
    // console.log(color(1000))
    svg.selectAll("path")
        .data(geoJson.features)
        .enter()
        .append("path")
        .on("mouseover", function () {
            d3.select(this).attr("fill", "orange");
            demo.innerHTML = "shitttt"
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", (d) => {
                let value = d.properties.value;
                return value ? color(value / 10) : "#808080";
            });
        })
        .attr("d", path)
        .call(zoom)
        .attr("fill", (d) => {
            // console.log("shit")
            let value = d.properties.value;
            // console.log("value is: ", value / 100, "with color: ", color(value / 10))
            return value ? color(value / 10) : "#808080";
        })
        // .each(function (d) {
        //     this.fillColor = d3.select(this).attr("fill");
        // });
        
    
    console.log("fuck")
}

fetchData("ukr_migration_in.csv", color)

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
            d3.selectAll("path").remove()
            let color = d3.scaleQuantize()
                            .range(['rgb(239,243,255)','rgb(189,215,231)','rgb(107,174,214)','rgb(49,130,189)','rgb(8,81,156)'])
            await fetchData("ukr_migration_in.csv", color);
        }
        else 
        {
            d3.selectAll("path").remove()
            let color = d3.scaleQuantize()
                        .range(['rgb(254,229,217)','rgb(252,174,145)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)'])
            await fetchData("ukr_migration_out.csv", color)
        }
    });
})

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
    .default(minDate)
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

