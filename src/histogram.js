import {binned_hist} from './binned_hist/binned_hist'
import {simple_hist} from './simple_hist/simple_hist'
import {baseOptions} from './options'



looker.plugins.visualizations.add({
    options: baseOptions,
    create: function(element, config) {
        var container = element.appendChild(document.createElement("div"));
        container.setAttribute("id","my-vega");
    },
    updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
        console.log(queryResponse.fields.measure_like)
        const that = this
        if(queryResponse.fields.measure_like.length > 1){
            binned_hist(data, element, config, queryResponse, details, doneRendering, that);
        } else {
            simple_hist(data, element, config, queryResponse, details, doneRendering, that);
        }
    }
})