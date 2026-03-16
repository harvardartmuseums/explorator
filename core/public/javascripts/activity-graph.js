/**
 * activity-graph.js
 * Renders a D3 multi-line activity graph for a Harvard Art Museums object.
 *
 * Dependencies: D3 v6+ (loaded globally as `d3`)
 *
 * @param {string}      objectId       - The museum object ID to fetch activity data for.
 * @param {HTMLElement} graphContainer - The DOM element to append the SVG chart into.
 * @param {HTMLElement} dataContainer  - The DOM element containing the metric display spans.
 * @returns {Promise<void>}
 */
async function makeActivityGraph(objectId, graphContainer, dataContainer) {
    // Inject axis styles once into the document if not already present
    const STYLE_ID = "activity-graph-styles";
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            .activity-graph .axis path,
            .activity-graph .axis line {
                fill: none;
                stroke: grey;
                stroke-width: 1;
                shape-rendering: crispEdges;
            }
        `;
        document.head.appendChild(style);
    }

    // Mark the container so the scoped CSS selector above applies
    graphContainer.classList.add("activity-graph");

    const margin = { top: 5, right: 5, bottom: 20, left: 30 };
    const width  = 350 - margin.left - margin.right;
    const height = 150 - margin.top  - margin.bottom;

    const parseDate = d3.timeParse("%Y-%m");

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    let myScale;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const xAxis = d3.axisBottom(x).ticks(5);
    const yAxis = d3.axisLeft(y).ticks(3);

    const line = d3.line()
        .x(d => x(d.activitydate))
        .y(d => y(d.totalcount));

        
        const graphWidth  = width  + margin.left + margin.right;
        const graphHeight = height + margin.top  + margin.bottom;
        
        const svg = d3.select(graphContainer)
        .append("svg")
        .attr("width",  graphWidth)
        .attr("height", graphHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    try {
        const url = `/data/object/${objectId}/activities/by/month`;
        let data = await d3.json(url);
        data = data.activities;

        color.domain(Object.keys(data.buckets));

        data.buckets.forEach(bucket => {
            bucket.by_month.buckets.forEach(month => {
                month.activitydate = parseDate(month.key_as_string);
            });
        });

        const totals = color.domain().map(name => ({
            name:   data.buckets[name].key,
            values: data.buckets[name].by_month.buckets.map(d => ({
                activitydate:   d.activitydate,
                totalcount:     +d.totals.value,
                key_as_string:  d.key_as_string
            }))
        }));

        myScale = d3.scaleLinear()
            .clamp(true)
            .domain([0, x.range()[1]])
            .rangeRound([0, totals[0].values.length]);

        // Scale the range of the data
        x.domain(d3.extent(data.buckets[0].by_month.buckets, d => d.activitydate));
        y.domain([
            d3.min(totals, c => d3.min(c.values, v => v.totalcount)),
            d3.max(totals, c => d3.max(c.values, v => v.totalcount))
        ]);

        // X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        // Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        const total = svg.selectAll(".total")
            .data(totals)
            .enter().append("g")
                .attr("class", "total");

        total.append("path")
            .attr("class", "line")
            .attr("d", d => line(d.values))
            .style("stroke",       d => color(d.name))
            .style("stroke-width", "1px")
            .style("fill",         "none")
            .append("title")
                .text(d => d.name);

        // Interactive crosshair
        // Technique adapted from: http://bl.ocks.org/d3noob/a0cbcddc6bf0eb9569fe
        const dataGrid = d3.select(dataContainer);

        const focus = svg.append("g")
            .style("display", "none");

        focus.append("line")
            .attr("class", "x")
            .style("stroke",          "grey")
            .style("stroke-dasharray", "3,3")
            .style("opacity",          1)
            .style("shape-rendering", "crispEdges");

        focus.append("text")
            .attr("class", "y1")
            .style("opacity", 1)
            .attr("dx", 8)
            .attr("dy", "1em");

        svg.append("rect")
            .attr("width",  width)
            .attr("height", height)
            .style("fill",           "none")
            .style("pointer-events", "all")
            .on("mouseover", () => focus.style("display", null))
            .on("mouseout",  () => focus.style("display", "none"))
            .on("mousemove", (event) => {
                const [mx] = d3.pointer(event);

                focus.select(".x")
                    .attr("transform", `translate(${mx},0)`)
                    .attr("y2", graphHeight - 25);

                const itemNumber = myScale(mx);
                const periodLabel = totals[0].values[itemNumber]?.key_as_string;
                if (periodLabel) {
                    dataGrid.select("span.metric-period").text(periodLabel);
                }

                totals.forEach(series => {
                    const count = series.values[itemNumber]?.totalcount ?? 0;
                    dataGrid.select(`span.metric-${series.name}`).text(count);
                });
            });

    } catch (err) {
        console.error(`makeActivityGraph: failed to load activity data for object ${objectId}`, err);
    }
}
