import * as d3 from "./d3-loader";
import percentile from "percentile";
import SSF from "ssf";

export function handleErrors(vis, res, options) {
  const check = (group, noun, count, min, max) => {
    if (!vis.addError || !vis.clearErrors) return false;
    if (count < min) {
      vis.addError({
        title: `Not Enough ${noun}s`,
        message: `This visualization requires ${
          min === max ? "exactly" : "at least"
        } ${min} ${noun.toLowerCase()}${min === 1 ? "" : "s"}.`,
        group,
      });
      return false;
    }
    if (count > max) {
      vis.addError({
        title: `Too Many ${noun}s`,
        message: `This visualization requires ${
          min === max ? "exactly" : "no more than"
        } ${max} ${noun.toLowerCase()}${min === 1 ? "" : "s"}.`,
        group,
      });
      return false;
    }
    vis.clearErrors(group);
    return true;
  };

  const {
    pivots,
    dimension_like: dimensions,
    measure_like: measures,
  } = res.fields;
  return (
    check(
      "pivot-req",
      "Pivot",
      pivots.length,
      options.min_pivots,
      options.max_pivots
    ) &&
    check(
      "dim-req",
      "Dimension",
      dimensions.length,
      options.min_dimensions,
      options.max_dimensions
    ) &&
    check(
      "mes-req",
      "Measure",
      measures.length,
      options.min_measures,
      options.max_measures
    )
  );
}

export function prepareData(data, queryResponse) {
  var myData = [];
  var dataProperties = {};
  var dims = [];
  var meas = [];
  var allFields = [];

  //get the data and store the links
  for (var cell in data) {
    var obj = data[cell];
    var dataDict = {};
    dataDict["links"] = [];
    for (var key in obj) {
      var shortName = key.replace(".", "_");
      dataDict[shortName] = obj[key]["value"];
      if (typeof obj[key]["links"] != "undefined") {
        //create array of all links for a row of data
        for (var l = 0; l < obj[key]["links"].length; l++) {
          //grab link label and add field name for clarity in menu
          var currentLabel = obj[key]["links"][l]["label"];
          currentLabel =
            currentLabel + " (" + key.substring(key.indexOf(".") + 1) + ")";
          obj[key]["links"][l]["label"] = currentLabel;
        }
        //add links for field in row
        dataDict["links"].push(obj[key]["links"]);
      }
    }
    //flatten to make single depth array
    dataDict["links"] = dataDict["links"].flat();
    myData.push(dataDict);
  }

  //create array of all measures for lookup purposes
  queryResponse.fields.measure_like.forEach(function (field) {
    var fieldName = field.name.replace(".", "_");
    meas.push(fieldName);
  });
  //create array of all dimensions for lookup purposes
  queryResponse.fields.dimension_like.forEach(function (field) {
    var fieldName = field.name.replace(".", "_");
    dims.push(fieldName);
  });

  allFields = meas.concat(dims);

  //determine number format
  for (var field in allFields) {
    var lookerName = allFields[field];
    dataProperties[allFields[field]] = {};
    //get friendly names for measures
    queryResponse.fields.measure_like.forEach(function (measure) {
      if (lookerName == measure["name"].replace(".", "_")) {
        // get index of period to place it back in for drilling
        dataProperties[allFields[field]]["lookerName"] = measure["name"];
        //get label short or label to handle table calcs
        if (typeof measure["label_short"] != "undefined") {
          dataProperties[allFields[field]]["title"] = measure["label_short"];
        } else {
          dataProperties[allFields[field]]["title"] = measure["label"];
        }
        dataProperties[allFields[field]]["valueFormat"] =
          measure["value_format"];
        if (measure["type"] == "yesno") {
          dataProperties[allFields[field]]["dtype"] = "nominal";
        } else {
          dataProperties[allFields[field]]["dtype"] = "quantitative";
        }
      }
    });
    //get friendly names for dimensions
    queryResponse.fields.dimension_like.forEach(function (dimension) {
      if (lookerName == dimension["name"].replace(".", "_")) {
        // get index of period to place it back in for drilling
        dataProperties[allFields[field]]["lookerName"] = dimension["name"];
        if (typeof dimension["label_short"] != "undefined") {
          dataProperties[allFields[field]]["title"] = dimension["label_short"];
        } else {
          dataProperties[allFields[field]]["title"] = dimension["label"];
        }
        dataProperties[allFields[field]]["valueFormat"] =
          dimension["value_format"];
        dataProperties[allFields[field]]["dtype"] = "nominal";
      }
    });
  }

  return { dataProperties, myData };
}

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

export function makeBins(myData, field, breakpointsArray, valFormat, axis) {
  let preBin = [];
  let orderedArray = myData.map((e) => e[field]).sort((a, b) => a - b);
  let breakpoints = breakpointsArray.split(",").map((e) => {
    switch (e.trim()) {
      case "min":
        return orderedArray[0];
      case "max":
        return orderedArray[orderedArray.length - 1];
      default:
        return eval(e);
    }
  });

  //Find first element larger than target
  for (let i = 0; i < breakpoints.length - 1; i++) {
    let threshold = orderedArray.findIndex((n) => n > breakpoints[i + 1]);
    if (threshold === -1) {
      threshold = orderedArray.length;
    }

    //Count length of resulting array
    let count = orderedArray.splice(0, threshold).length;
    preBin.push({});
    preBin[i][`bin_start_${axis}`] = breakpoints[i];
    preBin[i][`bin_end_${axis}`] = breakpoints[i + 1];
    preBin[i][`count_${axis}`] = count;
    preBin[i]["label"] = `${SSF.format(
      valFormat,
      preBin[i][`bin_start_${axis}`]
    )} - ${SSF.format(valFormat, preBin[i][`bin_end_${axis}`])}`;
    preBin[i]["order"] = i + 1;
  }
  return preBin;
}

export function getPercentile(p, field, myData) {
  return percentile(
    p,
    myData.map((e) => e[field])
  );
}

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

export function winsorize(myData, field, p) {
  p = p.split("_").map((e) => eval(e));
  let thresholds = percentile(
    p,
    myData.map((e) => e[field])
  );

  return myData.map((e) => {
    let copy = Object.assign({}, e);
    if (copy[field] <= thresholds[0]) {
      copy[field] = thresholds[0];
    } else if (e[field] >= thresholds[1]) {
      copy[field] = thresholds[1];
    }
    return copy;
  });
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

export function simpleTooltipFormatter(
  dataProperties,
  config,
  measure,
  item,
  valFormat
) {
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
    let title = dataProperties[measure].title;
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
  chartType,
  config,
  item,
  xAxisFormat,
  yAxisFormat = null,
  pointFormat = null
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
    let title = dataProperties[config[axis].replace(".", "_")].title;
    return item.tooltip[title].split(" ");
  };

  const getTextScatter = (axis) => {
    let title = dataProperties[config[axis].replace(".", "_")].title;
    return Number(checkNeg(item.tooltip[title]));
  };

  const getFormatValue = (axis, text) => {
    let format = axis === "x" ? xAxisFormat : yAxisFormat;
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
    d3.selectAll("td.value").each(function (_d, i) {
      if (i === 0) {
        d3.select(this).text(SSF.format(xAxisFormat, getTextScatter("x")));
      } else if (i === 1 && config["x"] !== config["y"]) {
        // Weird edge case where the user selects the same field for both X and Y
        d3.select(this).text(SSF.format(yAxisFormat, getTextScatter("y")));
      }
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
