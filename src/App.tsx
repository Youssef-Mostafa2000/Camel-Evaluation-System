import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Landing } from './pages/Landing';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CamelsList } from './pages/CamelsList';
import { CamelForm } from './pages/CamelForm';
import { CamelDetails } from './pages/CamelDetails';
import { EvaluationReport } from './pages/EvaluationReport';
import { ExpertDashboard } from './pages/ExpertDashboard';
import { ExpertEvaluate } from './pages/ExpertEvaluate';
import { CamelAnalytics } from './pages/CamelAnalytics';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/camels" element={<CamelsList />} />
            <Route path="/camels/new" element={<CamelForm />} />
            <Route path="/camels/:id" element={<CamelDetails />} />
            <Route path="/camels/:id/edit" element={<CamelForm />} />
            <Route path="/camels/:id/analytics" element={<CamelAnalytics />} />
            <Route path="/evaluations/:evaluationId" element={<EvaluationReport />} />
            <Route path="/expert/dashboard" element={<ExpertDashboard />} />
            <Route path="/expert/evaluate/:assignmentId" element={<ExpertEvaluate />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
