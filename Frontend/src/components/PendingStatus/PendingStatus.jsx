import '../shared/shared.css';
import Notice from '../Notice/Notice.jsx';

export default function PendingStatus({
  children = 'Nutrition has not been reviewed. It is not available as a reusable catalog food yet.',
}) {
  return (
    <Notice title="Pending review" tone="warning" announce>
      <p>{children}</p>
    </Notice>
  );
}
