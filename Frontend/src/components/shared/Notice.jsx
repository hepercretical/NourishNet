export default function Notice({ title, children, tone = 'info', announce = false }) {
  return (
    <div className={`shared-notice shared-notice--${tone}`} role={announce ? 'status' : undefined}>
      <p className="shared-notice__title">{title}</p>
      {children && <div>{children}</div>}
    </div>
  );
}
