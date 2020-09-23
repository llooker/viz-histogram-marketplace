import embed from 'vega-embed'
import { 
  prepareData,
  tooltipFormatter,
  binnedTooltipHandler,
  winsorize,
  makeBins, fixChartSizing
} from './common/vega_utils'
import { baseOptions, createOptions } from './common/options'

export function binnedHist(data, element, config, queryResponse, details, done, that) {
  that.clearErrors();

  let { dataProperties, myData } = prepareData(data, queryResponse);
  const width = element.clientWidth;
  const height = element.clientHeight;
  const maxX = Math.max(...myData.map(e => e[config['x']]))
  const maxY = Math.max(...myData.map(e => e[config['y']]))
  const dynamicOptions = createOptions(queryResponse, baseOptions, config, maxX, maxY)['options'];
  that.trigger('registerOptions', dynamicOptions);

  if(config['winsorization']){
    myData = winsorize(myData, config['x'], config['percentile']);
    myData = winsorize(myData, config['y'], config['percentile']);
  }

  const formatX = tooltipFormatter(dataProperties[config['x']])
  const formatY = tooltipFormatter(dataProperties[config['y']])
   
  let preBin = []
  if(config['bin_type'] === 'breakpoints'){
    preBin = makeBins(myData, config['x'], config['breakpointsX'], formatX, 'x')
    preBin = preBin.concat(makeBins(myData, config['y'], config['breakpointsY'], formatY, 'y'))
  }


  const tooltipFields = [];
  for (let datum in dataProperties) {
    let tip = {};
    tip['field'] = datum;
    tip['type'] = dataProperties[datum]['dtype'];
    tip['format'] = tooltipFormatter(dataProperties[datum])
    tip['title'] = dataProperties[datum]['title'];
    tooltipFields.push(tip);
  }

  //TOP HIST
  var vegaChart = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "renderer": "svg",
    "data": {
      "values": config['bin_type'] === 'breakpoints' ? preBin : myData
    },
    "spacing": 15,
    "bounds": "flush",
    "vconcat": [{
      "selection": {
        "highlight": {
          "type": "single",
          "empty": "none",
          "on": "mouseover"
        },
      },
      "mark": {
        "type":"bar",
        "cursor": "pointer"
      },
      "height": 60, 
      "width": width,
      "encoding": {
        "x": {
          "bin": {
            ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
            ...(config.bin_type === 'steps' && {'step': config['num_step_x']}),
            ...(config.bin_type === 'breakpoints' && {'binned' : true})
          },
          "field": config.bin_type === 'breakpoints' ? 'bin_start_x' : config['x'],
          "type": "quantitative",
          "axis": null
        },
        ...(config['bin_type'] === 'breakpoints' && {'x2': {"field": "bin_end_x"}}),
        "y": {
          ...(config['bin_type'] !== 'breakpoints' && {'aggregate': 'count'}),
          ...(config['bin_type'] === 'breakpoints' && {'field': 'count_x'}),
          "type": "quantitative",
          "title": ""
        },
        "tooltip": binnedTooltipHandler(dataProperties[config['x']], {
          ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
          ...(config.bin_type === 'steps' && {'step': config['num_step_x']}),
          ...(config.bin_type === 'breakpoints' && {'binned' : true})
        }),
        "color": {
          "condition": {"selection": "highlight", "value": config['color_on_hover']},
          "value": config['color_col'],
        }
      },
    }, 
    //HEATMAP
    {
      "spacing": 15,
      "bounds": "flush",
      "hconcat": [{
        "layer": [{
          "selection": {
            "highlight": {
              "type": "single",
              "empty": "none",
              "on": "mouseover"
            },
          },
          "mark": {
            "zindex": -1,
            "type":"rect",
            "invalid": null,
            ...(config['heatmap_off'] && {"cursor": "pointer"}),
            ...(!config['heatmap_off'] && {"fillOpacity": 0.0})
          },
          "height" : height,
          "width": width,
          "encoding": {
            "x": {
              "bin": {
                ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
                ...(config.bin_type === 'steps' && {'step': config['num_step_x']}),
                ...(config.bin_type === 'breakpoints' && {'binned' : true})
              },
              "field": config['bin_type'] === 'breakpoints' ? 'bin_start_x' : config['x'],
              "type": "quantitative",
              "axis": { 
                  "title": config['x_axis_override'] === "" ? dataProperties[config['x']]['title'] : config['x_axis_override'], 
                  "titleFontSize" : config['x_axis_title_font_size'],
                  "format": tooltipFormatter(dataProperties[config['x']]),
                  "labelFontSize": config['x_axis_label_font_size'],
                  "grid": config['x_grids'],
                  "titleFontWeight": "normal",
                  "titleFont": "Google Sans",
                  "labelFont": "Google Sans",
                  "titlePadding": 15
                }
            },
            ...(config['bin_type'] === 'breakpoints' && {'x2': {"field": "bin_end_x"}}),
            "y": {
              "bin": {
                ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
                ...(config.bin_type === 'steps' && {'step': config['num_step_y']}),
                ...(config.bin_type === 'breakpoints' && {'binned': true})
              },
              "field": config['bin_type'] === 'breakpoints' ? 'bin_start_y' : config['y'],
              "type": "quantitative",
              "axis": {
                  "title": config['y_axis_override'] === "" ? dataProperties[config['y']]['title'] : config['y_axis_override'],
                  "titleFontSize": config['y_axis_title_font_size'],
                  "format": tooltipFormatter(dataProperties[config['y']]),
                  "labelFontSize": config['y_axis_label_font_size'],
                  "grid": config['y_grids'],
                  "titleFontWeight": "normal",
                  "titleFont": "Google Sans",
                  "labelFont": "Google Sans",
                  "titlePadding": 15
                },
              },
              ...(config['bin_type'] === 'breakpoints' && {'y2': {"field": "bin_end_y"}}),
            "color": {
              //"field": "total_count",
              "aggregate": "count",
              "type": "quantitative",
              "legend": !config['heatmap_off'] ? false : { 
                "orient": config['legend_orient'],
                "labelFontSize": config['legend_size'],
                "titleFontSize": config['legend_size'],
                "titleFont": "Google Sans",
                "labelFont": "Google Sans"
              }
            },
            "opacity": {
              "condition": {"selection": "highlight", "value": 1},
              "value": config['heatmap_opacity'],
            },
            ...(config['heatmap_off'] && { "tooltip": (() => {
              let arr = binnedTooltipHandler(
                dataProperties[config['x']], {
                  ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
                  ...(config.bin_type === 'steps' && {'step': config['num_step_x']}),
                  ...(config.bin_type === 'breakpoints' && {'binned' : true})
                }
                ).concat(
                  binnedTooltipHandler(dataProperties[config['y']],{
                ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
                ...(config.bin_type === 'steps' && {'step': config['num_step_x']}),
                ...(config.bin_type === 'breakpoints' && {'binned' : true})
              }));
              arr = arr.concat(arr.splice(1, 1));
              return arr;
            })()})
          },           
        }]
      }, {
        "mark": {
          "type":"bar",
          "cursor": "pointer"
        },
        "selection": {
          "highlight": {
            "type": "single",
            "empty": "none",
            "on": "mouseover"
          }
        },
        "width": 60,
        "height" : height,
        "encoding": {
          "y": {
            "bin": {
              ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
              ...(config.bin_type === 'steps' && {'step': config['num_step_y']}),
              ...(config.bin_type === 'breakpoints' && {'binned': true})
            },
            "field": config['bin_type'] === 'breakpoints' ? 'bin_start_y' : config['y'],
            "type": "quantitative",
            "axis": null
          },
          ...(config['bin_type'] === 'breakpoints' && {'y2': {"field": "bin_end_y"}}),
          "x": {
            ...(config['bin_type'] !== 'breakpoints' && {"aggregate": "count"}),
            ...(config['bin_type'] === 'breakpoints' && {"field": "count_y"}),
            "type": "quantitative",
            "title": ""
          },
          "tooltip": binnedTooltipHandler(dataProperties[config['y']], {
            ...(config.bin_type === 'bins' && {'maxbins': config['max_bins']}),
            ...(config.bin_type === 'steps' && {'step': config['num_step_y']}),
            ...(config.bin_type === 'breakpoints' && {'binned': true})
          }),
          "color": {
            "condition": {"selection": "highlight", "value": config['color_on_hover']},
            "value": config['color_col'],
          },
        }
      }]
    }],
    "config": {
      "range": {
        "heatmap": {
          "scheme": config['color_scheme']
        }
      },
    }
  }

    //adds scatterplot
  if (config['layer_points']) {
    vegaChart.vconcat[1].hconcat[0].layer[1] = {
          "mark": {
            "cursor": "pointer",
            "type":"circle",
            "color": config['color_col'],
            "opacity": config['point_opacity'],
            "zindex": 2
          },
          "height": height,
          "width": width,
          "encoding": {
            "tooltip":tooltipFields,
            "x": {
              "field": config['x'],
              "type": "quantitative"
            },
            "y": {
              "field": config['y'],
              "type": "quantitative"
            },
          }            
        };

          
    if (config['size'] != "" && typeof config['size'] != "undefined") {
      vegaChart.vconcat[1].hconcat[0].layer[1].encoding.size = {
        "field": config['size'], 
        "type":"quantitative", 
        "title":dataProperties[config['size']]['title'],
        "legend": { 
          "type": "symbol",
          "orient": config['legend_orient'],
          "format": tooltipFormatter(dataProperties[config['size']]),
          "labelFontSize": config['legend_size'],
          "titleFontSize": config['legend_size'],
          "titleFont": "Google Sans",
          "labelFont": "Google Sans"
        },
      };
    }
  }

  embed("#my-vega", vegaChart, {actions: false, renderer: "svg"}).then(({spec, view}) => {
    fixChartSizing();
    if(details.print){ done(); }
    view.addEventListener('click', function (event, item) {
      var links = item.datum.links
      if (Object.keys(item.datum)[0].startsWith('bin_')) {
        let fields = []
        for(let field of queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like)) {
          fields.push(field.name)
        }
        
        // Pull original Looker references from dataProperties
        const aggFieldX = dataProperties[config['x']]['lookerName']
        const aggFieldY = dataProperties[config['y']]['lookerName']
        const boundsX = Object.keys(item.datum).filter(ele => ele.includes(config['x']))
        const boundsY = Object.keys(item.datum).filter(ele => ele.includes(config['y']))
        
        // Base URL points to all fields in queryResponse
        let baseURL = myData[0].links
        if(baseURL.length < 1) { 
          links = [] 
        } else {
          baseURL = baseURL.filter(ele => ele.url.includes('/explore/'))[0].url.split('?')[0]
          let url = `${baseURL}?fields=${fields.join(',')}`
          // Apply appropriate filtering based on bounds
          if(boundsX.length > 0) {
            url += `&f[${aggFieldX}]=[${item.datum[boundsX[0]]}, ${item.datum[boundsX[1]]}]`
          }
          if(boundsY.length > 0){
            url += `&f[${aggFieldY}]=[${item.datum[boundsY[0]]}, ${item.datum[boundsY[1]]}]`
          }
          //Inherit filtering
          if(queryResponse.applied_filters !== undefined) { 
            let filters = queryResponse.applied_filters
            for(let filter in filters) {
              url += `&f[${filters[filter].field.name}]=${filters[filter].value}`
            }
          }
          links = [{
            label: `Show ${item.datum.__count} Records`, 
            type: 'drill', 
            type_label: 'Drill into Records', 
            url: url
          }]     
        }
      }
      LookerCharts.Utils.openDrillMenu({
        links: links,
        event: event
      });               
    });
  });
}
  
  