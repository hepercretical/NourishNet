import '../shared/shared.css';
export default function Button({
  children,
  pending = false,
  pendingLabel = 'Working…',
  disabled = false,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      className={`shared-button shared-button--${variant}`}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
