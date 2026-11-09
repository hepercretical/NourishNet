import { screens } from '../design/screens.js';

export default function DesignIndex() {
  return (
    <>
      <h1 tabIndex={-1}>All screen designs</h1>
      <p>
        Plan-03 review map. Open each screen, follow its preview links, and select each design
        state. Disabled controls show future operations without collecting data.
      </p>
      <p>
        Review at 390 px and 1440 px, at 200% zoom, and with keyboard navigation. Existing
        design-token values are preserved. Mobile navigation wraps above content; wide navigation
        sits beside it. Nothing is fixed over focus or fields.
      </p>
      <ol className="design-index">
        {Object.entries(screens).map(([path, screen]) => (
          <li key={path}>
            <a href={`#${path}`}>{screen.title}</a>
          </li>
        ))}
      </ol>
      <p>
        <a className="design-action" href="#/design/components">
          Try shared food, form, and state components
        </a>
      </p>
    </>
  );
}
