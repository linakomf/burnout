import { Navigate } from 'react-router-dom';
import { isValidSpaceSection, spaceHubHref, spaceSectionHref } from './practiceSpaceConfig';



export default function PracticesSpace({ section: sectionProp }) {
  const section = String(sectionProp || '').trim();
  if (section && isValidSpaceSection(section)) {
    return <Navigate to={spaceSectionHref(section)} replace />;
  }
  return <Navigate to={spaceHubHref()} replace />;
}
