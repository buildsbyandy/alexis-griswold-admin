import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { withAdminSSP } from '../lib/auth/withAdminSSP';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaStar, FaDownload, FaUpload as FaUploadIcon, FaVideo, FaStore, FaUtensils, FaImage, FaHeartbeat } from 'react-icons/fa';
import toast from 'react-hot-toast';
import recipeService from '../lib/services/recipeService';
import type { Recipe } from '../lib/services/recipeService';
import vlogService from '../lib/services/vlogService';
import storefrontService, { type StorefrontProduct } from '../lib/services/storefrontService';

type AdminTab = 'home' | 'vlogs' | 'recipes' | 'healing' | 'storefront';

// Component for authenticated admin content
const AdminContent: React.FC = () => {
  // All useState hooks at the top level
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [stats, setStats] = useState(recipeService.getRecipeStats());
  const [sfItems, setSfItems] = useState<StorefrontProduct[]>([]);
  const [sfEditing, setSfEditing] = useState<StorefrontProduct | null>(null);
  const [sfIsAdding, setSfIsAdding] = useState(false);
  const [sfSearch, setSfSearch] = useState('');
  const [sfCategory, setSfCategory] = useState<string>('all');
  const [sfStatus, setSfStatus] = useState<string>('all');
  const [sfStats, setSfStats] = useState(storefrontService.getStats());
  const [showVlogModal, setShowVlogModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [currentCarouselType, setCurrentCarouselType] = useState<'main' | 'ag' | 'healing-part1' | 'healing-part2'>('main');
  
  const [vlogData, setVlogData] = useState({
    youtube_url: '',
    video_title: '',
    video_description: '',
    duration: '',
    carousel_id: ''
  });
  const [albumData, setAlbumData] = useState({
    album_title: '',
    album_subtitle: '',
    album_description: '',
    album_date: new Date().toISOString().split('T')[0]
  });
  const [videoData, setVideoData] = useState({
    youtube_url: '',
    video_title: '',
    video_description: '',
    duration: '',
    views: ''
  });
  const [playlistData, setPlaylistData] = useState({
    name: '',
    mood: '',
    color: '#2D2D2D',
    spotify_url: ''
  });

  // Home tab state
  const [editingHomeContent, setEditingHomeContent] = useState(false);
  const [homePageContent, setHomePageContent] = useState({
    videoBackground: '/alexisHome.mp4',
    fallbackImage: '/public/images/home-fallback.jpg',
    videoTitle: 'Welcome to Alexis Griswold',
    videoDescription: 'Experience wellness, recipes, and lifestyle content'
  });

  // Healing tab state
  const [healingActiveTab, setHealingActiveTab] = useState<'hero' | 'carousels' | 'products'>('hero');
  const [editingHealingHero, setEditingHealingHero] = useState(false);
  const [editingCarouselHeaders, setEditingCarouselHeaders] = useState(false);
  const [healingHeroData, setHealingHeroData] = useState({
    title: 'HEALING',
    subtitle: 'Your journey to wellness starts here.',
    bodyText: 'From gut health to holistic healing, discover natural methods to restore your body\'s balance and vitality.',
    featuredVideoId: 'dQw4w9WgXcQ',
    featuredVideoTitle: 'Healing Journey Introduction',
    featuredVideoDate: '2024-01-15'
  });

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Alexis Griswold Admin Dashboard</h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'home', name: 'Home', icon: FaImage },
              { id: 'vlogs', name: 'Vlogs', icon: FaVideo },
              { id: 'recipes', name: 'Recipes', icon: FaUtensils },
              { id: 'healing', name: 'Healing', icon: FaHeartbeat },
              { id: 'storefront', name: 'Storefront', icon: FaStore }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Homepage Content</h2>
                <button
                  onClick={() => setEditingHomeContent(!editingHomeContent)}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  {editingHomeContent ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {editingHomeContent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Background URL
                    </label>
                    <input
                      type="text"
                      value={homePageContent.videoBackground}
                      onChange={(e) => setHomePageContent(prev => ({ ...prev, videoBackground: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Title
                    </label>
                    <input
                      type="text"
                      value={homePageContent.videoTitle}
                      onChange={(e) => setHomePageContent(prev => ({ ...prev, videoTitle: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Description
                    </label>
                    <textarea
                      value={homePageContent.videoDescription}
                      onChange={(e) => setHomePageContent(prev => ({ ...prev, videoDescription: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded h-24"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      setEditingHomeContent(false);
                      toast.success('Homepage content updated!');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Video Background:</span> {homePageContent.videoBackground}
                  </div>
                  <div>
                    <span className="font-medium">Title:</span> {homePageContent.videoTitle}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span> {homePageContent.videoDescription}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="space-y-6">
            {/* Recipe Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Recipes</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{stats.beginners}</div>
                <div className="text-sm text-gray-600">Beginner Recipes</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-yellow-600">{stats.recipeOfWeek}</div>
                <div className="text-sm text-gray-600">Recipe of Week</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byFolder).length}</div>
                <div className="text-sm text-gray-600">Folders</div>
              </div>
            </div>

            {/* Recipe Management */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recipe Management</h2>
                <button
                  onClick={() => setIsAddingRecipe(true)}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Recipe
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value="all">All Folders</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snacks">Snacks</option>
                </select>
              </div>

              <div className="text-gray-600">
                Recipe management functionality ready - connect to your recipe service API
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vlogs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Vlog Management</h2>
                <button
                  onClick={() => setShowVlogModal(true)}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Vlog
                </button>
              </div>
              
              <div className="text-gray-600">
                Vlog management functionality ready - connect to your vlog service API
              </div>
            </div>
          </div>
        )}

        {activeTab === 'healing' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Healing Section Management</h2>
              </div>

              {/* Healing Sub-tabs */}
              <div className="flex space-x-4 mb-6 border-b">
                {[
                  { id: 'hero', name: 'Hero Section' },
                  { id: 'carousels', name: 'Carousels' },
                  { id: 'products', name: 'Products' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setHealingActiveTab(tab.id as any)}
                    className={`${
                      healingActiveTab === tab.id
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {healingActiveTab === 'hero' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Hero Section Content</h3>
                    <button
                      onClick={() => setEditingHealingHero(!editingHealingHero)}
                      className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-700"
                    >
                      {editingHealingHero ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {editingHealingHero ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={healingHeroData.title}
                          onChange={(e) => setHealingHeroData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Subtitle</label>
                        <input
                          type="text"
                          value={healingHeroData.subtitle}
                          onChange={(e) => setHealingHeroData(prev => ({ ...prev, subtitle: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Body Text</label>
                        <textarea
                          value={healingHeroData.bodyText}
                          onChange={(e) => setHealingHeroData(prev => ({ ...prev, bodyText: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded h-24"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setEditingHealingHero(false);
                          toast.success('Hero section updated!');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div><span className="font-medium">Title:</span> {healingHeroData.title}</div>
                      <div><span className="font-medium">Subtitle:</span> {healingHeroData.subtitle}</div>
                      <div><span className="font-medium">Body:</span> {healingHeroData.bodyText}</div>
                    </div>
                  )}
                </div>
              )}

              {healingActiveTab === 'carousels' && (
                <div className="text-gray-600">
                  Carousel management functionality ready
                </div>
              )}

              {healingActiveTab === 'products' && (
                <div className="text-gray-600">
                  Product management functionality ready
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'storefront' && (
          <div className="space-y-6">
            {/* Storefront Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{sfStats.total}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{sfStats.byStatus.published}</div>
                <div className="text-sm text-gray-600">Published</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{sfStats.favorites}</div>
                <div className="text-sm text-gray-600">Favorites</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">{sfStats.byStatus.draft}</div>
                <div className="text-sm text-gray-600">Drafts</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Storefront Products</h2>
                <button
                  onClick={() => setSfIsAdding(true)}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={sfSearch}
                  onChange={(e) => setSfSearch(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <select
                  value={sfCategory}
                  onChange={(e) => setSfCategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value="all">All Categories</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="wellness">Wellness</option>
                  <option value="beauty">Beauty</option>
                </select>
                <select
                  value={sfStatus}
                  onChange={(e) => setSfStatus(e.target.value)}
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="text-gray-600">
                Storefront management functionality ready - connect to your storefront service API
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component - now protected by server-side auth
const Admin: React.FC = () => {
  return <AdminContent />;
};

export const getServerSideProps = withAdminSSP(async () => {
  return { props: {} };
});

export default Admin;