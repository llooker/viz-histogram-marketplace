import embed from 'vega-embed'
import { baseOptions } from '../common/options'
import { 
  prepareData,
  histTooltipHandler,
  tooltipFormatter,
  makeBins
} from '../common/vega_utils'
import { QUANTITATIVE } from 'vega-lite/build/src/type';
  
export function simpleHist(data, element, config, queryResponse, details, done, that){
  that.clearErrors();

  const { dataProperties, myData } = prepareData(data, queryResponse);
  const vegaSafeNameMes = queryResponse.fields.measure_like[0].name.replace('.', '_');
  const vegaSafeNameDim = queryResponse.fields.dimensions[0].name.replace('.', '_');
  const width = element.clientWidth * 0.92;
  const height = element.clientHeight * 0.92;

  const options = Object.assign({}, baseOptions)
  const max = Math.max(...myData.map(e => e[vegaSafeNameMes]))

  if(config['bin_type'] === 'bins') {
    options['max_bins'] = {
      label: "Max number of Bins",
      section: "  Values",
      type: "number",
      order: 4,
      display: "range",
      step: 1,
      min: 1,
      max: 200,
      default: 10
    }
  } else if(config['bin_type'] === 'steps') {
    options['step_size'] = {
      label: "Step Size",
      section: "  Values",
      type: "number",
      order: 5,
      display: "text",
      default: Math.floor(max/10)  
    }
  } else {
    options['breakpoint_array'] = {
      label: "Breakpoints",
      section: "  Values",
      type: "string",
      default: "1000,2000,3000"
    }
    
  }
  that.trigger('registerOptions', options)

  let preBin = []
  if(config['bin_type'] === 'breakpoints'){
    preBin = makeBins(myData, vegaSafeNameMes, config['breakpoint_array'])
  }
  
  const vegaChart = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "data": {
      "values": config['bin_type'] === 'breakpoints' ? preBin : myData
    },
    "width": width,
    "height": height,
    "padding": 5,
    "selection": {
      "highlight": {
        "type": "single",
        "empty": "none",
        "on": "mouseover"
      },
    },
    "mark": {
      "type": "bar",
      "cursor": "pointer"
    },
    "encoding": {
      "x": {
        "type": QUANTITATIVE,
        "bin": {
          ...(config['bin_type'] === 'bins' && {"maxbins": config['max_bins']}),
          ...(config['bin_type'] === 'steps' && {'step': config['step_size']}),
          ...(config['bin_type'] === 'breakpoints' && {'binned': true})
        },
        "field": config['bin_type'] === 'breakpoints' ? "bin_start" : vegaSafeNameMes,
        "axis": {
          "title": config['x_axis_override'] === "" ? dataProperties[vegaSafeNameMes]['title'] : config['x_axis_override'],
          "titleFontSize": config['x_axis_title_font_size'],
          "labelFontSize": config['x_axis_label_font_size'],
          "format": tooltipFormatter(dataProperties[vegaSafeNameMes]),
          "grid": config['x_grids']
        }
      },
      ...(config['bin_type'] === 'breakpoints' && {'x2': {"field": "bin_end"}}),
      "y": {
        "type": QUANTITATIVE,
        ...(config['bin_type'] !== 'breakpoints' && {"aggregate": "count"}),
        ...(config['bin_type'] === 'breakpoints' && {"field": "count"}),
        "axis": {
          "title": config['y_axis_override'] === "" ? `Count of ${dataProperties[vegaSafeNameDim]['title']}` : config['y_axis_override'],
          "titleFontSize": config['y_axis_title_font_size'],
          "labelFontSize": config['y_axis_label_font_size'],
          "grid": config['y_grids']
        }
      },
      "color": {
        "condition": {"selection": "highlight", "value": config['color_on_hover']},
        "value": config['color_col'],
      },
      "tooltip": histTooltipHandler(dataProperties[vegaSafeNameMes], {
        ...(config['bin_type'] === 'bins' && {"maxbins": config['max_bins']}),
        ...(config['bin_type'] === 'steps' && {'step': config['step_size']}),
        ...(config['bin_type'] === 'breakpoints' && {'binned': true})
      })
    }   
    
  }

  embed("#my-vega", vegaChart, {actions: false}).then( ({spec, view}) => {
    view.addEventListener('click', function (event, item) {
      console.log(item)
      const aggField = dataProperties[vegaSafeNameMes]['lookerName']
      const bounds = Object.keys(item.datum).filter(ele => ele.includes(vegaSafeNameMes))
      
      let links = item.datum.links
      let baseURL = myData[0].links
      let fields = []
      for(let field of queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like)) {
        fields.push(field.name)
      }
      // Base URL points to all fields in queryResponse                
      if(baseURL.length < 1) { 
        links = []  
      } else {
        baseURL = baseURL.filter(ele => ele.url.includes('/explore/'))[0].url.split('?')[0]
        let url = `${baseURL}?fields=${fields.join(',')}`

        // Apply appropriate filtering based on bounds
        url += `&f[${aggField}]=[${item.datum[bounds[0]]}, ${item.datum[bounds[1]]}]`
        links = [
          {
            label: `Show ${item.datum.__count} Records`, 
            type: 'drill', 
            type_label: 'Drill into Records', 
            url: url
          }
        ]     
      }
      LookerCharts.Utils.openDrillMenu({
        links: links,
        event: event
      })
    })
  })
}
