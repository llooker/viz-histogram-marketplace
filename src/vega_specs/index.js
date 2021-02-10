import AxesHistChart from "./charts/AxesHistChart";
import HeatChart from "./charts/HeatChart";
import XHistChart from "./charts/XHistChart";
import YHistChart from "./charts/YHistChart";

function getChart(props) {
  if (props.config.x_hist && props.config.y_hist) {
    return AxesHistChart(props);
  } else if (props.config.x_hist) {
    return XHistChart(props);
  } else if (props.config.y_hist) {
    return YHistChart(props);
  } else {
    return HeatChart(props);
  }
}

export default getChart;
