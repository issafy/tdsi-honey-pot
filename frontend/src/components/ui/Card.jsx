export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}
