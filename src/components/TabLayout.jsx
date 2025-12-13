import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import BottomTabBar from './BottomTabBar';

const TabLayout = ({ children, user, activeTab }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="text-2xl font-bold text-primary flex items-center gap-2"
              >
                <span>🍳</span>
                <span>ChefWise</span>
              </button>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => router.push('/')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'home'
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => router.push('/pantry')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'pantry'
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    Pantry
                  </button>
                  <button
                    onClick={() => router.push('/planner')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'planner'
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    Planner
                  </button>
                  <button
                    onClick={() => router.push('/tracker')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'tracker'
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    Tracker
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'profile'
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    Profile
                  </button>
                  <div className="border-l border-gray-300 h-6 mx-2"></div>
                  <button
                    onClick={handleSignOut}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">Not signed in</span>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              {user && (
                <button
                  onClick={() => router.push('/profile')}
                  className="text-gray-700 hover:text-primary p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Bottom Tab Bar (Mobile Only) */}
      {user && <BottomTabBar activeTab={activeTab} />}
    </div>
  );
};

export default TabLayout;
