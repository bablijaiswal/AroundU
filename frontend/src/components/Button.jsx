export default function Button({ children, variant = 'primary', size = 'md', fullWidth = false, className = '', ...props }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
