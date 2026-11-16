const BASE =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500';
const OK = 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30';
const BAD = 'border-red-400 focus:border-red-500 focus:ring-red-500/30';

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ id, label, error, hint, className = '', ...props }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${BASE} ${error ? BAD : OK} ${className}`}
        {...props}
      />
    </Field>
  );
}

export function Textarea({ id, label, error, hint, className = '', ...props }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${BASE} ${error ? BAD : OK} ${className}`}
        {...props}
      />
    </Field>
  );
}

export function Select({ id, label, error, hint, options, placeholder, className = '', ...props }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={`${BASE} ${error ? BAD : OK} ${className}`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
