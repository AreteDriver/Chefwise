'use client';

import Link from 'next/link';

/**
 * Privacy Policy page - Required for App Store submission
 */
export default function PrivacyPage() {
  const lastUpdated = 'January 18, 2026';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <Link href="/" className="text-primary hover:underline mb-6 inline-block">
          &larr; Back to ChefWise
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 mb-4">
              ChefWise (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your information when you use
              our mobile application and web service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Account Information</h3>
            <p className="text-gray-700 mb-4">
              When you create an account, we collect your email address and display name. If you sign in
              with Google or Apple, we receive basic profile information from those services.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Pantry and Recipe Data</h3>
            <p className="text-gray-700 mb-4">
              We store the pantry items you add, recipes you save, meal plans you create, and nutrition
              tracking data. This data is associated with your account to provide personalized recommendations.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Photos</h3>
            <p className="text-gray-700 mb-4">
              When you use the photo scanning feature, images are sent to our servers for AI-powered food
              detection. Photos are processed in real-time and are not permanently stored on our servers.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Dietary Preferences</h3>
            <p className="text-gray-700 mb-4">
              We collect dietary preferences, allergies, and restrictions you provide to personalize
              recipe recommendations and ensure food safety.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Usage Data</h3>
            <p className="text-gray-700 mb-4">
              We collect anonymous usage analytics to improve our service, including features used,
              app performance metrics, and error reports.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Generate personalized recipes based on your ingredients and preferences</li>
              <li>Detect food items in photos you upload</li>
              <li>Create meal plans tailored to your nutritional goals</li>
              <li>Track your nutrition and dietary progress</li>
              <li>Provide customer support</li>
              <li>Improve our AI models and service quality</li>
              <li>Process subscription payments</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">We use the following third-party services:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Firebase (Google)</strong> - Authentication, database, and hosting</li>
              <li><strong>OpenAI</strong> - AI-powered recipe generation and food detection</li>
              <li><strong>Stripe</strong> - Payment processing for subscriptions</li>
              <li><strong>Apple/Google Sign-In</strong> - Optional authentication methods</li>
            </ul>
            <p className="text-gray-700 mt-4">
              These services have their own privacy policies governing how they handle your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
            <p className="text-gray-700 mb-4">
              Your data is stored securely using Firebase Cloud Firestore with encryption at rest
              and in transit. We implement industry-standard security measures to protect your
              information from unauthorized access.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera and Photo Library Access</h2>
            <p className="text-gray-700 mb-4">
              ChefWise requests access to your camera and photo library solely for the pantry scanning
              feature. This allows you to take photos of your fridge or pantry to automatically detect
              food items. We do not access your camera or photos for any other purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your account data for as long as your account is active. Photos submitted for
              scanning are processed immediately and not stored permanently. You can delete your
              account and all associated data at any time from the Profile settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-700 mb-4">
              ChefWise is not intended for children under 13. We do not knowingly collect personal
              information from children under 13. If you believe we have collected such information,
              please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or your data, please contact us at:
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> privacy@chefwise.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
