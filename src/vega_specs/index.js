import AxesHistChart from "./AxesHistChart";
import XHistChart from "./XHistChart";
import Heatmap from "./Heatmap";

function getChart(props) {
  if (props.config.x_hist && props.config.y_hist) {
    return AxesHistChart(props);
  } else if (props.config.x_hist) {
    return XHistChart(props);
  } else if (props.config.y_hist) {
    return YHistChart(props);
  } else {
    // For saftey while deving 
    return AxesHistChart(props);
  }
}

export default getChart;
