import { useEffect, useState } from 'react';
import { getSubmission, listSubmissions } from '../../services/submissions.js';
import { LoadingState, ErrorState, EmptyState } from '../DataState/DataState.jsx';
import Button from '../Button/Button.jsx';
import SubmissionCorrection from '../SubmissionCorrection/SubmissionCorrection.jsx';
import './Submissions.css';

const statuses = {
  pending: 'Pending review',
  'needs-review': 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
};
export default function Submissions({ id }) {
  const [state, setState] = useState({ loading: true }),
    [attempt, setAttempt] = useState(0),
    [editing, setEditing] = useState(false);
  function reload() {
    setState({ loading: true });
    setEditing(false);
    setAttempt((value) => value + 1);
  }
  useEffect(() => {
    const controller = new AbortController();
    (id
      ? getSubmission(id, { signal: controller.signal })
      : listSubmissions({ signal: controller.signal })
    )
      .then((result) => {
        if (!controller.signal.aborted) setState({ result });
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) setState({ error: true });
      });
    return () => controller.abort();
  }, [id, attempt]);
  if (editing)
    return (
      <SubmissionCorrection
        key={`${state.result.id}:${state.result.revision}`}
        submission={state.result}
        onSaved={reload}
        onCancel={() => setEditing(false)}
      />
    );
  const record = state.result;
  return (
    <>
      <h1>{id ? 'Your product submission' : 'My submissions'}</h1>
      {state.loading ? (
        <LoadingState message="Loading your submissions." />
      ) : state.error ? (
        <ErrorState message="Your submissions could not be loaded. Try again." onRetry={reload} />
      ) : id ? (
        <>
          <h2>{record.productName || `Product with barcode ${record.barcode}`}</h2>
          <p>
            Status: <strong>{statuses[record.status] || 'Unavailable'}</strong>
          </p>
          <p>Barcode: {record.barcode}</p>
          {record.servingBasis && <p>Submitted serving: {record.servingBasis}</p>}
          <p>
            Submitted photos and values are review material. Pending or rejected submissions are not
            searchable catalog food and cannot be logged as food entries.
          </p>
          {record.reviewNote && (
            <div role="status">
              <h2>Review feedback</h2>
              <p>{record.reviewNote}</p>
            </div>
          )}
          <div className="submissions__photos">
            <figure>
              <img src={record.photos.front} alt="Submitted package front" />
              <figcaption>Package front</figcaption>
            </figure>
            <figure>
              <img src={record.photos.label} alt="Submitted nutrition label" />
              <figcaption>Nutrition label</figcaption>
            </figure>
          </div>
          {record.status === 'needs-review' && (
            <Button onClick={() => setEditing(true)}>Correct requested fields</Button>
          )}
          <Button variant="secondary" onClick={reload}>
            Reload submission
          </Button>
          <a className="design-action" href="#/app/submissions">
            All my submissions
          </a>
        </>
      ) : record.length ? (
        <ul>
          {record.map((item) => (
            <li key={item.id}>
              <a className="design-action" href={`#/app/submissions/${item.id}`}>
                {item.productName || `Product with barcode ${item.barcode}`}
              </a>
              <p>{statuses[item.status] || 'Unavailable'}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No submissions yet">
          Scan a product. If it is not in the catalog, submit its package and label photos for
          review.
        </EmptyState>
      )}
      <a className="design-action" href="#/app/scan">
        Scan a product
      </a>
      <a className="design-action" href="#/app/dashboard">
        Back to diary
      </a>
    </>
  );
}
