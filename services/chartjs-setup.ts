import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Registra tutti i componenti di Chart.js necessari per l'applicazione in un unico posto.
// Questo previene errori come "X is not a registered scale/element".
ChartJS.register(
  // Scale
  CategoryScale,
  LinearScale,
  TimeScale,

  // Elementi
  PointElement,
  LineElement,
  BarElement,
  ArcElement,

  // Plugin
  Title,
  Tooltip,
  Legend,
  Filler
);