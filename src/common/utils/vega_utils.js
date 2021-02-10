import * as d3 from "../d3-loader";
import SSF from "ssf";

/* Because of https://github.com/vega/vega-lite/issues/6874 we are currently unable 
to register custom formatters in vega-lite charts that use bins. 
As a consequence, this file is a ton of terse d3 selections to apply formatting. 
since vega-lite precludes granular naming of elements (can only `name` top level `mark`)
It's annoying but gets the job done. Hopefully we can remove most of this once that issue has been solved. */

export const FONT_TYPE =
  "'Roboto', 'Noto Sans JP', 'Noto Sans CJK KR', 'Noto Sans Arabic UI', 'Noto Sans Devanagari UI', 'Noto Sans Hebre', 'Noto Sans Thai UI', 'Helvetica', 'Arial', sans-serif";

function parseTransform(str) {
  return str.split("(")[1].split(")")[0].split(",");
} 

export function positionRefLine(axis, config) {
  let selector = (!config["x_hist"] && !config["y_hist"]) ? ".mark-group.role-frame.root" : ".BOUNDING_BOX_group"
  let boundingbox = d3
    .select(selector)
    .select("path")
    .node()
    .getBBox();
  let line = d3
    .select(`.refLine${axis}_marks`)
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
    let translate = parseTransform(d3.select(baseLegend).select("g").attr("transform"));
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

export function setAxisFormatting(config, chartType, xAxisFormat, yAxisFormat = null) {
  if (chartType === "simple") {
    d3.select("g.mark-text.role-axis-label")
      .selectAll("text")
      .each(function (d, i) {
        d3.select(this).text(SSF.format(xAxisFormat, d.datum.value));
      });
  } else {
    let selector = (config["x_hist"] || config["y_hist"]) ? ".BOUNDING_BOX_group" : ".mark-group.role-frame.root" 
    d3.selectAll(selector).selectAll(".mark-text.role-axis-label")
      .each(function(d, i) {
        if (i == 0) {
          d3.select(this).selectAll("text").each(function (d, i) {
              d3.select(this).text(SSF.format(xAxisFormat, d.datum.value));
          })
        }
        if (i == 1) {
          d3.select(this).selectAll("text").each(function (d, i) {
            d3.select(this).text(SSF.format(yAxisFormat, d.datum.value));
          });
        }
      })
    }
  }


export function formatPointLegend(valFormat, coloredPoints, heatmap, hist) {
  let legends = d3.selectAll(".mark-group.role-legend-entry");
  let pointLegend;
  if (!hist && !heatmap) {
    pointLegend = legends._groups[0][0];
  } else if (!hist && heatmap && coloredPoints) {
      pointLegend = legends._groups[0][0];
  } else if (!heatmap && coloredPoints || heatmap && !coloredPoints) {
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
  d3.select(".SCATTERPLOT_marks")
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

export function runFormatting(
  details,
  config,
  mainDimensions,
  valFormatX,
  valFormatY,
  valFormatPoints
) {
  if (
    details.crossfilterEnabled &&
    details.crossfilters.length &&
    config["layer_points"]
  ) {
    formatCrossfilterSelection(details.crossfilters, mainDimensions, config["color_col"]);
  }
  setAxisFormatting(config, "scatter", valFormatX, valFormatY);
  if (config["size"] && config["layer_points"]) {
    formatPointLegend(
      valFormatPoints,
      mainDimensions[1] !== undefined,
      config["heatmap_off"],
      (config["x_hist"] || config["y_hist"])
    );
  }
  if (config["reference_line_x"]) {
    positionRefLine("x", config);
  }
  if (config["reference_line_y"]) {
    positionRefLine("y", config);
  }
}
