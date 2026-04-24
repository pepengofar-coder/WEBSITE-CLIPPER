import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Navbar />
        <main className="page">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/processing" element={<ProcessingPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </main>
      </Router>
    </AppProvider>
  );
}
