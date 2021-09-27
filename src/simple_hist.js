import { baseOptions } from "./common/options";
import { fixChartSizing, setAxisFormatting, FONT_TYPE } from "./common/utils/vega_utils";
import { winsorize, prepareData, makeBins } from "./common/utils/data";
import { simpleHistTooltipHandler, simpleTooltipFormatter } from "./common/utils/tooltip";

export function simpleHist(
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
  const vegaSafeNameMes = queryResponse.fields.measure_like[0].name.replace(".", "_");
  const vegaSafeNameDim = queryResponse.fields.dimensions[0].name.replace(".", "_");
  const max = Math.max(...myData.map((e) => e[vegaSafeNameMes]));

  //Need to reassign some options when toggling from scatter to simple hist
  const options = Object.assign({}, baseOptions);
  if (options["bin_type"]["values"].length < 3) {
    let len = options["bin_type"]["values"].length
    options["bin_type"]["values"][len] = { Breakpoints: "breakpoints" }
  }
  if (config["bin_type"] === "bins") {
    options["max_bins"] = {
      label: "Max number of Bins",
      section: "  Values",
      type: "string",
      order: 4,
      display: "text",
      default: "10",
    };
  } else if (config["bin_type"] === "steps") {
    options["step_size"] = {
      label: "Step Size",
      section: "  Values",
      type: "number",
      order: 4,
      default: Math.floor(max / 10),
    };
  } else {
    options["breakpoint_array"] = {
      label: "Breakpoints",
      section: "  Values",
      order: 4,
      type: "string",
      default: `min, ${Math.floor(max / 5)}, ${Math.floor(max / 4)}, ${Math.floor(
        max / 3
      )}, ${Math.floor(max / 2)}, max`,
    };
    options["breakpoint_ordinal"] = {
      label: "Use Equal Sized Columns (Ordinal Bins)",
      order: 4,
      section: "  Values",
      type: "boolean",
      display: "select",
      default: false,
    };
  }
  if (config["winsorization"]) {
    options["percentile"] = {
      label: "Percentiles",
      section: "  Values",
      type: "string",
      order: 7,
      display: "select",
      display_size: "half",
      default: "1_99",
      values: [{ "1% - 99%": "1_99" }, { "5% - 95%": "5_95" }],
    };
  }
  that.trigger("registerOptions", options);

  if (config["winsorization"]) {
    myData = winsorize(myData, vegaSafeNameMes, config["percentile"]);
  }

  const defaultValFormat = dataProperties[vegaSafeNameMes]["valueFormat"];
  const valFormatOverride = config["x_axis_value_format"];

  let valFormat = valFormatOverride !== "" ? valFormatOverride : defaultValFormat;
  if (valFormat === null || valFormat === undefined) {
    valFormat = "#,##0";
  }

  let preBin = [];
  if (config["bin_type"] === "breakpoints") {
    preBin = makeBins(
      myData,
      vegaSafeNameMes,
      config["breakpoint_array"],
      valFormat,
      "x"
    );
  }

  const vegaChart = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    config: { view: { stroke: "transparent" } },
    data: {
      values: config["bin_type"] === "breakpoints" ? preBin : myData,
    },
    width: element.clientWidth * 0.9,
    height: element.clientHeight * 0.8,
    padding: 20,
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
    encoding: {
      x: {
        type: config["breakpoint_ordinal"] ? "ordinal" : "quantitative",
        ...(config["breakpoint_ordinal"] && { sort: ["order"] }),
        ...(!config["breakpoint_ordinal"] && {
          bin: {
            ...(config["bin_type"] === "bins" && {
              maxbins: config["max_bins"],
            }),
            ...(config["bin_type"] === "steps" && {
              step:
                config["step_size"] <= Math.floor(max / 200)
                  ? Math.floor(max / 200)
                  : config["step_size"],
            }),
            ...(config["bin_type"] === "breakpoints" && { binned: true }),
          },
        }),
        field:
          config["bin_type"] === "breakpoints"
            ? config["breakpoint_ordinal"]
              ? "label"
              : "bin_start_x"
            : vegaSafeNameMes,
        axis: {
          title:
            config["x_axis_override"] === ""
              ? dataProperties[vegaSafeNameMes]["title"]
              : config["x_axis_override"],
          titleFontSize: config["x_axis_title_font_size"],
          labelFontSize: config["x_axis_label_font_size"],
          labelAngle: config["x_axis_label_angle"] * -1,
          format: "d",
          grid: config["x_grids"],
          titleFontWeight: "normal",
          titleFont: FONT_TYPE, //config['font_type'],
          labelFont: FONT_TYPE, //config['font_type'],
          labelSeparation: 100 - config["x_label_separation"],
          labelOverlap: true,
          labelColor: "#696969",
          titleColor: "#696969",
          titlePadding: 25, //config['x_axis_title_padding']
        },
      },
      ...(config["bin_type"] === "breakpoints" &&
        config["breakpoint_ordinal"] === false && {
          x2: { field: "bin_end_x" },
        }),
      y: {
        type: "quantitative",
        ...(config["bin_type"] !== "breakpoints" && { aggregate: "count" }),
        ...(config["bin_type"] === "breakpoints" && { field: "count_x" }),
        axis: {
          title:
            config["y_axis_override"] === ""
              ? `Count of ${dataProperties[vegaSafeNameDim]["title"]}`
              : config["y_axis_override"],
          titleFontSize: config["y_axis_title_font_size"],
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
          titlePadding: 25, //config['y_axis_title_padding']
        },
      },
      color: {
        condition: { selection: "highlight", value: config["color_on_hover"] },
        value: config["color_col"],
      },
      tooltip: simpleHistTooltipHandler(
        dataProperties[vegaSafeNameMes],
        config["x_axis_override"],
        {
          ...(config["bin_type"] === "bins" && { maxbins: config["max_bins"] }),
          ...(config["bin_type"] === "steps" && { step: config["step_size"] }),
          ...(config["bin_type"] === "breakpoints" && { binned: true }),
        }
      ),
    },
  };

  embed("#my-vega", vegaChart, {
    actions: false,
    renderer: "svg",
    tooltip: { theme: "custom" },
  }).then(({ spec, view }) => {
    fixChartSizing();
    setAxisFormatting(config, "simple", valFormat);
    if (details.print) {
      done();
      return;
    }

    view.addEventListener("mousemove", (event, item) => {
      simpleTooltipFormatter(dataProperties, config, vegaSafeNameMes, item, valFormat);
    });

    //DRILL SUPPORT
    view.addEventListener("click", function (event, item) {
      if (item.datum === undefined) {
        return;
      }
      const aggField = dataProperties[vegaSafeNameMes]["lookerName"];
      const bounds =
        config["bin_type"] === "breakpoints"
          ? ["bin_start_x", "bin_end_x"]
          : Object.keys(item.datum).filter((ele) => ele.includes(vegaSafeNameMes));

      let links = item.datum.links;
      let baseURL = myData[0].links;
      let fields = [];
      for (let field of queryResponse.fields.dimension_like.concat(
        queryResponse.fields.measure_like
      )) {
        fields.push(field.name);
      }
      // Base URL points to all fields in queryResponse
      if (baseURL.length < 1) {
        links = [];
      } else {
        baseURL = baseURL
          .filter((ele) => ele.url.includes("/explore/"))[0]
          .url.split("?")[0];
        let url = `${baseURL}?fields=${fields.join(",")}`;

        // Apply appropriate filtering based on bounds
        url += `&f[${aggField}]=[${item.datum[bounds[0]]}, ${item.datum[bounds[1]]})`;

        //Inherit query filters
        if (queryResponse.applied_filters !== undefined) {
          let filters = queryResponse.applied_filters;
          for (let filter in filters) {
            url += `&f[${filters[filter].field.name}]=${filters[filter].value}`;
          }
        }
        links = [
          {
            label: `Show ${
              config["bin_type"] === "breakpoints"
                ? item.datum.count_x
                : item.datum.__count
            } Records`,
            type: "drill",
            type_label: "Drill into Records",
            url: url,
          },
        ];
      }
      LookerCharts.Utils.openDrillMenu({
        links: links,
        event: event,
      });
    });
  });
}
