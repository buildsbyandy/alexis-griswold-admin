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
  const [stats, setStats] = useState({ total: 0, byFolder: {}, beginners: 0, recipeOfWeek: 0 });
  const [sfItems, setSfItems] = useState<StorefrontProduct[]>([]);
  const [sfEditing, setSfEditing] = useState<StorefrontProduct | null>(null);
  const [sfIsAdding, setSfIsAdding] = useState(false);
  const [sfSearch, setSfSearch] = useState('');
  const [sfCategory, setSfCategory] = useState<string>('all');
  const [sfStatus, setSfStatus] = useState<string>('all');
  const [sfStats, setSfStats] = useState({ total: 0, byStatus: { draft: 0, published: 0, archived: 0 }, byCategory: {}, favorites: 0 });
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

  // Vlog stats state
  const [vlogStats, setVlogStats] = useState({ totalVlogs: 0, featuredVlogs: 0, totalAlbums: 0, totalPhotos: 0 });
  const [spotifyStats, setSpotifyStats] = useState({ totalPlaylists: 0, activePlaylists: 0 });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const recipeStats = await recipeService.getRecipeStats();
        setStats(recipeStats);
        
        const recipesList = await recipeService.getAllRecipes();
        setRecipes(recipesList);

        const storefrontStats = await storefrontService.getStats();
        setSfStats(storefrontStats);

        const storefrontItems = await storefrontService.getAll();
        setSfItems(storefrontItems);

        const vlogStatsData = await vlogService.getStats();
        setVlogStats(vlogStatsData);

        const playlists = await vlogService.getAllPlaylists();
        setSpotifyStats({
          totalPlaylists: playlists.length,
          activePlaylists: playlists.filter(p => p.isActive).length
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    loadData();
  }, []);

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
          <div>
            {/* Header */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <h1 className="text-3xl font-bold text-[#383B26] mb-2">Home Page Management</h1>
              <p className="text-[#8F907E]">Manage the video background and fallback image for your home page</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">1</div>
                  <div className="text-sm text-[#8F907E]">Video Background</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">1</div>
                  <div className="text-sm text-[#8F907E]">Fallback Image</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">Mobile</div>
                  <div className="text-sm text-[#8F907E]">Optimized</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">Auto</div>
                  <div className="text-sm text-[#8F907E]">Fallback</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4">
                <button className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center">
                  <FaDownload className="mr-2" />
                  Export Settings
                </button>
              </div>
            </div>

            {/* Media Management */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#383B26]">Home Page Media</h2>
                  <p className="text-[#8F907E]">Configure the video background and fallback image</p>
                </div>
                <button
                  onClick={() => setEditingHomeContent(!editingHomeContent)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaEdit className="mr-2" />
                  {editingHomeContent ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Video Background */}
                <div>
                  <h3 className="text-lg font-medium text-[#383B26] mb-3 flex items-center">
                    <FaVideo className="mr-2" />
                    Video Background
                  </h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="bg-gray-200 h-48 flex items-center justify-center rounded">
                      <div className="text-center text-gray-500">
                        <FaVideo className="mx-auto mb-2 text-2xl" />
                        <p>Video Preview</p>
                        <p className="text-sm">Current: /alexisHome.mp4</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-[#8F907E]"><strong>Title:</strong> {homePageContent.videoTitle}</p>
                      <p className="text-sm text-[#8F907E] mt-1"><strong>Description:</strong> {homePageContent.videoDescription}</p>
                    </div>
                  </div>
                </div>

                {/* Fallback Image */}
                <div>
                  <h3 className="text-lg font-medium text-[#383B26] mb-3 flex items-center">
                    <FaImage className="mr-2" />
                    Fallback Image
                    <span className="ml-2 px-2 py-1 text-xs bg-[#E3D4C2] text-[#383B26] rounded">Mobile & Fallback</span>
                  </h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="bg-gray-200 h-48 flex items-center justify-center rounded">
                      <div className="text-center text-gray-500">
                        <FaImage className="mx-auto mb-2 text-2xl" />
                        <p>Image Preview</p>
                        <p className="text-sm">Current: /public/images/home-fallback.jpg</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-[#8F907E]"><strong>Usage:</strong> Displayed on mobile devices and as a fallback when video loading fails.</p>
                    </div>
                  </div>
                </div>
              </div>

              {editingHomeContent && (
                <div className="mt-6 space-y-4 border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">
                        Video Background URL
                      </label>
                      <input
                        type="text"
                        value={homePageContent.videoBackground}
                        onChange={(e) => setHomePageContent(prev => ({ ...prev, videoBackground: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">
                        Fallback Image URL
                      </label>
                      <input
                        type="text"
                        value={homePageContent.fallbackImage}
                        onChange={(e) => setHomePageContent(prev => ({ ...prev, fallbackImage: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">
                      Video Title
                    </label>
                    <input
                      type="text"
                      value={homePageContent.videoTitle}
                      onChange={(e) => setHomePageContent(prev => ({ ...prev, videoTitle: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">
                      Video Description
                    </label>
                    <textarea
                      value={homePageContent.videoDescription}
                      onChange={(e) => setHomePageContent(prev => ({ ...prev, videoDescription: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      setEditingHomeContent(false);
                      toast.success('Homepage content updated!');
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Media Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#383B26] mb-4">Media Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-[#383B26] mb-2">Video Behavior</h3>
                  <ul className="text-sm text-[#8F907E] space-y-1">
                    <li>• Auto-play on desktop</li>
                    <li>• Muted by default</li>
                    <li>• Loops continuously</li>
                    <li>• Responsive scaling</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-[#383B26] mb-2">Mobile Experience</h3>
                  <ul className="text-sm text-[#8F907E] space-y-1">
                    <li>• Shows fallback image</li>
                    <li>• Optimized loading</li>
                    <li>• Touch-friendly</li>
                    <li>• Bandwidth conscious</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-[#383B26] mb-2">Fallback Triggers</h3>
                  <ul className="text-sm text-[#8F907E] space-y-1">
                    <li>• Video load failure</li>
                    <li>• Slow connection</li>
                    <li>• Mobile devices</li>
                    <li>• User preference</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div>
            {/* Header */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <h1 className="text-3xl font-bold text-[#383B26] mb-2">Recipe Management</h1>
              <p className="text-[#8F907E]">Add, edit, and organize your recipes</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{stats.total}</div>
                  <div className="text-sm text-[#8F907E]">Total Recipes</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{stats.beginners}</div>
                  <div className="text-sm text-[#8F907E]">Beginner Recipes</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{stats.recipeOfWeek}</div>
                  <div className="text-sm text-[#8F907E]">Recipe of Week</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{Object.keys(stats.byFolder).length}</div>
                  <div className="text-sm text-[#8F907E]">Active Folders</div>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsAddingRecipe(true)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add New Recipe
                </button>
                <button className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center">
                  <FaDownload className="mr-2" />
                  Export
                </button>
                <button className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center">
                  <FaUploadIcon className="mr-2" />
                  Import
                </button>
                <button className="px-4 py-2 bg-[#A0956C] text-white rounded-md hover:bg-[#8F907E] flex items-center">
                  <FaStar className="mr-2" />
                  Restore Sample
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <option value="all">All Folders</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snacks">Snacks</option>
                  <option value="desserts">Desserts</option>
                  <option value="beverages">Beverages</option>
                </select>
              </div>
            </div>

            {/* Recipe Cards Grid */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#383B26] mb-4">Recipe Collection</h2>
              
              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes
                    .filter(recipe => 
                      (selectedFolder === 'all' || recipe.folder === selectedFolder) &&
                      (searchTerm === '' || recipe.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(recipe => (
                      <div key={recipe.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Recipe Image */}
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                          {recipe.imageUrl ? (
                            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center text-gray-500">
                              <FaUtensils className="mx-auto mb-2 text-2xl" />
                              <p className="text-sm">No Image</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Recipe Info */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-[#383B26] truncate">{recipe.title}</h3>
                            {recipe.isFavorite && <FaStar className="text-yellow-500 ml-2" />}
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-[#8F907E]">
                              <strong>Category:</strong> {recipe.folder || 'Uncategorized'}
                            </p>
                            <p className="text-sm text-[#8F907E]">
                              <strong>Difficulty:</strong> {recipe.difficulty}
                            </p>
                            {recipe.prepTime && (
                              <p className="text-sm text-[#8F907E]">
                                <strong>Prep Time:</strong> {recipe.prepTime}
                              </p>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {recipe.description || 'No description available'}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingRecipe(recipe)}
                              className="flex-1 px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C] flex items-center justify-center"
                            >
                              <FaEdit className="mr-1" />
                              Edit
                            </button>
                            <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUtensils className="mx-auto text-6xl text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-500 mb-2">No recipes yet</h3>
                  <p className="text-gray-400 mb-6">Get started by adding your first recipe</p>
                  <button
                    onClick={() => setIsAddingRecipe(true)}
                    className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                  >
                    <FaPlus className="mr-2" />
                    Add Your First Recipe
                  </button>
                </div>
              )}
            </div>

            {/* Recipe Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Recipe Categories</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byFolder).map(([folder, count]) => (
                    <div key={folder} className="flex justify-between">
                      <span className="text-[#8F907E] capitalize">{folder}:</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Published:</span>
                    <span className="font-medium">{recipes.filter(r => r.isPublished).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Drafts:</span>
                    <span className="font-medium">{recipes.filter(r => !r.isPublished).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Favorites:</span>
                    <span className="font-medium">{recipes.filter(r => r.isFavorite).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Last Updated:</span>
                    <span className="font-medium">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vlogs' && (
          <div>
            {/* Header */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <h1 className="text-3xl font-bold text-[#383B26] mb-2">Vlogs Content Management</h1>
              <p className="text-[#8F907E]">Manage all content visible on your vlogs page</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{vlogStats.totalVlogs}</div>
                  <div className="text-sm text-[#8F907E]">Total Videos</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{vlogStats.totalAlbums}</div>
                  <div className="text-sm text-[#8F907E]">Photo Albums</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{spotifyStats.totalPlaylists}</div>
                  <div className="text-sm text-[#8F907E]">Spotify Playlists</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{vlogStats.featuredVlogs}</div>
                  <div className="text-sm text-[#8F907E]">Featured Video</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowVlogModal(true)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Quick Add Vlog
                </button>
                <button
                  onClick={() => setShowAlbumModal(true)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Quick Add Album
                </button>
                <button className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center">
                  <FaDownload className="mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Vlog Section Navigation */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex space-x-6 border-b">
                <button className="px-4 py-2 border-b-2 border-[#B8A692] text-[#383B26] font-medium flex items-center">
                  <FaStar className="mr-2" />
                  Hero Section
                </button>
                <button className="px-4 py-2 border-b-2 border-transparent text-[#8F907E] hover:text-[#383B26] flex items-center">
                  <FaVideo className="mr-2" />
                  Video Carousels
                </button>
                <button className="px-4 py-2 border-b-2 border-transparent text-[#8F907E] hover:text-[#383B26] flex items-center">
                  <FaImage className="mr-2" />
                  Photo Gallery
                </button>
                <button className="px-4 py-2 border-b-2 border-transparent text-[#8F907E] hover:text-[#383B26] flex items-center">
                  <FaVideo className="mr-2" />
                  Spotify Section
                </button>
              </div>
            </div>

            {/* Hero Section Content */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#383B26]">Hero Section Content</h2>
                  <p className="text-[#8F907E] text-sm">Configure the main hero area of your vlogs page</p>
                </div>
                <button className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center">
                  <FaEdit className="mr-2" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hero Text Content */}
                <div>
                  <h3 className="font-medium text-[#383B26] mb-3">Hero Title</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-2xl font-bold text-[#383B26] mb-2">VLOGS</h2>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-[#8F907E]"><strong>Hero Subtitle:</strong></p>
                        <p className="text-sm">Step into my life — one video at a time.</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8F907E]"><strong>Hero Body Text:</strong></p>
                        <p className="text-sm">Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with passion, purpose, and the simple joys that make each day extraordinary.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Featured Video */}
                <div>
                  <h3 className="font-medium text-[#383B26] mb-3">Featured Video</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="bg-gray-200 h-32 flex items-center justify-center rounded mb-3">
                      <div className="text-center text-gray-500">
                        <FaVideo className="mx-auto mb-2 text-xl" />
                        <p className="text-sm">Video Preview</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Current:</strong> Morning Routine & Healthy Breakfast</p>
                      <p className="text-sm text-[#8F907E]"><strong>Duration:</strong> 8:32</p>
                      <p className="text-sm text-[#8F907E]"><strong>Published:</strong> Jan 15, 2024</p>
                    </div>
                    <button className="w-full mt-3 px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] text-sm">
                      Change Featured Video
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Video Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Total Views:</span>
                    <span className="font-medium">64.2K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Avg. Duration:</span>
                    <span className="font-medium">11:54</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Featured Views:</span>
                    <span className="font-medium">12.5K</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Photo Gallery Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Total Photos:</span>
                    <span className="font-medium">{vlogStats.totalPhotos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Albums:</span>
                    <span className="font-medium">{vlogStats.totalAlbums}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Categories:</span>
                    <span className="font-medium">6</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Spotify Integration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Active Playlists:</span>
                    <span className="font-medium">{spotifyStats.activePlaylists}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Total Playlists:</span>
                    <span className="font-medium">{spotifyStats.totalPlaylists}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Last Updated:</span>
                    <span className="font-medium">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'healing' && (
          <div>
            {/* Header */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <h1 className="text-3xl font-bold text-[#383B26] mb-2">Healing Section Management</h1>
              <p className="text-[#8F907E]">Manage your healing page content and product recommendations</p>
            </div>

            {/* Healing Sub-tabs */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex space-x-6 border-b">
                {[
                  { id: 'hero', name: 'Hero Section', icon: FaStar },
                  { id: 'carousels', name: 'Video Carousels', icon: FaVideo },
                  { id: 'products', name: 'Products & Supplements', icon: FaHeartbeat }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setHealingActiveTab(tab.id as any)}
                      className={`${
                        healingActiveTab === tab.id
                          ? 'border-[#B8A692] text-[#383B26]'
                          : 'border-transparent text-[#8F907E] hover:text-[#383B26]'
                      } px-4 py-2 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <Icon className="mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {healingActiveTab === 'hero' && (
              <div className="space-y-6">
                {/* Hero Content */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#383B26]">Hero Section Content</h2>
                      <p className="text-[#8F907E] text-sm">Configure the main hero area and featured video</p>
                    </div>
                    <button
                      onClick={() => setEditingHealingHero(!editingHealingHero)}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaEdit className="mr-2" />
                      {editingHealingHero ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Text Content */}
                    <div>
                      {editingHealingHero ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[#383B26] mb-1">Title</label>
                            <input
                              type="text"
                              value={healingHeroData.title}
                              onChange={(e) => setHealingHeroData(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#383B26] mb-1">Subtitle</label>
                            <input
                              type="text"
                              value={healingHeroData.subtitle}
                              onChange={(e) => setHealingHeroData(prev => ({ ...prev, subtitle: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#383B26] mb-1">Body Text</label>
                            <textarea
                              value={healingHeroData.bodyText}
                              onChange={(e) => setHealingHeroData(prev => ({ ...prev, bodyText: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md h-32 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            />
                          </div>
                          <button
                            onClick={() => {
                              setEditingHealingHero(false);
                              toast.success('Hero section updated!');
                            }}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                          >
                            <FaSave className="mr-2" />
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-2xl font-bold text-[#383B26] mb-2">{healingHeroData.title}</h3>
                          <p className="text-lg text-[#8F907E] mb-3">{healingHeroData.subtitle}</p>
                          <p className="text-sm text-gray-700">{healingHeroData.bodyText}</p>
                        </div>
                      )}
                    </div>

                    {/* Featured Video */}
                    <div>
                      <h3 className="font-medium text-[#383B26] mb-3">Featured Video</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="bg-gray-200 h-32 flex items-center justify-center rounded mb-3">
                          <div className="text-center text-gray-500">
                            <FaVideo className="mx-auto mb-2 text-xl" />
                            <p className="text-sm">Video Preview</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm"><strong>Current:</strong> {healingHeroData.featuredVideoTitle}</p>
                          <p className="text-sm text-[#8F907E]"><strong>Published:</strong> {healingHeroData.featuredVideoDate}</p>
                        </div>
                        <button className="w-full mt-3 px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] text-sm">
                          Change Featured Video
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {healingActiveTab === 'carousels' && (
              <div className="space-y-6">
                {/* Carousel Headers */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#383B26]">Carousel Headers</h2>
                      <p className="text-[#8F907E] text-sm">Manage the titles and subtitles for video carousels</p>
                    </div>
                    <button
                      onClick={() => setEditingCarouselHeaders(!editingCarouselHeaders)}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaEdit className="mr-2" />
                      {editingCarouselHeaders ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium text-[#383B26] mb-2">Gut Healing Part 1: Candida Cleanse</h3>
                      <p className="text-sm text-[#8F907E]">Educational videos for candida cleansing process</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium text-[#383B26] mb-2">Gut Healing Part 2: Rebuild & Repair</h3>
                      <p className="text-sm text-[#8F907E]">Videos focused on rebuilding gut health after cleansing</p>
                    </div>
                  </div>
                </div>

                {/* Video Management */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-[#383B26] mb-4">Video Content</h2>
                  <div className="text-center py-8 text-gray-500">
                    <FaVideo className="mx-auto mb-3 text-3xl" />
                    <p>Video management functionality ready</p>
                    <p className="text-sm">Connect to your video service to manage healing content</p>
                  </div>
                </div>
              </div>
            )}

            {healingActiveTab === 'products' && (
              <div className="space-y-6">
                {/* Products Header */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#383B26]">Healing Products & Supplements</h2>
                      <p className="text-[#8F907E] text-sm">Essential products to support your healing journey</p>
                    </div>
                    <button className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center">
                      <FaPlus className="mr-2" />
                      Add Product
                    </button>
                  </div>

                  {/* Sample Products */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'Premium Probiotic Complex', price: '$45.99', category: 'Gut Health' },
                      { name: 'Candida Cleanse Formula', price: '$32.99', category: 'Detox' },
                      { name: 'Digestive Enzyme Blend', price: '$28.99', category: 'Digestion' }
                    ].map((product, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="bg-gray-200 h-24 rounded mb-3 flex items-center justify-center">
                          <FaHeartbeat className="text-gray-400 text-xl" />
                        </div>
                        <h3 className="font-medium text-[#383B26] mb-1">{product.name}</h3>
                        <p className="text-sm text-[#8F907E] mb-2">{product.category}</p>
                        <p className="font-bold text-[#383B26]">{product.price}</p>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C]">
                            Edit
                          </button>
                          <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'storefront' && (
          <div>
            {/* Header */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <h1 className="text-3xl font-bold text-[#383B26] mb-2">Storefront Management</h1>
              <p className="text-[#8F907E]">Manage your product catalog and storefront settings</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{sfStats.total}</div>
                  <div className="text-sm text-[#8F907E]">Total Products</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{sfStats.byStatus.published}</div>
                  <div className="text-sm text-[#8F907E]">Published</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{sfStats.favorites}</div>
                  <div className="text-sm text-[#8F907E]">Favorites</div>
                </div>
                <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#383B26]">{sfStats.byStatus.draft}</div>
                  <div className="text-sm text-[#8F907E]">Drafts</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSfIsAdding(true)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add New Product
                </button>
                <button className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center">
                  <FaDownload className="mr-2" />
                  Export Catalog
                </button>
                <button className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center">
                  <FaUploadIcon className="mr-2" />
                  Import Products
                </button>
                <button className="px-4 py-2 bg-[#A0956C] text-white rounded-md hover:bg-[#8F907E] flex items-center">
                  <FaStar className="mr-2" />
                  Featured Products
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={sfSearch}
                  onChange={(e) => setSfSearch(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
                <select
                  value={sfCategory}
                  onChange={(e) => setSfCategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <option value="all">All Categories</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="wellness">Wellness</option>
                  <option value="beauty">Beauty</option>
                  <option value="fitness">Fitness</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
                <select
                  value={sfStatus}
                  onChange={(e) => setSfStatus(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#383B26] mb-4">Product Catalog</h2>
              
              {sfItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sfItems
                    .filter(product => {
                      const matchesCategory = sfCategory === 'all' || product.category === sfCategory;
                      const matchesStatus = sfStatus === 'all' || product.status === sfStatus;
                      const matchesSearch = sfSearch === '' || product.title.toLowerCase().includes(sfSearch.toLowerCase());
                      return matchesCategory && matchesStatus && matchesSearch;
                    })
                    .map(product => (
                      <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Product Image */}
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center text-gray-500">
                              <FaStore className="mx-auto mb-2 text-2xl" />
                              <p className="text-sm">No Image</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-[#383B26] truncate">{product.title}</h3>
                            {product.isFavorite && <FaStar className="text-yellow-500 ml-2" />}
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-[#8F907E]">
                              <strong>Category:</strong> {product.category}
                            </p>
                            <p className="text-sm text-[#8F907E]">
                              <strong>Status:</strong> 
                              <span className={`ml-1 px-2 py-1 text-xs rounded ${
                                product.status === 'published' ? 'bg-green-100 text-green-800' :
                                product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {product.status}
                              </span>
                            </p>
                            <p className="text-lg font-bold text-[#383B26]">
                              ${product.price}
                            </p>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {product.description || 'No description available'}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSfEditing(product)}
                              className="flex-1 px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C] flex items-center justify-center"
                            >
                              <FaEdit className="mr-1" />
                              Edit
                            </button>
                            <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaStore className="mx-auto text-6xl text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-500 mb-2">No products yet</h3>
                  <p className="text-gray-400 mb-6">Start building your storefront by adding your first product</p>
                  <button
                    onClick={() => setSfIsAdding(true)}
                    className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                  >
                    <FaPlus className="mr-2" />
                    Add Your First Product
                  </button>
                </div>
              )}
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Product Categories</h3>
                <div className="space-y-2">
                  {Object.entries(sfStats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-[#8F907E] capitalize">{category}:</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Status Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Published:</span>
                    <span className="font-medium text-green-600">{sfStats.byStatus.published}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Drafts:</span>
                    <span className="font-medium text-yellow-600">{sfStats.byStatus.draft}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Archived:</span>
                    <span className="font-medium text-gray-600">{sfStats.byStatus.archived}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Avg. Price:</span>
                    <span className="font-medium">$34.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Best Seller:</span>
                    <span className="font-medium">Kitchen Tools</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Last Updated:</span>
                    <span className="font-medium">Today</span>
                  </div>
                </div>
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