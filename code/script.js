let w = 1200; // Increase the width
let h = 600; // Increase the height
            function zoomed() {
                map.attr('transform', d3.event.transform);
            }
            const zoom = d3.zoom().scaleExtent([1, 40]).on('zoom', zoomed);;
            let svg = d3.select("#chart")
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