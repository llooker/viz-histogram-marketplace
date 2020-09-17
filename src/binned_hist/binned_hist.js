import embed from 'vega-embed'
import { 
  prepareData,
  tooltipFormatter
} from '../common/vega_utils'
import { baseOptions } from '../common/options'

  export function binnedHist(data, element, config, queryResponse, details, doneRendering, that) {
    that.clearErrors();

    var width = element.clientWidth - (60 * 5);
    var height = element.clientHeight - (
          60 * (config['legend_orient'] === 'top' || config['legend_orient'] === 'bottom' ? 3 : 2)
        ); //60*2 due to hist and axis labels

    const dynamicOptions = createOptions(queryResponse, baseOptions, config)['options'];
    const { dataProperties, myData } = prepareData(data, queryResponse);
    that.trigger('registerOptions', dynamicOptions);

    const tooltipHandler = (axis) => {
      return [{
        "title": dataProperties[config[axis]]['title'],
        "bin": {
          "maxbins": config['max_bins'],
          ...(config.bin_type === 'steps' && {'step': config[`num_step_${axis}`]})
        },
        "field": config[axis],
        "type": "quantitative",
        "format": tooltipFormatter(dataProperties[config[axis]])
      },
      {
        "title": "Count of Records",
        "aggregate": "count",
        "type": "quantitative"
      }]
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

    console.log(tooltipHandler('x').concat(tooltipHandler('y')))
    //TOP HIST
    var chart = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": {"values": myData},
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
              "maxbins": config['max_bins'],
              ...(config.bin_type === 'steps' && {'step': config['num_step_x']})
            },
            "field": config['x'],
            "type": "quantitative",
            "axis": null
          },
          "y": {
            "aggregate": "count",
            "type": "quantitative",
            "title": ""
          },
          "tooltip": tooltipHandler('x'),
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
              "cursor": "pointer",
              "zindex": -1,
              "type":"rect",
              "invalid": null,
              ...(!config['heatmap_off'] && {"fillOpacity": 0.0})
            },
            "height" : height,
            "width": width,
            "encoding": {
              "x": {
                "bin": {
                  "maxbins":config['max_bins'],
                  ...(config.bin_type === 'steps' && {'step': config['num_step_x']})
                },
                "field": config['x'],
                "type": "quantitative",
                "axis": { 
                    "title": config['y_axis_override'] === "" ? dataProperties[config['x']]['title'] : config['x_axis_override'], 
                    "titleFontSize" : config['x_axis_title_font_size'],
                    "format": tooltipFormatter(dataProperties[config['x']]),
                    "labelFontSize": config['x_axis_label_font_size'],
                    "grid": config['x_grids']
                  }
              },
              "y": {
                "bin": {
                  "maxbins":config['max_bins'],
                  ...(config.bin_type === 'steps' && {'step': config['num_step_y']})
                },
                "field": config['y'],
                "type": "quantitative",
                "axis": {
                    "title": config['y_axis_override'] === "" ? dataProperties[config['y']]['title'] : config['y_axis_override'],
                    "titleFontSize": config['y_axis_title_font_size'],
                    "format": tooltipFormatter(dataProperties[config['y']]),
                    "labelFontSize": config['y_axis_label_font_size'],
                    "grid": config['y_grids']
                  }
              },
              "color": {
                "aggregate": "count",
                "type": "quantitative",
                "legend": !config['heatmap_off'] ? false : { "orient": config['legend_orient'] }
              },
              "opacity": {
                "condition": {"selection": "highlight", "value": 1},
                "value": config['heatmap_opacity'],
              },
              "tooltip": (() => {
                let arr = tooltipHandler('x').concat(tooltipHandler('y'));
                arr = arr.concat(arr.splice(1, 1));
                return arr;
              })()
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
                "maxbins":config['max_bins'],
                ...(config.bin_type === 'steps' && {'step': config['num_step_y']})
              },
              "field": config['y'],
              "type": "quantitative",
              "axis": null
            },
            "x": {
              "aggregate": "count",
              "type": "quantitative",
              "title": ""
            },
            "tooltip": tooltipHandler('y'),
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
      chart.vconcat[1].hconcat[0].layer[1] = {
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
        chart.vconcat[1].hconcat[0].layer[1].encoding.size = {
          "field": config['size'], 
          "type":"quantitative", 
          "title":dataProperties[config['size']]['title'],
          "legend": { 
            "type": "symbol",
            "orient": config['legend_orient'],
            "format": tooltipFormatter(dataProperties[config['size']]),
          },
        };
      }
    }

    embed("#my-vega", chart, {actions: false}).then(({spec, view}) => {
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
            links = [
              {
                label: `Show ${item.datum.__count} Records`, 
                type: 'drill', 
                type_label: 'Drill into Records', 
                url: url
              }
            ]     
          }
        }
        LookerCharts.Utils.openDrillMenu({
          links: links,
          event: event
        });               
      });
      
      //center viz horizontally
      var vegaDiv = document.getElementsByClassName('vega-embed')[0];
      var canvasWidth = parseInt(document.getElementsByTagName('canvas')[0].style.width, 10);
      vegaDiv.style.paddingLeft = (Math.floor((element.getBoundingClientRect().width - canvasWidth)/2)) + 'px';
      
      //doneRendering();
    });
  }
  
  function createOptions(queryResponse, baseOptions, config){
    console.log(config)
    var optionsResponse = {};
    optionsResponse['options'] = Object.assign({}, baseOptions);
    optionsResponse['measures'] = [];
    optionsResponse['dimensions'] = [];
    optionsResponse['masterList'] = [];
  
    var dimCounter = 1;
    var mesCounter = 1;

    var defaultDim;
    var defaultDim2;
    var defaultMes;
    var defaultMes2;
  
    queryResponse.fields.dimension_like.forEach(function(field){
      if (!field.is_numeric && field.type !== "tier") {
        return
      } 
      var dimLib = {};
      var fieldName = (field.name).replace(".","_");
      if (typeof field.label_short != "undefined") {
        dimLib[field.label_short] = fieldName; //store friendly label & field name
      } else {
        dimLib[field.label] = fieldName; //capture label, mainly for table calcs
      }
      if (dimCounter == 1) {
      defaultDim = fieldName; //grab first dimension to use as default X value
      } else if (dimCounter == 2) {
      defaultDim2 = fieldName;
      }
      optionsResponse['masterList'].push(dimLib); //add to master list of all fields
      optionsResponse['dimensions'].push(dimLib);
      dimCounter += 1;
    });
  
    queryResponse.fields.measure_like.forEach(function(field){
      var mesLib = {};
      var fieldName = (field.name).replace(".","_");
      if (typeof field.label_short != "undefined") {
        mesLib[field.label_short] = fieldName;
        optionsResponse['measures'].push(mesLib);
      } else {
        mesLib[field.label] = fieldName;
        if (field.type == "yesno") {
          optionsResponse['dimensions'].push(mesLib);
        } else {
          optionsResponse['measures'].push(mesLib);
        }
      }
      if (mesCounter == 1) {
        defaultMes = fieldName; //grab first measure as default Y value
      } else if (mesCounter == 2) {
        defaultMes2 = fieldName;
      }
      optionsResponse['masterList'].push(mesLib);
      
      mesCounter += 1;
    });
  
    if (typeof defaultMes == "undefined") {
      defaultMes = defaultDim;
    }
  
    if (typeof defaultMes2 == "undefined") {
      defaultMes2 = defaultDim2;
    }

    optionsResponse['options']['x'] = {
      label: "X Axis",
      section: "  Values",
      type: "string",
      display: "select",
      order: 1,
      values: optionsResponse['masterList'],
      default: defaultMes
    }
    optionsResponse['options']['y'] = {
      label: "Y Axis",
      section: "  Values",
      type: "string",
      display: "select",
      order: 2,
      values: optionsResponse['masterList'],
      default: defaultMes2
    }
    if(config['bin_type'] === 'steps') {
      optionsResponse['options']['num_step_x'] = {
        label: "Step Size (X)",
        section: "  Values",
        type: "number",
        order: 5,
        display: "text",
        default: 500,  
        display_size: "half"
      }
      optionsResponse['options']['num_step_y'] = {
        label: "Step Size (Y)",
        section: "  Values",
        type: "number",
        order: 6,
        display: "text",
        default: 500,  
        display_size: "half"
      }
    } else if(config['bin_type'] === 'bins'){
      optionsResponse['options']['max_bins'] = {
        label: "Max number of Bins",
        section: "  Values",
        type: "number",
        order: 4,
        display: "range",
        step: 1,
        min: 1,
        max: 100,
        default: 10
      }
    }
    optionsResponse['options']['heatmap_off'] = {
      label: "Show Heatmap",
      section: "  Values",
      type: "boolean",
      order: 7,
      display: "select",
      default: true
    }
    optionsResponse['options']['layer_points'] = {
      label: "Show Points",
      section: "  Values",
      type: "boolean",
      order: 8,
      display: "select",
      default: true
    }
    var size_arr = optionsResponse['masterList'].concat([{'None': ""}]);
    optionsResponse['options']['size'] = {
      label: "Size Points By",
      section: "  Values",
      type: "string",
      order: 9,
      display: "select",
      values: size_arr,
      default: ""
    }
    optionsResponse['options']['color_scheme'] = {
      label: "Heatmap Color Scheme",
      section: " Style",
      type: "array",
      display: "colors",
      order: 1,
      default: ["#dbf1b4", "#bde5b5", "#94d5b9", "#69c5be", "#45b4c2", "#2c9ec0", "#2182b8", "#2163aa", "#23479c"]
    }
    optionsResponse['options']['heatmap_opacity'] = {
      label: "Heatmap Opacity",
      section: " Style",
      type: "number",
      display: "range",
      min: 0.0,
      max: 1.0,
      step: 0.05,
      default: 0.8,
      order: 2
    }
    optionsResponse['options']['point_opacity'] = {
      label: "Point Opacity",
      section: " Style",
      type: "number",
      display: "range",
      min: 0.0,
      max: 1.0,
      step: 0.05,
      default: 0.8,
      order: 6
    }
    optionsResponse['options']['legend_orient'] = {
      label: "Legend Position",
      section: "Labels",
      type: "string",
      display: "select",
      order: 6,
      values: [
        {"Left" : "left"},
        {"Right": "right"},
        {"Top" : "top"},
        {"Bottom": "bottom"}
      ],
      default: "right"
    }
  
    return optionsResponse;
  }