import React, { useState, useEffect } from 'react';
import {
  subscribeToPantry,
  addPantryItem,
  deletePantryItem,
  isPendingSync,
  LOCAL_STATUS,
} from '@/utils/offline/pantryService';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';

/**
 * PantryInventory Component - Manage user's pantry items with offline support
 * @param {Object} props
 * @param {string} props.userId - User ID
 * @param {Function} props.onSuggestRecipes - Callback to suggest recipes
 */
export default function PantryInventory({ userId, onSuggestRecipes }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const { isOnline, incrementPendingCount } = useNetworkStatus();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPantry(
      userId,
      (pantryItems, fromCache) => {
        setItems(pantryItems);
        setIsFromCache(fromCache);
        setLoading(false);
      },
      (online) => {
        // Optional: Handle online status changes within the component
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    try {
      await addPantryItem(newItem, userId);
      setNewItem({ name: '', quantity: '', unit: '', category: '' });

      // If offline, increment pending count
      if (!isOnline) {
        incrementPendingCount();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deletePantryItem(itemId, userId);

      // If offline and not a temp item, increment pending count
      if (!isOnline && !itemId.startsWith('temp_')) {
        incrementPendingCount();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const categories = ['Protein', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Other'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold mb-2">Pantry Inventory</h2>
          {isFromCache && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
              Cached data
            </span>
          )}
        </div>
        <p className="text-gray-600">Manage your ingredients and get recipe suggestions</p>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="text"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Unit (oz, cups, etc)"
            value={newItem.unit}
            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Add to Pantry
        </button>
      </form>

      {/* Items List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading pantry...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Your pantry is empty</p>
          <p className="text-sm text-gray-400">Add ingredients to get started</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">{items.length} items in pantry</p>
            <button
              onClick={() => onSuggestRecipes && onSuggestRecipes(items)}
              className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors text-sm"
            >
              Suggest Recipes
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isPendingSync(item)
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {isPendingSync(item) && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded">
                        {item.syncStatus === LOCAL_STATUS.PENDING_CREATE
                          ? 'Pending sync'
                          : 'Pending delete'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.quantity && item.unit
                      ? `${item.quantity} ${item.unit}`
                      : item.quantity || 'No quantity specified'}
                    {item.category && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-500 hover:text-red-700 ml-4"
                  aria-label="Delete item"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
