import '@/styles/globals.css';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Use the Layout for pages, allowing each page to define its own layout if needed
  // This approach preserves state during navigation and provides a consistent layout
  const getLayout = Component.getLayout || ((page) => <Layout user={user}>{page}</Layout>);

  return getLayout(<Component {...pageProps} user={user} />);
}
