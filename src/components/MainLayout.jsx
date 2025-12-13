import NavigationBar from './NavigationBar';

/**
 * MainLayout component that wraps all pages with consistent navigation
 * and helps preserve state across page transitions
 */
export default function MainLayout({ children, user, currentPage = '' }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar user={user} currentPage={currentPage} />
      <main>{children}</main>
    </div>
  );
}
