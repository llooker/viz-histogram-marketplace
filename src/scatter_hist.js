import { baseOptions, createOptions, FILTERED_LABELS } from "./common/options";
import { x_histogram, y_histogram, heatmap } from "./vega_specs/index"
import {
  prepareData,
  tooltipFormatter,
  winsorize,
  fixChartSizing,
  setFormatting,
  formatPointLegend,
  getPercentile,
  positionRefLine,
  formatCrossfilterSelection,
  positionLegend,
} from "./common/vega_utils";


export function scatterHist(
  data,
  element,
  config,
  queryResponse,
  details,
  done,
  that,
  embed
) {
  that.clearErrors();
  let { dataProperties, myData } = prepareData(data, queryResponse);
  const width = element.clientWidth;
  const height = element.clientHeight;
  const maxX = Math.max(...myData.map((e) => e[config["x"]]));
  const minX = Math.min(...myData.map((e) => e[config["x"]]));
  const maxY = Math.max(...myData.map((e) => e[config["y"]]));
  const minY = Math.min(...myData.map((e) => e[config["y"]]));
  const mainDimensions = queryResponse.fields.dimension_like.map((dim) =>
    dim.name.replace(".", "_")
  );
  const dynamicOptions = createOptions(
    queryResponse,
    baseOptions,
    config,
    maxX,
    maxY,
    mainDimensions[1] !== undefined
  )["options"];
  that.trigger("registerOptions", dynamicOptions);

  if (config["bin_type"] === "breakpoints") {
    that.addError({
      title: "Breakpoints Currently not supported for Scatter Histogram",
    });
  }

  if (
    dataProperties[config["x"]] == undefined ||
    dataProperties[config["y"]] == undefined
  ) {
    return;
  }
  const defaultValFormatX = dataProperties[config["x"]]["valueFormat"];
  const defaultValFormatY = dataProperties[config["y"]]["valueFormat"];
  const valFormatOverrideX = config["x_axis_value_format"];
  const valFormatOverrideY = config["y_axis_value_format"];

  let valFormatX =
    valFormatOverrideX !== "" ? valFormatOverrideX : defaultValFormatX;
  if (valFormatX === null || valFormatX === undefined) {
    valFormatX = "#,##0";
  }

  let valFormatY =
    valFormatOverrideY !== "" ? valFormatOverrideY : defaultValFormatY;
  if (valFormatY === null || valFormatY === undefined) {
    valFormatY = "#,##0";
  }

  let valFormatPoints;
  if (config["size"]) {
    const defaultValFormatPoints =
      dataProperties[config["size"]]["valueFormat"];
    const valFormatOverridePoints = config["points_legend_value_format"];
    valFormatPoints =
      valFormatOverridePoints !== ""
        ? valFormatOverridePoints
        : defaultValFormatPoints;
    if (valFormatPoints === null || valFormatPoints === undefined) {
      valFormatPoints = "#,##0";
    }
  }

  if (config["winsorization"]) {
    myData = winsorize(myData, config["x"], config["percentile"]);
    myData = winsorize(myData, config["y"], config["percentile"]);
  }

  // These tooltip fields are used for point labels
  const tooltipFields = [];
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
  tooltipFields.sort(
    (a, b) => order.indexOf(a["field"]) - order.indexOf(b["field"])
  );

  // Move dimensions to back of array
  for (let i = 0; i < queryResponse.fields.dimensions.length; i++) {
    tooltipFields.push(tooltipFields.shift());
  }

  var vegaChart = {
      $schema: "https://vega.github.io/schema/vega-lite/v4.json",
      selection: {
        grid: {
          type: "interval", 
          bind: "scales"
        },
      },
      data: {
        values: myData,
      },
      spacing: 15,
      bounds: "flush",
      vconcat: [
        x_histogram(dataProperties, config, maxX, width),
        {
          spacing: 15,
          bounds: "flush",
          hconcat: [
            {
              layer: [
                heatmap(dataProperties, config, maxX, maxY, height, width, valFormatX, valFormatY),
                y_histogram(dataProperties, config, maxY, height)
              ],
            },
          ],
        },
      ],
      config: {
        range: {
          heatmap: {
            scheme: config["color_scheme"],
          },
        },
      },
    }

  //SCATTERPLOT
  if (config["layer_points"]) {
    vegaChart.vconcat[1].hconcat[0].layer.push({
      name: "SCATTERPLOT",
      mark: {
        color: config["color_col"],
        cursor: "pointer",
        type: "circle",
        opacity: config["point_opacity"],
        zindex: 2,
        size: 100,
      },
      height: height,
      width: width,
      encoding: {
        tooltip: tooltipFields,
        x: {
          field: config["x"],
          type: "quantitative",
        },
        y: {
          field: config["y"],
          type: "quantitative",
        },
      },
    });
  }

  //SIZE POINTS
  if (
    config["layer_points"] &&
    config["size"] != "" &&
    typeof config["size"] != "undefined"
  ) {
    vegaChart.vconcat[1].hconcat[0].layer[1].encoding.size = {
      field: config["size"],
      type: "quantitative",
      title: dataProperties[config["size"]]["title"],
      legend: {
        orient: config["legend_orient"],
        format: "d",
        labelFontSize: config["legend_size"],
        titleFontWeight: "normal",
        titleFontSize: config["legend_size"],
        titleFont: FONT_TYPE,
        labelFont: FONT_TYPE,
        labelColor: "#696969",
        titleColor: "#696969",
      },
    };
  }

  // COLOR POINTS
  if (config["layer_points"] && mainDimensions[1] !== undefined) {
    vegaChart.vconcat[1].hconcat[0].layer[1].encoding.color = {
      scale: { scheme: config["point_group_colors"] },
      field: mainDimensions[1],
      legend: {
        zindex: 1,
        type: "symbol",
        offset: 100,
        title: dataProperties[mainDimensions[1]]["title"],
        type: "symbol",
        orient: config["legend_orient"],
        labelFontSize: config["legend_size"],
        titleFontWeight: "normal",
        titleFontSize: config["legend_size"],
        titleFont: FONT_TYPE,
        labelFont: FONT_TYPE,
        labelColor: "#696969",
        titleColor: "#696969",
      },
    };
  }
  if (config["layer_points"] && config["point_labels"]) {
    vegaChart.vconcat[1].hconcat[0].layer.push({
      mark: {
        type: "text",
        align: "left",
        angle: config["point_labels_angle"],
        dx: config["point_labels_x_offset"],
        dy: config["point_labels_y_offset"],
        fontSize: config["point_labels_font_size"],
      },
      encoding: {
        x: {
          field: config["x"],
          type: "quantitative",
        },
        y: {
          field: config["y"],
          type: "quantitative",
        },
        text: {
          field: dataProperties[FILTERED_LABELS]
            ? FILTERED_LABELS
            : mainDimensions[0],
        },
      },
    });
  }

  if (config["reference_line_x"]) {
    const percentileX = getPercentile(
      config["reference_line_x_p"],
      config["x"],
      myData
    );
    vegaChart.vconcat[1].hconcat[0].layer.push({
      name: "refLineX",
      mark: {
        type: "rule",
      },
      encoding: {
        x: { datum: percentileX },
        y: { datum: minY },
        x2: { datum: percentileX },
        y2: { datum: maxY },
        color: { value: "red" },
        size: { value: config["reference_line_x_width"] },
        strokeDash: { value: [4, 4] },
      },
    });
  }

  if (config["reference_line_y"]) {
    const percentileY = getPercentile(
      config["reference_line_y_p"],
      config["y"],
      myData
    );
    vegaChart.vconcat[1].hconcat[0].layer.push({
      name: "refLineY",
      mark: {
        type: "rule",
      },
      encoding: {
        x: { datum: minX },
        y: { datum: percentileY },
        x2: { datum: maxX },
        y2: { datum: percentileY },
        color: { value: "red" },
        size: { value: config["reference_line_y_width"] },
        strokeDash: { value: [4, 4] },
      },
    });
  }

  const runFormatting = () => {
    if (
      details.crossfilterEnabled &&
      details.crossfilters.length &&
      config["layer_points"]
    ) {
      formatCrossfilterSelection(
        details.crossfilters,
        mainDimensions,
        config["color_col"]
      );
    }
    setFormatting("scatter", valFormatX, valFormatY);
    if (config["size"] && config["layer_points"]) {
      formatPointLegend(
        valFormatPoints,
        mainDimensions[1] !== undefined,
        config["heatmap_off"]
      );
    }
    if (config["reference_line_x"]) {
      positionRefLine("x");
    }
    if (config["reference_line_y"]) {
      positionRefLine("y");
    }
  }

  debugger;
  embed("#my-vega", vegaChart, {
    actions: false,
    renderer: "svg",
    tooltip: { theme: "custom" },
  }).then(({ spec, view }) => {
    fixChartSizing();
    runFormatting();
    if (details.print) {
      done();
    }
    view.addEventListener("wheel", runFormatting);
    view.addEventListener("mousedown", runFormatting);
    view.addEventListener("mouseup", runFormatting);
    view.addEventListener("drag", runFormatting);
    view.addEventListener("mousemove", (event, item) => {
      tooltipFormatter(
        dataProperties,
        "binned",
        config,
        item,
        valFormatX,
        valFormatY,
        valFormatPoints
      );
    });
    if (mainDimensions[1] !== undefined && config["size"]) {
      positionLegend(config["legend_orient"]);
    }
    // DRILL SUPPORT
    view.addEventListener("click", function (event, item) {
      if (Object.keys(item.datum).length <= 1 || item.fillOpacity === 0) {
        return;
      }
      // only support crossfiltering for scatter points for now
      if (details.crossfilterEnabled && item.mark.marktype !== "rect") {
        // just taking first dimension for now -- can add more if needed
        let _row = {
          [dataProperties[mainDimensions[0]]["lookerName"]]: {
            value: item.datum[mainDimensions[0]],
          },
        };
        LookerCharts.Utils.toggleCrossfilter({
          row: _row,
          event: event,
        });
      } else {
        var links = item.datum.links;
        if (Object.keys(item.datum)[0].startsWith("bin_")) {
          let fields = [];
          for (let field of queryResponse.fields.dimension_like.concat(
            queryResponse.fields.measure_like
          )) {
            fields.push(field.name);
          }

          // Pull original Looker references from dataProperties
          const aggFieldX = dataProperties[config["x"]]["lookerName"];
          const aggFieldY = dataProperties[config["y"]]["lookerName"];
          const boundsX = Object.keys(item.datum).filter((ele) =>
            ele.includes(config["x"])
          );
          const boundsY = Object.keys(item.datum).filter((ele) =>
            ele.includes(config["y"])
          );

          // Base URL points to all fields in queryResponse
          let baseURL = myData[0].links;
          if (baseURL.length < 1) {
            links = [];
          } else {
            baseURL = baseURL
              .filter((ele) => ele.url.includes("/explore/"))[0]
              .url.split("?")[0];
            let url = `${baseURL}?fields=${fields.join(",")}`;
            // Apply appropriate filtering based on bounds
            if (boundsX.length > 0) {
              url += `&f[${aggFieldX}]=[${item.datum[boundsX[0]]}, ${
                item.datum[boundsX[1]]
              })`;
            }
            if (boundsY.length > 0) {
              url += `&f[${aggFieldY}]=[${item.datum[boundsY[0]]}, ${
                item.datum[boundsY[1]]
              })`;
            }
            //Inherit filtering
            if (queryResponse.applied_filters !== undefined) {
              let filters = queryResponse.applied_filters;
              for (let filter in filters) {
                url += `&f[${filters[filter].field.name}]=${filters[filter].value}`;
              }
            }
            links = [
              {
                label: `Show ${item.datum.__count} Records`,
                type: "drill",
                type_label: "Drill into Records",
                url: url,
              },
            ];
          }
        }
        LookerCharts.Utils.openDrillMenu({
          links: links,
          event: event,
        });
      }
    });
  });
}
