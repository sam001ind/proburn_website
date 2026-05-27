import fs from 'fs';
import path from 'path';

const filesToPatch = [
  'src/pages/admin/Members.jsx',
  'src/pages/admin/Staff.jsx',
  'src/pages/admin/Billing.jsx',
  'src/pages/admin/Attendance.jsx',
  'src/pages/admin/Leads.jsx',
  'src/pages/admin/Roles.jsx',
  'src/pages/admin/settings/Branches.jsx',
  'src/pages/admin/settings/Plans.jsx',
  'src/pages/admin/settings/Streaks.jsx',
  'src/pages/admin/settings/Holidays.jsx',
];

for (const file of filesToPatch) {
  const filePath = path.join('/Users/abhijitht/.gemini/antigravity/scratch/gym-website', file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf-8');

  // Inject useTenant if not present
  if (!content.includes('useTenant')) {
    content = content.replace(
      /import \{ useBranch \} from '.*?';/g,
      `$& \nimport { useTenant } from '${file.includes('settings') ? '../../../' : '../../'}context/TenantContext';`
    );
    // If useBranch wasn't found (e.g. Leads.jsx, Roles.jsx)
    if (!content.includes('useTenant')) {
      content = content.replace(
        /import \{ db \} from '.*?';/g,
        `$& \nimport { useTenant } from '${file.includes('settings') ? '../../../' : '../../'}context/TenantContext';`
      );
    }
  }

  // Inject activeGymId extraction
  if (!content.includes('activeGymId')) {
    content = content.replace(
      /export default function \w+\(\) \{/,
      `$&\n  const { activeGymId } = useTenant();`
    );
  }

  // Modify addDoc
  content = content.replace(
    /await addDoc\(collection\(db, '(\w+)'\), \{(.*?)\}\);/gs,
    (match, col, body) => {
      if (body.includes('gymId:')) return match;
      return `await addDoc(collection(db, '${col}'), { gymId: activeGymId, ${body} });`;
    }
  );

  content = content.replace(
    /await addDoc\(collection\(db, '(\w+)'\), ([\w]+)\);/g,
    (match, col, varName) => {
      return `await addDoc(collection(db, '${col}'), { ...${varName}, gymId: activeGymId });`;
    }
  );

  // Modify queries
  content = content.replace(
    /onSnapshot\(collection\(db, '(\w+)'\)/g,
    `onSnapshot(query(collection(db, '$1'), where('gymId', '==', activeGymId))`
  );
  
  content = content.replace(
    /query\(collection\(db, '(\w+)'\), where\('/g,
    `query(collection(db, '$1'), where('gymId', '==', activeGymId), where('`
  );

  content = content.replace(
    /query\(collection\(db, '(\w+)'\), orderBy/g,
    `query(collection(db, '$1'), where('gymId', '==', activeGymId), orderBy`
  );

  fs.writeFileSync(filePath, content);
  console.log(`Patched ${file}`);
}
