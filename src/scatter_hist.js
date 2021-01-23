import { isEqual } from "vega-lite";
import { baseOptions, createOptions } from "./common/options";
import {
  prepareData,
  tooltipFormatter,
  binnedTooltipHandler,
  winsorize,
  fixChartSizing,
  setFormatting,
  formatPointLegend,
  getPercentile,
  positionRefLine,
} from "./common/vega_utils";

const FONT_TYPE =
  "'Roboto', 'Noto Sans JP', 'Noto Sans CJK KR', 'Noto Sans Arabic UI', 'Noto Sans Devanagari UI', 'Noto Sans Hebre', 'Noto Sans Thai UI', 'Helvetica', 'Arial', sans-serif";
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
    maxY
  )["options"];
  that.trigger("registerOptions", Object.assign(baseOptions, dynamicOptions));

  if (config["bin_type"] === "breakpoints") {
    that.addError({
      title: "Breakpoints Currently not supported for Scatter Histogram",
    });
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

  let preBin = [];
  //Breakpoints not currently supported for scatted histogram
  // if(config['bin_type'] === 'breakpoints'){
  //   preBin = makeBins(myData, config['x'], config['breakpointsX'], formatX, 'x')
  //   preBin = preBin.concat(makeBins(myData, config['y'], config['breakpointsY'], formatY, 'y'))
  // }
  // if(true) {
  //   let x = makeMedianBins(myData, 'x', config['x'], valFormatX)
  //   let y = makeMedianBins(myData, 'y', config['y'], valFormatY)
  //   preBin = x.concat(y).concat(myData)
  // }

  // These tooltip fields are used for point labels
  const tooltipFields = [];
  for (let datum in dataProperties) {
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
          // case config['size']: return (
          //   config['points_legend_value_format'] !== "" ? config['points_legend_value_format'] : dataProperties[datum]['title']
          // )
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
  for (let i = 0; i < queryResponse.fields.dimension_like.length; i++) {
    tooltipFields.push(tooltipFields.shift());
  }

  //X HISTOGRAM
  var vegaChart = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    data: {
      values: myData,
    },
    spacing: 15,
    bounds: "flush",
    vconcat: [
      {
        selection: {
          highlight: {
            type: "single",
            empty: "none",
            on: "mouseover",
          },
        },
        mark: {
          type: "bar",
          cursor: "pointer",
        },
        height: 60,
        width: width,
        encoding: {
          x: {
            bin: {
              ...(config.bin_type === "bins" && {
                maxbins: config["max_bins"],
              }),
              ...(config.bin_type === "steps" && {
                step:
                  config["num_step_x"] <= Math.floor(maxX / 200)
                    ? Math.floor(maxX / 200)
                    : config["num_step_x"],
              }),
              ...(config.bin_type === "breakpoints" && { binned: true }),
            },
            field:
              config.bin_type === "breakpoints" ? "bin_start_x" : config["x"],
            type: "quantitative",
            axis: {
              grid: config["x_grids"],
              title: null,
              labels: false,
              ticks: false,
            },
          },
          ...(config["bin_type"] === "breakpoints" && {
            x2: { field: "bin_end_x" },
          }),
          y: {
            ...(config["bin_type"] !== "breakpoints" && { aggregate: "count" }),
            ...(config["bin_type"] === "breakpoints" && { field: "count_x" }),
            type: "quantitative",
            title: "",
            axis: {
              labelColor: "#696969",
              titleColor: "#696969",
              grid: config["y_grids"],
            },
          },
          tooltip: binnedTooltipHandler(
            dataProperties[config["x"]],
            config["x_axis_override"],
            {
              ...(config.bin_type === "bins" && {
                maxbins: config["max_bins"],
              }),
              ...(config.bin_type === "steps" && {
                step:
                  config["num_step_x"] <= Math.floor(maxX / 200)
                    ? Math.floor(maxX / 200)
                    : config["num_step_x"],
              }),
              ...(config.bin_type === "breakpoints" && { binned: true }),
            }
          ),
          color: {
            condition: {
              selection: "highlight",
              value: config["color_on_hover"],
            },
            value: config["color_col"],
          },
        },
      },
      //HEATMAP
      {
        spacing: 15,
        bounds: "flush",
        hconcat: [
          {
            layer: [
              {
                selection: {
                  highlight: {
                    type: "single",
                    empty: "none",
                    on: "mouseover",
                  },
                },
                mark: {
                  zindex: -1,
                  type: "rect",
                  invalid: null,
                  ...(config["heatmap_off"] && { cursor: "pointer" }),
                  ...(!config["heatmap_off"] && { fillOpacity: 0.0 }),
                },
                height: height,
                width: width,
                encoding: {
                  x: {
                    bin: {
                      ...(config.bin_type === "bins" && {
                        maxbins: config["max_bins"],
                      }),
                      ...(config.bin_type === "steps" && {
                        step:
                          config["num_step_x"] <= Math.floor(maxX / 200)
                            ? Math.floor(maxX / 200)
                            : config["num_step_x"],
                      }),
                      ...(config.bin_type === "breakpoints" && {
                        binned: true,
                      }),
                    },
                    field:
                      config["bin_type"] === "breakpoints"
                        ? "bin_start_x"
                        : config["x"],
                    type: "quantitative",
                    axis: {
                      title:
                        config["x_axis_override"] === ""
                          ? dataProperties[config["x"]]["title"]
                          : config["x_axis_override"],
                      titleFontSize: config["x_axis_title_font_size"],
                      format: "d",
                      labelFontSize: config["x_axis_label_font_size"],
                      grid: config["x_grids"],
                      titleFontWeight: "normal",
                      titleFont: FONT_TYPE, //config['font_type'],
                      labelFont: FONT_TYPE, //config['font_type'],
                      labelSeparation: 100 - config["x_label_separation"],
                      labelOverlap: true,
                      labelColor: "#696969",
                      labelAngle: config["x_axis_label_angle"] * -1,
                      titleColor: "#696969",
                      titlePadding: 25 + valFormatX.length, //config['x_axis_title_padding']
                    },
                  },
                  ...(config["bin_type"] === "breakpoints" && {
                    x2: { field: "bin_end_x" },
                  }),
                  y: {
                    bin: {
                      ...(config.bin_type === "bins" && {
                        maxbins: config["max_bins"],
                      }),
                      ...(config.bin_type === "steps" && {
                        step:
                          config["num_step_y"] <= Math.floor(maxY / 200)
                            ? Math.floor(maxY / 200)
                            : config["num_step_y"],
                      }),
                      ...(config.bin_type === "breakpoints" && {
                        binned: true,
                      }),
                    },
                    field:
                      config["bin_type"] === "breakpoints"
                        ? "bin_start_y"
                        : config["y"],
                    type: "quantitative",
                    axis: {
                      title:
                        config["y_axis_override"] === ""
                          ? dataProperties[config["y"]]["title"]
                          : config["y_axis_override"],
                      titleFontSize: config["y_axis_title_font_size"],
                      format: "d",
                      labelFontSize: config["y_axis_label_font_size"],
                      labelAngle: config["y_axis_label_angle"] * -1,
                      grid: config["y_grids"],
                      titleFontWeight: "normal",
                      titleFont: FONT_TYPE, //config['font_type'],
                      labelFont: FONT_TYPE, //config['font_type'],
                      labelSeparation: 100 - config["y_label_separation"],
                      labelOverlap: true,
                      labelColor: "#696969",
                      titleColor: "#696969",
                      titlePadding: 25 + valFormatY.length * 3, //config['y_axis_title_padding']
                    },
                  },
                  ...(config["bin_type"] === "breakpoints" && {
                    y2: { field: "bin_end_y" },
                  }),
                  color: {
                    aggregate: "count",
                    type: "quantitative",
                    legend: !config["heatmap_off"]
                      ? false
                      : {
                          orient: config["legend_orient"],
                          labelFontSize: config["legend_size"],
                          titleFontSize: config["legend_size"],
                          titleFontWeight: "normal",
                          titleFont: FONT_TYPE, //config['font_type'],
                          labelFont: FONT_TYPE, //config['font_type'],
                          labelColor: "#696969",
                          titleColor: "#696969",
                        },
                  },
                  opacity: {
                    condition: { selection: "highlight", value: 1 },
                    value: config["heatmap_opacity"],
                  },
                  ...(config["heatmap_off"] && {
                    tooltip: (() => {
                      let arr = binnedTooltipHandler(
                        dataProperties[config["x"]],
                        config["x_axis_override"],
                        {
                          ...(config.bin_type === "bins" && {
                            maxbins: config["max_bins"],
                          }),
                          ...(config.bin_type === "steps" && {
                            step:
                              config["num_step_x"] <= Math.floor(maxX / 200)
                                ? Math.floor(maxX / 200)
                                : config["num_step_x"],
                          }),
                          ...(config.bin_type === "breakpoints" && {
                            binned: true,
                          }),
                        }
                      ).concat(
                        binnedTooltipHandler(
                          dataProperties[config["y"]],
                          config["y_axis_override"],
                          {
                            ...(config.bin_type === "bins" && {
                              maxbins: config["max_bins"],
                            }),
                            ...(config.bin_type === "steps" && {
                              step:
                                config["num_step_y"] <= Math.floor(maxY / 200)
                                  ? Math.floor(maxY / 200)
                                  : config["num_step_y"],
                            }),
                            ...(config.bin_type === "breakpoints" && {
                              binned: true,
                            }),
                          }
                        )
                      );
                      arr = arr.concat(arr.splice(1, 1));
                      return arr;
                    })(),
                  }),
                },
              },
            ],
          },
          // Y HISTOGRAM
          {
            mark: {
              type: "bar",
              cursor: "pointer",
            },
            selection: {
              highlight: {
                type: "single",
                empty: "none",
                on: "mouseover",
              },
            },
            width: 60,
            height: height,
            encoding: {
              y: {
                bin: {
                  ...(config.bin_type === "bins" && {
                    maxbins: config["max_bins"],
                  }),
                  ...(config.bin_type === "steps" && {
                    step:
                      config["num_step_y"] <= Math.floor(maxY / 200)
                        ? Math.floor(maxY / 200)
                        : config["num_step_y"],
                  }),
                  ...(config.bin_type === "breakpoints" && { binned: true }),
                },
                field:
                  config["bin_type"] === "breakpoints"
                    ? "bin_start_y"
                    : config["y"],
                type: "quantitative",
                axis: {
                  grid: config["y_grids"],
                  title: null,
                  labels: false,
                  ticks: false,
                },
              },
              ...(config["bin_type"] === "breakpoints" && {
                y2: { field: "bin_end_y" },
              }),
              x: {
                ...(config["bin_type"] !== "breakpoints" && {
                  aggregate: "count",
                }),
                ...(config["bin_type"] === "breakpoints" && {
                  field: "count_y",
                }),
                type: "quantitative",
                title: "",
                axis: {
                  labelColor: "#696969",
                  titleColor: "#696969",
                  grid: config["x_grids"],
                  title: null,
                },
              },
              tooltip: binnedTooltipHandler(
                dataProperties[config["y"]],
                config["y_axis_override"],
                {
                  ...(config.bin_type === "bins" && {
                    maxbins: config["max_bins"],
                  }),
                  ...(config.bin_type === "steps" && {
                    step:
                      config["num_step_y"] <= Math.floor(maxY / 200)
                        ? Math.floor(maxY / 200)
                        : config["num_step_y"],
                  }),
                  ...(config.bin_type === "breakpoints" && { binned: true }),
                }
              ),
              color: {
                condition: {
                  selection: "highlight",
                  value: config["color_on_hover"],
                },
                value: config["color_col"],
              },
            },
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
  };

  //SCATTERPLOT
  if (config["layer_points"]) {
    vegaChart.vconcat[1].hconcat[0].layer.push({
      mark: {
        cursor: "pointer",
        type: "circle",
        color: config["color_col"],
        opacity: config["point_opacity"],
        zindex: 2,
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

    if (config["point_labels"]) {
      vegaChart.vconcat[1].hconcat[0].layer.push({
        mark: {
          type: "text",
          align: "left",
          angle: config["point_labels_angle"],
          dx: config["point_labels_x_offset"],
          dy: config["point_labels_y_offset"],
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
          text: { field: mainDimensions[0] },
        },
      });
    }

    //SIZE POINTS
    if (config["size"] != "" && typeof config["size"] != "undefined") {
      vegaChart.vconcat[1].hconcat[0].layer[1].encoding.size = {
        field: config["size"],
        type: "quantitative",
        title: dataProperties[config["size"]]["title"],
        legend: {
          type: "symbol",
          orient: config["legend_orient"],
          format: "d",
          labelFontSize: config["legend_size"],
          titleFontWeight: "normal",
          titleFontSize: config["legend_size"],
          titleFont: FONT_TYPE, //config['font_type'],
          labelFont: FONT_TYPE, //config['font_type'],
          labelColor: "#696969",
          titleColor: "#696969",
        },
      };
    }
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

  embed("#my-vega", vegaChart, { actions: false, renderer: "svg" }).then(
    ({ spec, view }) => {
      fixChartSizing();
      setFormatting("scatter", valFormatX, valFormatY);
      if (config["size"] && config["layer_points"]) {
        formatPointLegend(valFormatPoints);
      }
      if (config["reference_line_x"]) {
        positionRefLine("x");
      }
      if (config["reference_line_y"]) {
        positionRefLine("y");
      }
      if (details.print) {
        done();
      }

      view.addEventListener("mousemove", (event, item) => {
        tooltipFormatter(
          "binned",
          config,
          item,
          valFormatX,
          valFormatY,
          valFormatPoints,
          dataProperties
        );
      });

      // DRILL SUPPORT
      view.addEventListener("click", function (event, item) {
        if (details.crossfilterEnabled && Object.keys(item.datum).length > 1) {
          let row = {};
          for (let dim of mainDimensions) {
            row[dataProperties[dim]["lookerName"]] = { value: item.datum[dim] };
          }
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
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
    }
  );
}
