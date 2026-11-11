import { useState } from 'react';
import {
  CalendarExample,
  DiaryExample,
  EstimateExample,
  FoodExample,
  SharingExample,
  UploadExample,
} from '../components/DesignExamples/DesignExamples.jsx';
import './ScreenDesign.css';

const states = ['Example', 'Loading', 'Error', 'Empty', 'Validation', 'Success'];

export default function ScreenDesign({ screen, route }) {
  const [state, setState] = useState('Example');
  const stateMessage = {
    Loading:
      screen.loading ||
      `Loading ${screen.title.toLowerCase()}. Previous account data stays hidden.`,
    Error:
      screen.error || 'This screen could not load. Your changes will be kept while you try again.',
    Empty:
      screen.empty || 'Nothing to show yet. Use the next preview link to explore the first action.',
    Validation:
      screen.validation ||
      'Check the marked fields before continuing. Entered values remain in place.',
    Success:
      screen.success ||
      'Example action completed once. This is design feedback only; nothing was saved or sent.',
  }[state];

  return (
    <>
      <h1 tabIndex={-1}>{screen.title}</h1>
      <p>{screen.description}</p>
      <section className="design-state-picker" aria-label="Design state review">
        <label className="design-field">
          Preview state
          <select value={state} onChange={(event) => setState(event.target.value)}>
            {states.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <p>Review controls change examples only. Real data states belong to the feature plans.</p>
      </section>
      {stateMessage && (
        <section className="design-feedback" aria-label={`${state} state example`}>
          <h2>{state} example</h2>
          <p role={state === 'Error' || state === 'Validation' ? 'alert' : 'status'}>
            {stateMessage}
          </p>
          {state === 'Error' && (
            <button type="button" onClick={() => setState('Example')}>
              Try again (preview)
            </button>
          )}
        </section>
      )}
      {!['Loading', 'Error', 'Empty'].includes(state) && (
        <>
          {screen.kind === 'diary' && <DiaryExample />}
          {screen.kind === 'food' && <FoodExample />}
          {screen.kind === 'upload' && <UploadExample />}
          {screen.kind === 'estimate' && <EstimateExample />}
          {screen.kind === 'sharing' && <SharingExample />}
          {screen.kind === 'calendar' && (
            <CalendarExample comparison={route.endsWith('/comparison')} />
          )}
          {screen.fields && (
            <fieldset className="design-panel">
              <legend>Field layout · disabled preview</legend>
              <div className="design-fields">
                {screen.fields.map(([name, value], index) => (
                  <div className="design-field" key={name}>
                    <label htmlFor={`preview-field-${index}`}>{name}</label>
                    <input
                      id={`preview-field-${index}`}
                      disabled
                      value={value}
                      aria-invalid={state === 'Validation' && index === 0 ? true : undefined}
                      aria-describedby={
                        state === 'Validation' && index === 0 ? 'field-feedback' : undefined
                      }
                    />
                    {state === 'Validation' && index === 0 && (
                      <span id="field-feedback" className="design-field-error">
                        {screen.validation || 'Check this field before continuing.'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
          )}
          {screen.items && (
            <ul className="design-detail-list">
              {screen.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {screen.operation && (
            <p>
              <button type="button" disabled>
                {screen.operation} (unavailable in preview)
              </button>
            </p>
          )}
        </>
      )}
      <nav
        className={route === '/settings' ? 'design-preferences' : 'design-actions'}
        aria-label="Flow preview links"
      >
        {screen.links.map(([path, label]) => (
          <a className="design-action" key={`${path}-${label}`} href={`#${path}`}>
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
