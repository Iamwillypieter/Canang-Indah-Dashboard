export default function FormSection({ title, icon, children }) {
  return (
    <div className="section">
      <h3 className="section-title">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}