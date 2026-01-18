import React, { useState, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/firebaseConfig';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';

/**
 * PhotoPantryScanner - Scan photos to detect and add pantry items
 * Uses OpenAI Vision API to identify food items in images
 *
 * @param {Object} props
 * @param {Function} props.onItemsDetected - Callback with detected items array
 * @param {string} props.userId - User ID for subscription tier checks
 */
export default function PhotoPantryScanner({ onItemsDetected, userId }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);
  const { isOnline } = useNetworkStatus();

  const categories = ['Protein', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Other'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setImage(file);
    setDetectedItems([]);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image || !preview) return;

    setLoading(true);
    setError(null);

    try {
      // Extract base64 data and mime type
      const base64Match = preview.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Invalid image format');
      }

      const mimeType = base64Match[1];
      const base64Data = base64Match[2];

      // Use Firebase Cloud Function for secure server-side processing
      if (!functions) {
        throw new Error('Firebase not initialized');
      }

      const analyzePantryPhoto = httpsCallable(functions, 'analyzePantryPhoto');
      const result = await analyzePantryPhoto({
        image: base64Data,
        mimeType,
      });

      const data = result.data;

      if (!data.items || data.items.length === 0) {
        setError('No food items detected in this image. Try a clearer photo.');
        setDetectedItems([]);
      } else {
        setDetectedItems(data.items);
      }
    } catch (err) {
      console.error('Image analysis error:', err);

      // Handle Firebase function errors
      if (err.code === 'functions/permission-denied') {
        setError(err.message || 'Daily limit reached. Upgrade to Premium for unlimited scans.');
      } else if (err.code === 'functions/unauthenticated') {
        setError('Please sign in to use photo scanning.');
      } else {
        setError(err.message || 'Failed to analyze image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    setDetectedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeItem = (index) => {
    setDetectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAll = () => {
    if (detectedItems.length === 0) return;
    onItemsDetected(detectedItems);
    // Reset state after adding
    setImage(null);
    setPreview(null);
    setDetectedItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAll = () => {
    setImage(null);
    setPreview(null);
    setDetectedItems([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Scan Pantry</h3>
          <p className="text-sm text-gray-600">
            Take a photo of your fridge or pantry to auto-detect items
          </p>
        </div>
        {!isOnline && (
          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
            Requires internet
          </span>
        )}
      </div>

      {/* File Input */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          disabled={!isOnline || loading}
          className="hidden"
          id="pantry-photo-input"
        />
        <label
          htmlFor="pantry-photo-input"
          className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            !isOnline || loading
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-primary/30 hover:border-primary hover:bg-primary/5 text-gray-600'
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{image ? 'Change photo' : 'Take or select photo'}</span>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="mb-4">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Pantry photo preview"
              className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
            />
            <button
              onClick={clearAll}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
              aria-label="Clear photo"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Analyze Button */}
          {detectedItems.length === 0 && !loading && (
            <button
              onClick={analyzeImage}
              disabled={loading}
              className="w-full mt-3 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Analyze Photo
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-gray-600">Detecting items...</span>
        </div>
      )}

      {/* Detected Items List */}
      {detectedItems.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">
              Detected Items ({detectedItems.length})
            </h4>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {detectedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                {editingIndex === index ? (
                  // Edit mode
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Qty"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Unit"
                    />
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(index, 'category', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  // View mode
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded ml-2">
                      {item.category}
                    </span>
                  </div>
                )}

                {/* Edit/Done button */}
                <button
                  onClick={() =>
                    setEditingIndex(editingIndex === index ? null : index)
                  }
                  className="p-1 text-gray-500 hover:text-gray-700"
                  aria-label={editingIndex === index ? 'Done editing' : 'Edit item'}
                >
                  {editingIndex === index ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  )}
                </button>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                  aria-label="Remove item"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add All Button */}
          <button
            onClick={handleAddAll}
            className="w-full mt-4 bg-secondary text-white px-4 py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium"
          >
            Add {detectedItems.length} Item{detectedItems.length !== 1 ? 's' : ''} to Pantry
          </button>
        </div>
      )}
    </div>
  );
}
