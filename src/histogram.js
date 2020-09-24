import embed from 'vega-embed'
import { binnedHist } from './binned_hist'
import { simpleHist } from './simple_hist'
import { baseOptions } from './common/options'
import { 
  handleErrors, 
  loadStylesheet 
} from './common/vega_utils'



looker.plugins.visualizations.add({
  options: baseOptions,
  create: function(element, config) {
    var container = element.appendChild(document.createElement("div"));
    container.setAttribute("id","my-vega");
    
  },

  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    loadStylesheet("https://fonts.googleapis.com/css?family=Open+Sans")

    if(config.bin_style === 'binned_hist'){
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 1, max_dimensions: undefined,
        min_measures: 2, max_measures: undefined
      })) return
      
      binnedHist(data, element, config, queryResponse, details, doneRendering, this, embed);
    
    } else {
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 1, max_dimensions: 1,
        min_measures: 1, max_measures: undefined
      })) return
    
      simpleHist(data, element, config, queryResponse, details, doneRendering, this, embed);
    }
  }

})