import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaTrash, FaPlus } from 'react-icons/fa';
import type { RecipeFolder } from '../../lib/services/recipeService';

export interface RecipeFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: RecipeFolder[];
  onSave: () => Promise<void>;
}

const RecipeFolderModal: React.FC<RecipeFolderModalProps> = ({
  isOpen,
  onClose,
  folders,
  onSave
}) => {
  const [editingFolders, setEditingFolders] = useState<RecipeFolder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newFolder, setNewFolder] = useState({
    name: '',
    slug: '',
    description: '',
    is_visible: true,
    sort_order: null as number | null
  });

  useEffect(() => {
    if (isOpen) {
      setEditingFolders([...folders]);
      setIsAdding(false);
      setNewFolder({
        name: '',
        slug: '',
        description: '',
        is_visible: true,
        sort_order: null
      });
    }
  }, [isOpen, folders]);

  const handleAddFolder = async () => {
    try {
      const response = await fetch('/api/recipes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFolder)
      });

      if (!response.ok) throw new Error('Failed to create folder');

      setIsAdding(false);
      setNewFolder({
        name: '',
        slug: '',
        description: '',
        is_visible: true,
        sort_order: null
      });

      await onSave();
    } catch (error) {
      console.error('Error adding folder:', error);
      alert('Failed to add folder');
    }
  };

  const handleUpdateFolder = async (folder: RecipeFolder) => {
    try {
      const response = await fetch(`/api/recipes/folders/${folder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folder.name,
          slug: folder.slug,
          description: folder.description,
          is_visible: folder.is_visible,
          sort_order: folder.sort_order
        })
      });

      if (!response.ok) throw new Error('Failed to update folder');

      await onSave();
    } catch (error) {
      console.error('Error updating folder:', error);
      alert('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm('Are you sure you want to delete this folder? Recipes using this folder will need to be reassigned.')) {
      return;
    }

    try {
      const response = await fetch(`/api/recipes/folders/${folderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete folder');

      await onSave();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-[#383B26]">Manage Recipe Folders</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Folders */}
          <div className="space-y-4 mb-6">
            {editingFolders
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((folder) => (
                <div key={folder.id} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={folder.name}
                        onChange={(e) => {
                          const updatedFolders = editingFolders.map(f =>
                            f.id === folder.id ? { ...f, name: e.target.value } : f
                          );
                          setEditingFolders(updatedFolders);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={folder.slug}
                        onChange={(e) => {
                          const updatedFolders = editingFolders.map(f =>
                            f.id === folder.id ? { ...f, slug: e.target.value } : f
                          );
                          setEditingFolders(updatedFolders);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#383B26] mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={folder.description || ''}
                        onChange={(e) => {
                          const updatedFolders = editingFolders.map(f =>
                            f.id === folder.id ? { ...f, description: e.target.value } : f
                          );
                          setEditingFolders(updatedFolders);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        value={folder.sort_order || ''}
                        onChange={(e) => {
                          const updatedFolders = editingFolders.map(f =>
                            f.id === folder.id ? { ...f, sort_order: e.target.value ? parseInt(e.target.value) : null } : f
                          );
                          setEditingFolders(updatedFolders);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={folder.is_visible}
                          onChange={(e) => {
                            const updatedFolders = editingFolders.map(f =>
                              f.id === folder.id ? { ...f, is_visible: e.target.checked } : f
                            );
                            setEditingFolders(updatedFolders);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-[#383B26]">Visible</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleUpdateFolder(folder)}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaSave className="mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                    >
                      <FaTrash className="mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Add New Folder */}
          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-[#B8A692] rounded-lg">
              <h3 className="text-lg font-semibold text-[#383B26] mb-4">Add New Folder</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newFolder.name}
                    onChange={(e) => {
                      setNewFolder({
                        ...newFolder,
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">
                    Slug * (auto-generated)
                  </label>
                  <input
                    type="text"
                    value={newFolder.slug}
                    onChange={(e) => setNewFolder({ ...newFolder, slug: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#383B26] mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newFolder.description}
                    onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={newFolder.sort_order || ''}
                    onChange={(e) => setNewFolder({ ...newFolder, sort_order: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFolder.is_visible}
                      onChange={(e) => setNewFolder({ ...newFolder, is_visible: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-[#383B26]">Visible</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddFolder}
                  disabled={!newFolder.name || !newFolder.slug}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave className="mr-2" />
                  Create Folder
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-[#B8A692] hover:text-[#B8A692] flex items-center justify-center"
            >
              <FaPlus className="mr-2" />
              Add New Folder
            </button>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeFolderModal;
