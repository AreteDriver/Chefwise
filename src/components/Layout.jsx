import NavigationBar from './NavigationBar';

export default function Layout({ children, user }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar user={user} />
      {children}
    </div>
  );
}
