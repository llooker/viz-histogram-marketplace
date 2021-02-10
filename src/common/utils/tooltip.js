import * as d3 from "../d3-loader";
import SSF from "ssf";
import { FILTERED_LABELS } from "../options";

export function simpleHistTooltipHandler(datum, label, bins) {
  return [
    {
      title: label !== "" ? label : datum["title"],
      bin: bins,
      field: bins.binned ? "label" : datum["lookerName"].replace(".", "_"),
      type: bins.binned ? "ordinal" : "quantitative",
    },
    {
      title: "Count of Records",
      type: "quantitative",
      ...(!bins.binned && { aggregate: "count" }),
      ...(bins.binned && { field: "count_x" }),
    },
  ];
}

export function binnedTooltipHandler(datum, labelOverride, bins) {
  return [
    {
      title: labelOverride !== "" ? labelOverride : datum["title"],
      bin: bins,
      field: bins.binned ? "label" : datum["lookerName"].replace(".", "_"),
      type: bins.binned ? "ordinal" : "quantitative",
    },
    {
      title: "Count of Records",
      aggregate: "count",
      type: "quantitative",
      ...(!bins.binned && { aggregate: "count" }),
      ...(bins.binned && { field: "count_x" }),
    },
  ];
}

export function simpleTooltipFormatter(dataProperties, config, measure, item, valFormat) {
  if (
    config === undefined ||
    item === undefined ||
    item.stroke === "transparent" ||
    config["bin_type"] === "breakpoints"
  ) {
    return;
  }

  const checkNeg = (text) => {
    return text.replace(/\u2013|\u2014|\u2212/g, "-");
  };
  const getText = (item) => {
    let title = config[`x_axis_override`] !== "" ? config[`x_axis_override`] : dataProperties[measure].title;
    return item.tooltip[title].split(" ");
  };
  const format = (text) => {
    let a = SSF.format(valFormat, Number(checkNeg(text[0])));
    let b = SSF.format(valFormat, Number(checkNeg(text[2])));
    return [a, b];
  };
  let [a, b] = format(getText(item));
  d3.select("td.value").text(a + " - " + b);
}

// Applies tooltip formatting for scatter hist. Some complexity as there are essentially 4 different tooltips:
// 1) Histogram on X,
// 2) Histogram on Y,
// 3) Heatmap,
// 4) Scatterplot
export function tooltipFormatter(
  dataProperties,
  config,
  item,
  valFormatX,
  valFormatY,
  valFormatPoints
) {
  if (
    config === undefined ||
    item === undefined ||
    item.fillOpacity === 0 ||
    config["bin_type"] === "breakpoints"
  ) {
    return;
  }

  // Somewhere along the way (Vega-Lite or Looker) "-" becomes en-dashes.
  // We need negative numbers to have true hyphens to be converted to Number()
  const checkNeg = (text) => {
    return text.replace(/\u2013|\u2014|\u2212/g, "-");
  };

  const getText = (axis) => {
    let title = config[`${axis}_axis_override`] !== "" ? config[`${axis}_axis_override`] : dataProperties[config[axis].replace(".", "_")].title;
    return item.tooltip[title].split(" ");
  };

  const getTextScatter = (axis) => {
    let title = (axis !== "size" && config[`${axis}_axis_override`] !== "") ? config[`${axis}_axis_override`] : dataProperties[config[axis].replace(".", "_")].title;
    return Number(checkNeg(item.tooltip[title]));
  };

  const getFormatValue = (axis, text) => {
    let format = axis === "x" ? valFormatX : valFormatY;
    let part1 = SSF.format(format, Number(checkNeg(text[0])));
    let part2 = SSF.format(format, Number(checkNeg(text[2])));
    return [part1, part2];
  };

  if (item.mark.name === "X_HISTOGRAM_marks") {
    let [a, b] = getFormatValue("x", getText("x"));
    d3.select("td.value").text(a + " - " + b);
  }

  if (item.mark.name === "Y_HISTOGRAM_marks") {
    let [a, b] = getFormatValue("y", getText("y"));
    d3.select("td.value").text(a + " - " + b);
  }

  if (item.mark.name === "HEATMAP_marks") {
    let [a, b] = getFormatValue("x", getText("x"));
    let [c, d] = getFormatValue("y", getText("y"));
    d3.selectAll("td.value").each(function (_d, i) {
      if (i === 0) {
        d3.select(this).text(a + " - " + b);
      } else if (i === 1 && config["x"] !== config["y"]) {
        // Weird edge case where the user selects the same field for both X and Y
        d3.select(this).text(c + " - " + d);
      }
    });
  }

  if (item.mark.name === "SCATTERPLOT_marks") {
    let scatterFlag = 0;
    d3.selectAll("td.value").each(function (_d, i) {
      if (i === 0) {
        d3.select(this).text(SSF.format(valFormatX, getTextScatter("x")));
      }
      else if (i === 1) {
        if (config["x"] !== config["y"]) {
          // Weird edge case where the user selects the same field for both X and Y
          d3.select(this).text(SSF.format(valFormatY, getTextScatter("y")));
        } else if (config["size"]) {
          d3.select(this).text(SSF.format(valFormatPoints, getTextScatter("size")));
          scatterFlag = 1;
        }
      } 
      else if (i === 2 && !scatterFlag && config["size"] && (config["x"] !== config["size"] && config["y"] !== config["size"])) {
        d3.select(this).text(SSF.format(valFormatPoints, getTextScatter("size")));
      }
    });
  }
}

export function getScatterTooltipFields(dataProperties, queryResponse, config) {
  let tooltipFields = [];
  for (let datum in dataProperties) {
    //ignore filtered labels
    if (datum === FILTERED_LABELS) {
      continue;
    }
    if (
      dataProperties[datum]["dtype"] === "nominal" ||
      datum === config["x"] ||
      datum === config["y"] ||
      datum === config["size"]
    ) {
      let tip = {};
      tip["field"] = datum;
      tip["type"] = dataProperties[datum]["dtype"];
      tip["title"] = ((datum) => {
        // Switch to apply label overrides for x and y
        switch (datum) {
          case config["x"]:
            return config["x_axis_override"] !== ""
              ? config["x_axis_override"]
              : dataProperties[datum]["title"];
          case config["y"]:
            return config["y_axis_override"] !== ""
              ? config["y_axis_override"]
              : dataProperties[datum]["title"];
          default:
            return dataProperties[datum]["title"];
        }
      })(datum);
      tooltipFields.push(tip);
    }
  }
  // Tooltip formatting expects a certain order { x, y, size } so we ensure ordering here
  let order = [config["x"], config["y"]];
  if (config["size"]) {
    order.push(config["size"]);
  }
  tooltipFields.sort((a, b) => order.indexOf(a["field"]) - order.indexOf(b["field"]));

  // Move dimensions to back of array
  for (let i = 0; i < queryResponse.fields.dimensions.length; i++) {
    tooltipFields.push(tooltipFields.shift());
  }
  return tooltipFields;
}
