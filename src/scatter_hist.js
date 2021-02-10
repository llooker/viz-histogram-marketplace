import getChart from "./vega_specs/index";
import { prepareData, winsorize } from "./common/utils/data";
import { fixChartSizing, positionLegend, runFormatting } from "./common/utils/vega_utils";
import { tooltipFormatter, getScatterTooltipFields } from "./common/utils/tooltip";
import { baseOptions, createOptions } from "./common/options";

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

  let valFormatX = valFormatOverrideX !== "" ? valFormatOverrideX : defaultValFormatX;
  if (valFormatX === null || valFormatX === undefined) {
    valFormatX = "#,##0";
  }

  let valFormatY = valFormatOverrideY !== "" ? valFormatOverrideY : defaultValFormatY;
  if (valFormatY === null || valFormatY === undefined) {
    valFormatY = "#,##0";
  }

  let valFormatPoints;
  if (config["size"]) {
    const defaultValFormatPoints = dataProperties[config["size"]]["valueFormat"];
    const valFormatOverridePoints = config["points_legend_value_format"];
    valFormatPoints =
      valFormatOverridePoints !== "" ? valFormatOverridePoints : defaultValFormatPoints;
    if (valFormatPoints === null || valFormatPoints === undefined) {
      valFormatPoints = "#,##0";
    }
  }

  if (config["winsorization"]) {
    myData = winsorize(myData, config["x"], config["percentile"]);
    myData = winsorize(myData, config["y"], config["percentile"]);
  }

  const tooltipFields = getScatterTooltipFields(dataProperties, queryResponse, config);
  var vegaChart = {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    data: {
      values: myData,
    },
    spacing: 15,
    bounds: "flush",
    ...getChart({
      data: myData,
      dataProperties,
      config,
      maxX,
      minX,
      maxY,
      minY,
      height,
      width,
      valFormatX,
      valFormatY,
      tooltipFields,
      mainDimensions,
    }),
  };

  const formatChart = () => {
    runFormatting(
      details,
      config,
      mainDimensions,
      valFormatX,
      valFormatY,
      valFormatPoints
    );
  };

  embed("#my-vega", vegaChart, {
    actions: false,
    renderer: "svg",
    tooltip: { theme: "custom" },
  }).then(({ spec, view }) => {
    fixChartSizing();
    formatChart();
    if (details.print) {
      done();
      return;
    }

    view.addEventListener("wheel", formatChart, {passive: true});
    view.addEventListener("mousedown", formatChart, {passive: true});
    view.addEventListener("mouseup", formatChart, {passive: true});
    view.addEventListener("drag", formatChart, {passive: true});

    view.addEventListener("mousemove", (event, item) => {
      tooltipFormatter(
        dataProperties,
        config,
        item,
        valFormatX,
        valFormatY,
        valFormatPoints
      );
    });

    if (
      mainDimensions[1] !== undefined &&
      config["size"] &&
      (config["x_hist"] || config["y_hist"])
    ) {
      positionLegend(config["legend_orient"]);
    }

    // DRILL SUPPORT
    view.addEventListener("click", function (event, item) {
      if (item === undefined || item.datum === undefined || Object.keys(item.datum).length <= 1 || item.fillOpacity === 0) {
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
