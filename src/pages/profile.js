import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { DIET_FILTERS } from '@/prompts/recipePrompts';
import MainLayout from '@/components/MainLayout';

export default function ProfilePage({ user }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), profile);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <MainLayout user={user} currentPage="profile">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

          <form onSubmit={handleUpdateProfile}>
            {/* Basic Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile?.displayName || ''}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Dietary Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Diet Type
                  </label>
                  <select
                    value={profile?.preferences?.dietType || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile?.preferences, dietType: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a diet</option>
                    {Object.keys(DIET_FILTERS).map((key) => (
                      <option key={key} value={key}>
                        {DIET_FILTERS[key].split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={profile?.preferences?.allergies?.join(', ') || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: {
                        ...profile?.preferences,
                        allergies: e.target.value.split(',').map(a => a.trim()).filter(Boolean)
                      }
                    })}
                    placeholder="e.g., peanuts, shellfish, dairy"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Macro Goals */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Macro Goals</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Calories
                  </label>
                  <input
                    type="number"
                    value={profile?.macroGoals?.calories || 2000}
                    onChange={(e) => setProfile({
                      ...profile,
                      macroGoals: { ...profile?.macroGoals, calories: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={profile?.macroGoals?.protein || 150}
                    onChange={(e) => setProfile({
                      ...profile,
                      macroGoals: { ...profile?.macroGoals, protein: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={profile?.macroGoals?.carbs || 200}
                    onChange={(e) => setProfile({
                      ...profile,
                      macroGoals: { ...profile?.macroGoals, carbs: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={profile?.macroGoals?.fat || 65}
                    onChange={(e) => setProfile({
                      ...profile,
                      macroGoals: { ...profile?.macroGoals, fat: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Plan Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Subscription</h3>
              <p className="text-gray-600">
                Current Plan: <span className="font-semibold capitalize">{profile?.planTier || 'free'}</span>
              </p>
              <div className="mt-3 flex gap-3">
                {profile?.planTier !== 'premium' ? (
                  <button
                    type="button"
                    onClick={() => router.push('/upgrade')}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Upgrade to Premium
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/subscription')}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Manage Subscription
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
