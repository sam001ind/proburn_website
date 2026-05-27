import { Link, useLocation } from 'react-router-dom';
import { FileText, Link as LinkIcon, Palette, ArrowLeft } from 'lucide-react';

export default function WebsiteNav({ gymId }) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <Link to="/superadmin/dashboard" className="btn btn-outline" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <ArrowLeft size={16} /> Back to Gym Management
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <Link 
          to={`/superadmin/website/${gymId}/pages`} 
          className={`btn ${path.includes('/pages') ? 'btn-primary' : 'btn-outline'}`}
        >
          <FileText size={16} style={{ marginRight: '0.5rem' }} /> Pages
        </Link>
        <Link 
          to={`/superadmin/website/${gymId}/navigation`} 
          className={`btn ${path.includes('/navigation') ? 'btn-primary' : 'btn-outline'}`}
        >
          <LinkIcon size={16} style={{ marginRight: '0.5rem' }} /> Navigation
        </Link>
        <Link 
          to={`/superadmin/website/${gymId}/theme`} 
          className={`btn ${path.includes('/theme') ? 'btn-primary' : 'btn-outline'}`}
        >
          <Palette size={16} style={{ marginRight: '0.5rem' }} /> Theme Settings
        </Link>
      </div>
    </div>
  );
}
