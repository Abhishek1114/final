
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavBar from './components/NavBar';
import { ToastContainer } from './components/Toast';
import Home from './pages/Home';
import Certifier from './pages/Certifier';
import Producer from './pages/Producer';
import Buyer from './pages/Buyer';
import Regulator from './pages/Regulator';
import './lib/test-env.js';

function App() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <NavBar />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/certifier" element={<Certifier />} />
          <Route path="/producer" element={<Producer />} />
          <Route path="/buyer" element={<Buyer />} />
          <Route path="/regulator" element={<Regulator />} />
        </Routes>
      </motion.main>
      
      <ToastContainer />
    </div>
  );
}

export default App;