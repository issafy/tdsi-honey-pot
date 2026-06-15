export default function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div
      className={`${sizes[size]} border-2 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin`}
    />
  );
}
