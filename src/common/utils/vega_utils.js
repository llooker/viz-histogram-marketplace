import * as d3 from "../d3-loader";
import SSF from "ssf";

export const FONT_TYPE =
  "'Roboto', 'Noto Sans JP', 'Noto Sans CJK KR', 'Noto Sans Arabic UI', 'Noto Sans Devanagari UI', 'Noto Sans Hebre', 'Noto Sans Thai UI', 'Helvetica', 'Arial', sans-serif";

const parseTransform = (s) => s.split("(")[1].split(")")[0].split(",");
export function positionRefLine(axis) {
  let boundingbox = d3
    .select(".mark-group.role-scope.concat_1_concat_0_group")
    .select("path")
    .node()
    .getBBox();
  let line = d3
    .select(`.${axis === "x" ? "refLineX" : "refLineY"}_marks`)
    .selectChildren();
  let translate = parseTransform(line.attr("transform"));
  if (axis === "x") {
    translate[1] = boundingbox.height;
    line
      .attr("y2", -1 * boundingbox.height)
      .attr("transform", `translate(${translate[0]},${translate[1]})`);
  } else {
    translate[0] = 0;
    line
      .attr("x2", boundingbox.width)
      .attr("transform", `translate(${translate[0]},${translate[1]})`);
  }
}

export function positionLegend(orientation) {
  if (orientation === "right") {
    let legends = d3.selectAll(".mark-group.role-legend")._groups[0];
    let baseLegend = legends[legends.length - 2];
    let lastLegend = legends[legends.length - 1];
    let translate = parseTransform(
      d3.select(baseLegend).select("g").attr("transform")
    );
    let offset = d3.select(baseLegend).select("g").node().getBBox();
    let legendOffset = d3.select(lastLegend).select("g").node().getBBox();
    d3.select(lastLegend)
      .select("g")
      .attr(
        "transform",
        `translate(${translate[0]}, ${
          eval(translate[1]) + offset.height + legendOffset.height
        })`
      );
  }
}

export function fixChartSizing() {
  d3.select("svg")
    .style("width", "100%")
    .style("height", "100%")
    .style("position", "fixed")
    .style("preserveAspectRatio", "none")
    .style("top", 0)
    .style("bottom", 0)
    .style("right", 0)
    .style("left", 0);
}

export function setFormatting(chartType, xAxisFormat, yAxisFormat = null) {
  if (chartType === "simple") {
    d3.select("g.mark-text.role-axis-label")
      .selectAll("text")
      .each(function (d, i) {
        d3.select(this).text(SSF.format(xAxisFormat, d.datum.value));
      });
  } else {
    let labels = d3.selectAll("g.mark-text.role-axis-label");
    let xAxis = labels._groups[0][1];
    let yAxis = labels._groups[0][2];
    d3.select(xAxis)
      .selectAll("text")
      .each(function (d, i) {
        d3.select(this).text(SSF.format(xAxisFormat, d.datum.value));
      });
    d3.select(yAxis)
      .selectAll("text")
      .each(function (d, i) {
        d3.select(this).text(SSF.format(yAxisFormat, d.datum.value));
      });
  }
}

export function formatPointLegend(valFormat, coloredPoints, heatmap) {
  let legends = d3.selectAll("g.mark-group.role-legend-entry");
  let pointLegend;
  if (!heatmap && coloredPoints) {
    pointLegend = legends._groups[0][1];
  } else if (heatmap && coloredPoints) {
    pointLegend = legends._groups[0][2];
  } else {
    pointLegend = legends._groups[0][0];
  }
  d3.select(pointLegend)
    .selectAll("text")
    .each(function (d, i) {
      d3.select(this).text(SSF.format(valFormat, d.datum.value));
    });
}

export function formatCrossfilterSelection(crossfilters, fields, color) {
  let scatter = d3
    .select(".SCATTERPLOT_marks")
    .selectAll("path")
    .attr("fill", function (d) {
      for (let f of crossfilters) {
        let name = f.field.replace(".", "_");
        if (f.values.indexOf(String(d.datum[name])) >= 0) {
          return color;
        } else {
          return "#DEE1E5";
        }
      }
    });
}
