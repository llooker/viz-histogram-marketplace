import embed from "vega-embed";
import { scatterHist } from "./scatter_hist";
import { simpleHist } from "./simple_hist";
import { baseOptions } from "./common/options";
import { handleErrors } from "./common/utils/data";
import "./common/styles.css";

looker.plugins.visualizations.add({
  options: baseOptions,
  create: function (element, config) {
    var container = element.appendChild(document.createElement("div"));
    container.setAttribute("id", "my-vega");
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    if (data.length === 0) {
      this.addError({ title: "No Results" });
      done();
      return;
    }

    if (config.bin_style === "binned_hist") {
      if (
        !handleErrors(this, queryResponse, {
          min_pivots: 0,
          max_pivots: 0,
          min_dimensions: 1,
          max_dimensions: undefined,
          min_measures: 2,
          max_measures: undefined,
        })
      )
        return;

      scatterHist(data, element, config, queryResponse, details, done, this, embed);
    } else {
      if (
        !handleErrors(this, queryResponse, {
          min_pivots: 0,
          max_pivots: 0,
          min_dimensions: 1,
          max_dimensions: undefined,
          min_measures: 1,
          max_measures: undefined,
        })
      )
        return;

      simpleHist(data, element, config, queryResponse, details, done, this, embed);
    }
    done();
  },
});
