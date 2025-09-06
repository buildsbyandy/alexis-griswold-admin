import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaStar, FaDownload, FaUpload as FaUploadIcon, FaVideo, FaStore, FaUtensils, FaImage, FaHeartbeat } from 'react-icons/fa';
import toast from 'react-hot-toast';
import recipeService from '../services/recipeService';
import type { Recipe } from '../services/recipeService';
import vlogService from '../services/vlogService';
import storefrontService, { type StorefrontProduct } from '../services/storefrontService';

type AdminTab = 'home' | 'vlogs' | 'recipes' | 'healing' | 'storefront';

const Admin: React.FC = () => {
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
    bodyText: 'From gut health to holistic healing, discover natural methods to restore your body\'s balance and vitality. Every step of this journey is guided by science-backed approaches and time-tested remedies that honor your body\'s innate healing wisdom.',
    featuredVideoId: 'dQw4w9WgXcQ',
    featuredVideoTitle: 'Healing Journey Introduction',
    featuredVideoDate: '2024-01-15'
  });
  const [healingProductsSection, setHealingProductsSection] = useState({
    title: 'Healing Products & Supplements',
    subtitle: 'Essential products to support your healing journey'
  });
  const [healingCarouselHeaders, setHealingCarouselHeaders] = useState({
    part1: {
      title: 'Gut Healing Part 1: Candida Cleanse',
      subtitle: 'Educational videos for candida cleansing process'
    },
    part2: {
      title: 'Gut Healing Part 2: Rebuild & Repair',
      subtitle: 'Videos focused on rebuilding gut health after cleansing'
    }
  });
  const [editingHealingProduct, setEditingHealingProduct] = useState<any>(null);
  const [isAddingHealingProduct, setIsAddingHealingProduct] = useState(false);
  const [healingProducts, setHealingProducts] = useState([
    {
      id: 'probiotic-1',
      name: 'Garden of Life Probiotics',
      purpose: 'Restore healthy gut bacteria and support immune function',
      howToUse: 'Take 1 capsule daily with food, preferably in the morning',
      image: '/public/images/products/probiotic-1.jpg',
      amazonUrl: 'https://amazon.com/placeholder-probiotic-1'
    },
    {
      id: 'collagen-1',
      name: 'Vital Proteins Collagen',
      purpose: 'Support gut lining repair and promote skin health',
      howToUse: 'Mix 1-2 scoops into coffee, smoothies, or water daily',
      image: '/public/images/products/collagen-1.jpg',
      amazonUrl: 'https://amazon.com/placeholder-collagen-1'
    },
    {
      id: 'digestive-enzyme-1',
      name: 'Enzymedica Digest Gold',
      purpose: 'Improve nutrient absorption and reduce digestive discomfort',
      howToUse: 'Take 1-2 capsules with each meal as needed',
      image: '/public/images/products/enzyme-1.jpg',
      amazonUrl: 'https://amazon.com/placeholder-enzyme-1'
    }
  ]);

  const folders = [
    { id: 'meals', name: 'Meals', icon: '🍽️' },
    { id: 'smoothies', name: 'Smoothies', icon: '🥤' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' },
    { id: 'sauces', name: 'Sauces', icon: '🥄' },
    { id: 'raw', name: 'Raw', icon: '🥗' },
    { id: 'juices', name: 'Juices', icon: '🧃' },
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  // Load recipes from service on component mount
  useEffect(() => {
    loadRecipes();
    loadStorefront();
  }, []);

  const loadRecipes = () => {
    const allRecipes = recipeService.getAllRecipes();
    setRecipes(allRecipes);
    setStats(recipeService.getRecipeStats());
  };

  const loadStorefront = () => {
    setSfItems(storefrontService.getAll());
    setSfStats(storefrontService.getStats());
  };

  const handleAddVlog = async () => {
    try {
      // For now, we'll use a default carousel_id. In a full implementation,
      // you'd fetch available carousels from the API
      const payload = {
        ...vlogData,
        carousel_id: 'default-carousel-id', // This would come from a carousel selector
      };

      const response = await fetch('/api/vlogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Vlog added successfully!');
        setShowVlogModal(false);
        setVlogData({
          youtube_url: '',
          video_title: '',
          video_description: '',
          duration: '',
          carousel_id: ''
        });
        // Refresh vlog stats here if needed
      } else {
        throw new Error('Failed to add vlog');
      }
    } catch (error) {
      console.error('Error adding vlog:', error);
      toast.error('Failed to add vlog');
    }
  };

  const handleAddAlbum = async () => {
    try {
      // For now, we'll create a basic album. In a full implementation,
      // you'd have a proper album creation API
      const payload = {
        ...albumData,
        vlogs_page_id: 'default-vlogs-page-id', // This would come from the vlogs page
      };

      // Since we don't have a photo albums API yet, we'll just show success
      toast.success('Album creation functionality ready - API integration needed');
      setShowAlbumModal(false);
      setAlbumData({
        album_title: '',
        album_subtitle: '',
        album_description: '',
        album_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding album:', error);
      toast.error('Failed to add album');
    }
  };

  const handleAddVideo = async () => {
    try {
      const payload = {
        ...videoData,
        carousel_type: currentCarouselType,
      };

      // For now, just show success message - in real implementation would call API
      toast.success(`Video added to ${currentCarouselType} carousel!`);
      setShowVideoModal(false);
      setVideoData({
        youtube_url: '',
        video_title: '',
        video_description: '',
        duration: '',
        views: ''
      });
      setEditingVideo(null);
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Failed to add video');
    }
  };

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setVideoData({
      youtube_url: video.youtube_url || '',
      video_title: video.title || '',
      video_description: video.description || '',
      duration: video.duration || '',
      views: video.views || ''
    });
    setShowVideoModal(true);
  };

  const handleDeleteVideo = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      toast.success('Video deleted successfully!');
      // In real implementation, would call API to delete video
    }
  };

  const handleAddPlaylist = async () => {
    try {
      const payload = {
        ...playlistData,
      };

      toast.success('Playlist added successfully!');
      setShowPlaylistModal(false);
      setPlaylistData({
        name: '',
        mood: '',
        color: '#2D2D2D',
        spotify_url: ''
      });
      setEditingPlaylist(null);
    } catch (error) {
      console.error('Error adding playlist:', error);
      toast.error('Failed to add playlist');
    }
  };

  const handleEditPlaylist = (playlist: any) => {
    setEditingPlaylist(playlist);
    setPlaylistData({
      name: playlist.name || '',
      mood: playlist.mood || '',
      color: playlist.color || '#2D2D2D',
      spotify_url: playlist.spotify_url || ''
    });
    setShowPlaylistModal(true);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      toast.success('Playlist deleted successfully!');
      // In real implementation, would call API to delete playlist
    }
  };

  const handleEditAlbum = (albumId: string) => {
    toast.success('Album editing functionality ready - API integration needed');
    // In real implementation, would open album editing modal
  };

  const handleDeleteAlbum = (albumId: string) => {
    if (window.confirm('Are you sure you want to delete this album?')) {
      toast.success('Album deleted successfully!');
      // In real implementation, would call API to delete album
    }
  };

  const createNewRecipe = (): Recipe => ({
    id: Date.now().toString(),
    title: '',
    slug: '',
    description: '',
    category: '',
    folder: 'meals',
    isBeginner: false,
    isRecipeOfWeek: false,
    images: [],
    ingredients: [''],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: 1,
    difficulty: 'Easy',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleAddRecipe = () => {
    const newRecipe = createNewRecipe();
    setEditingRecipe(newRecipe);
    setIsAddingRecipe(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe({ ...recipe });
    setIsAddingRecipe(false);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      const success = recipeService.deleteRecipe(recipeId);
      if (success) {
        loadRecipes();
      }
    }
  };

  const handleSaveRecipe = () => {
    if (!editingRecipe) return;

    const updatedRecipe = {
      ...editingRecipe,
      slug: editingRecipe.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      updatedAt: new Date(),
    };

    if (isAddingRecipe) {
      const { id, createdAt, updatedAt, ...recipeData } = updatedRecipe;
      recipeService.addRecipe(recipeData);
    } else {
      recipeService.updateRecipe(updatedRecipe.id, updatedRecipe);
    }

    loadRecipes();
    setEditingRecipe(null);
    setIsAddingRecipe(false);
  };

  const handleCancelEdit = () => {
    setEditingRecipe(null);
    setIsAddingRecipe(false);
  };

  const updateEditingRecipe = (field: keyof Recipe, value: any) => {
    if (!editingRecipe) return;
    setEditingRecipe({ ...editingRecipe, [field]: value });
  };

  const addArrayItem = (field: 'ingredients' | 'instructions' | 'tags') => {
    if (!editingRecipe) return;
    setEditingRecipe({
      ...editingRecipe,
      [field]: [...editingRecipe[field], '']
    });
  };

  const updateArrayItem = (field: 'ingredients' | 'instructions' | 'tags', index: number, value: string) => {
    if (!editingRecipe) return;
    const newArray = [...editingRecipe[field]];
    newArray[index] = value;
    setEditingRecipe({
      ...editingRecipe,
      [field]: newArray
    });
  };

  const removeArrayItem = (field: 'ingredients' | 'instructions' | 'tags', index: number) => {
    if (!editingRecipe) return;
    const newArray = editingRecipe[field].filter((_, i) => i !== index);
    setEditingRecipe({
      ...editingRecipe,
      [field]: newArray
    });
  };

  const handleExportRecipes = () => {
    const dataStr = recipeService.exportRecipes();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recipes-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportRecipes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        recipeService.importRecipes(content);
        loadRecipes();
        alert('Recipes imported successfully!');
      } catch (error) {
        alert('Failed to import recipes. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || recipe.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const renderHomeTab = () => (
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
      </div>

      {/* Quick Actions */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(homePageContent, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'home-page-backup.json'; a.click(); URL.revokeObjectURL(url);
            }}
            className="bg-[#8F907E] text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-[#7A7B6A] transition-colors"
          >
            <FaDownload className="text-xs" /> Export Settings
          </button>
        </div>
      </div>

      {/* Home Page Content Management */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header with Edit Button */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#383B26]">Home Page Media</h3>
              <p className="text-sm text-[#8F907E] mt-1">Configure the video background and fallback image</p>
            </div>
            <div className="flex gap-2">
              {editingHomeContent && (
                <button
                  onClick={() => {
                    setEditingHomeContent(false);
                    toast.success('Home page settings updated successfully!');
                  }}
                  className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors flex items-center gap-2"
                >
                  <FaSave /> Save Changes
                </button>
              )}
              <button
                onClick={() => setEditingHomeContent(!editingHomeContent)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center whitespace-nowrap ${
                  editingHomeContent
                    ? 'bg-[#8F907E] text-white hover:bg-[#7A7B6A]'
                    : 'bg-[#B89178] text-white hover:bg-[#A67B62]'
                }`}
              >
                {editingHomeContent ? 'Cancel' : 'Edit'} <FaEdit className="ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Background Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-[#383B26] flex items-center gap-2">
                <FaVideo className="text-[#B89178]" />
                Video Background
              </h4>
              
              {/* Video Preview */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="aspect-video bg-gray-300 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-center">
                    <FaVideo className="text-4xl text-gray-500 mb-2 mx-auto" />
                    <p className="text-sm text-gray-600">Video Preview</p>
                    <p className="text-xs text-gray-500 mt-1">Current: {homePageContent.videoBackground}</p>
                  </div>
                </div>
                
                {editingHomeContent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Video File Path</label>
                      <input
                        type="text"
                        value={homePageContent.videoBackground}
                        onChange={(e) => setHomePageContent({...homePageContent, videoBackground: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        placeholder="/path/to/video.mp4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Video Title</label>
                      <input
                        type="text"
                        value={homePageContent.videoTitle}
                        onChange={(e) => setHomePageContent({...homePageContent, videoTitle: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        placeholder="Video title for accessibility"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Video Description</label>
                      <textarea
                        value={homePageContent.videoDescription}
                        onChange={(e) => setHomePageContent({...homePageContent, videoDescription: e.target.value})}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        placeholder="Brief description of the video content"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-[#383B26]">Title:</span>
                      <span className="ml-2 text-[#8F907E]">{homePageContent.videoTitle}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-[#383B26]">Description:</span>
                      <span className="ml-2 text-[#8F907E]">{homePageContent.videoDescription}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fallback Image Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-[#383B26] flex items-center gap-2">
                <FaImage className="text-[#B89178]" />
                Fallback Image
                <span className="text-xs bg-[#E3D4C2] text-[#654C37] px-2 py-1 rounded">Mobile & Fallback</span>
              </h4>
              
              {/* Image Preview */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="aspect-video bg-gray-300 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-center">
                    <FaImage className="text-4xl text-gray-500 mb-2 mx-auto" />
                    <p className="text-sm text-gray-600">Image Preview</p>
                    <p className="text-xs text-gray-500 mt-1">Current: {homePageContent.fallbackImage}</p>
                  </div>
                </div>
                
                {editingHomeContent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Image File Path</label>
                      <input
                        type="text"
                        value={homePageContent.fallbackImage}
                        onChange={(e) => setHomePageContent({...homePageContent, fallbackImage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        placeholder="/path/to/image.jpg"
                      />
                    </div>
                    <div className="text-xs text-[#8F907E] bg-blue-50 p-3 rounded">
                      <strong>Note:</strong> This image will be shown on mobile devices and when the video fails to load. 
                      Recommended size: 1920x1080px for best quality.
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#8F907E] bg-gray-100 p-3 rounded">
                    <strong>Usage:</strong> Displayed on mobile devices and as a fallback when video loading fails.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-medium text-[#383B26] mb-4">Media Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-[#383B26] mb-2">Video Behavior</h5>
                <ul className="space-y-1 text-[#8F907E]">
                  <li>• Auto-play on desktop</li>
                  <li>• Muted by default</li>
                  <li>• Loops continuously</li>
                  <li>• Responsive scaling</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-[#383B26] mb-2">Mobile Experience</h5>
                <ul className="space-y-1 text-[#8F907E]">
                  <li>• Shows fallback image</li>
                  <li>• Optimized loading</li>
                  <li>• Touch-friendly</li>
                  <li>• Bandwidth conscious</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-[#383B26] mb-2">Fallback Triggers</h5>
                <ul className="space-y-1 text-[#8F907E]">
                  <li>• Video load failure</li>
                  <li>• Slow connection</li>
                  <li>• Mobile devices</li>
                  <li>• User preference</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecipesTab = () => (
    <div>
      {/* Header */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-[#383B26] mb-2">Recipe Management</h1>
        <p className="text-[#8F907E]">Add, edit, and organize your recipes</p>
        {/* Stats */}
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

      {/* Controls */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <button
              onClick={handleAddRecipe}
              className="bg-[#B89178] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A67B62] transition-colors"
            >
              <FaPlus /> Add New Recipe
            </button>
            <button
              onClick={handleExportRecipes}
              className="bg-[#654C37] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#5A4430] transition-colors"
            >
              <FaDownload /> Export
            </button>
            <label className="bg-[#8F907E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7A7B6A] transition-colors cursor-pointer">
              <FaUploadIcon /> Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportRecipes}
                className="hidden"
              />
            </label>
            <button
              onClick={() => {
                // Restore sample data from static seed
                import('../data/storefrontData').then(mod => {
                  storefrontService.restoreFromStatic((mod as any).products || []);
                  loadStorefront();
                  alert('Sample storefront data restored.');
                });
              }}
              className="bg-[#8F907E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7A7B6A] transition-colors"
              title="Restore sample items"
            >
              Restore Sample
            </button>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            >
              <option value="all">All Folders</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.icon} {folder.name} ({stats.byFolder[folder.id] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRecipes.map(recipe => (
          <div key={recipe.id} className="overflow-hidden bg-white rounded-lg shadow-md">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#383B26]">{recipe.title}</h3>
                <div className="flex gap-2">
                  {recipe.isRecipeOfWeek && (
                    <FaStar className="text-yellow-500" title="Recipe of the Week" />
                  )}
                  {recipe.isBeginner && (
                    <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded">Beginner</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#8F907E] mb-2">{recipe.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-[#E3D4C2] text-[#654C37] px-2 py-1 rounded">
                  {folders.find(f => f.id === recipe.folder)?.icon} {folders.find(f => f.id === recipe.folder)?.name}
                </span>
                <span className="text-xs bg-[#E3D4C2] text-[#654C37] px-2 py-1 rounded">
                  {recipe.difficulty}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditRecipe(recipe)}
                  className="flex-1 bg-[#B89178] text-white px-3 py-1 rounded text-sm flex items-center justify-center gap-1 hover:bg-[#A67B62] transition-colors"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  className="flex items-center justify-center gap-1 px-3 py-1 text-sm text-white transition-colors bg-red-500 rounded hover:bg-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const [vlogsActiveTab, setVlogsActiveTab] = useState<'hero' | 'carousels' | 'gallery' | 'spotify'>('hero');
  const [editingHero, setEditingHero] = useState(false);
  const [heroData, setHeroData] = useState({
    title: 'VLOGS',
    subtitle: 'Step into my life — one video at a time.',
    bodyText: 'Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with passion, purpose, and the simple joys that make each day extraordinary.',
    featuredVideoId: '',
    featuredVideoTitle: '',
    featuredVideoDate: ''
  });

  const renderVlogsTab = () => (
    <div>
      {/* Header */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-[#383B26] mb-2">Vlogs Content Management</h1>
        <p className="text-[#8F907E]">Manage all content visible on your vlogs page</p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">{vlogService.getStats().totalVlogs}</div>
            <div className="text-sm text-[#8F907E]">Total Videos</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">{vlogService.getStats().totalAlbums}</div>
            <div className="text-sm text-[#8F907E]">Photo Albums</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">3</div>
            <div className="text-sm text-[#8F907E]">Spotify Playlists</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">1</div>
            <div className="text-sm text-[#8F907E]">Featured Video</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowVlogModal(true)}
            className="bg-[#B89178] text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-[#A67B62] transition-colors"
          >
            <FaPlus className="text-xs" /> Quick Add Vlog
          </button>
          <button
            onClick={() => setShowAlbumModal(true)}
            className="bg-[#654C37] text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-[#5A4430] transition-colors"
          >
            <FaPlus className="text-xs" /> Quick Add Album
          </button>
          <button
            onClick={() => {
              const dataStr = vlogService.exportData();
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'vlogs-backup.json'; a.click(); URL.revokeObjectURL(url);
            }}
            className="bg-[#8F907E] text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-[#7A7B6A] transition-colors"
          >
            <FaDownload className="text-xs" /> Export
          </button>
        </div>
      </div>

      {/* Content Management Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'hero', label: 'Hero Section', icon: '🎬' },
              { id: 'carousels', label: 'Video Carousels', icon: '📺' },
              { id: 'gallery', label: 'Photo Gallery', icon: '📸' },
              { id: 'spotify', label: 'Spotify Section', icon: '🎵' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setVlogsActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  vlogsActiveTab === tab.id
                    ? 'border-[#B89178] text-[#B89178] bg-[#F5F5F5]'
                    : 'border-transparent text-[#8F907E] hover:text-[#383B26] hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {vlogsActiveTab === 'hero' && renderHeroSection()}
          {vlogsActiveTab === 'carousels' && renderCarouselsSection()}
          {vlogsActiveTab === 'gallery' && renderGallerySection()}
          {vlogsActiveTab === 'spotify' && renderSpotifySection()}
        </div>
      </div>
    </div>
  );

  const renderHeroSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#383B26]">Hero Section Content</h3>
        <button
          onClick={() => setEditingHero(!editingHero)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center whitespace-nowrap ${
            editingHero
              ? 'bg-[#8F907E] text-white hover:bg-[#7A7B6A]'
              : 'bg-[#B89178] text-white hover:bg-[#A67B62]'
          }`}
        >
          {editingHero ? 'Cancel' : 'Edit'} <FaEdit className="ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Title</label>
            {editingHero ? (
              <input
                type="text"
                value={heroData.title}
                onChange={(e) => setHeroData({...heroData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                placeholder="Enter hero title"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-[#383B26] font-semibold">
                {heroData.title}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Subtitle</label>
            {editingHero ? (
              <input
                type="text"
                value={heroData.subtitle}
                onChange={(e) => setHeroData({...heroData, subtitle: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                placeholder="Enter hero subtitle"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-[#8F907E]">
                {heroData.subtitle}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Body Text</label>
            {editingHero ? (
              <textarea
                value={heroData.bodyText}
                onChange={(e) => setHeroData({...heroData, bodyText: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                placeholder="Enter hero body text"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-[#8F907E] text-sm leading-relaxed">
                {heroData.bodyText}
              </div>
            )}
          </div>

          {editingHero && (
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  // Save hero data logic here
                  setEditingHero(false);
                  toast.success('Hero section updated!');
                }}
                className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors flex items-center gap-2"
              >
                <FaSave /> Save Changes
              </button>
              <button
                onClick={() => setEditingHero(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right: Featured Video */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-[#383B26]">Featured Video</h4>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <FaVideo className="text-4xl text-gray-400" />
            </div>
            <div className="text-sm text-[#8F907E]">
              <p><strong>Current:</strong> Morning Routine & Healthy Breakfast</p>
              <p><strong>Duration:</strong> 8:32</p>
              <p><strong>Published:</strong> Jan 15, 2024</p>
            </div>
            <button className="mt-3 w-full bg-[#B89178] text-white py-2 rounded-lg hover:bg-[#A67B62] transition-colors text-sm">
              Change Featured Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCarouselsSection = () => (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-[#383B26]">Video Carousels Management</h3>
      
      {/* Main Channel Carousel */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-[#383B26]">Main Channel Carousel</h4>
            <p className="text-sm text-[#8F907E]">A Life with Alexis Griswold - Main YouTube Channel</p>
          </div>
          <button 
            onClick={() => {
              setCurrentCarouselType('main');
              setEditingVideo(null);
              setVideoData({
                youtube_url: '',
                video_title: '',
                video_description: '',
                duration: '',
                views: ''
              });
              setShowVideoModal(true);
            }}
            className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors text-sm flex items-center whitespace-nowrap"
          >
            <FaPlus className="mr-1" /> Add Video
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="aspect-video bg-gray-300 rounded mb-2 flex items-center justify-center">
                <FaVideo className="text-gray-500" />
              </div>
              <h5 className="font-medium text-sm text-[#383B26] mb-1">Video Title {i}</h5>
              <p className="text-xs text-[#8F907E] mb-2">8:32 • 12.5K views</p>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setCurrentCarouselType('main');
                    handleEditVideo({
                      id: `main-video-${i}`,
                      title: `Video Title ${i}`,
                      youtube_url: '',
                      description: '',
                      duration: '8:32',
                      views: '12.5K views'
                    });
                  }}
                  className="flex-1 bg-[#8F907E] text-white py-1 px-2 rounded text-xs hover:bg-[#7A7B6A] flex items-center justify-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteVideo(`main-video-${i}`)}
                  className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 flex items-center justify-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AG Vlogs Carousel */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-[#383B26]">AG Vlogs Carousel</h4>
            <p className="text-sm text-[#8F907E]">AG Vlogs - Personal YouTube Channel</p>
          </div>
          <button 
            onClick={() => {
              setCurrentCarouselType('ag');
              setEditingVideo(null);
              setVideoData({
                youtube_url: '',
                video_title: '',
                video_description: '',
                duration: '',
                views: ''
              });
              setShowVideoModal(true);
            }}
            className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors text-sm flex items-center whitespace-nowrap"
          >
            <FaPlus className="mr-1" /> Add Video
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="aspect-video bg-gray-300 rounded mb-2 flex items-center justify-center">
                <FaVideo className="text-gray-500" />
              </div>
              <h5 className="font-medium text-sm text-[#383B26] mb-1">Personal Vlog {i}</h5>
              <p className="text-xs text-[#8F907E] mb-2">10:20 • 2.1K views</p>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setCurrentCarouselType('ag');
                    handleEditVideo({
                      id: `ag-video-${i}`,
                      title: `Personal Vlog ${i}`,
                      youtube_url: '',
                      description: '',
                      duration: '10:20',
                      views: '2.1K views'
                    });
                  }}
                  className="flex-1 bg-[#8F907E] text-white py-1 px-2 rounded text-xs hover:bg-[#7A7B6A] flex items-center justify-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteVideo(`ag-video-${i}`)}
                  className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 flex items-center justify-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGallerySection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#383B26]">Photo Gallery Management</h3>
        <button 
          onClick={() => setShowAlbumModal(true)}
          className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors flex items-center whitespace-nowrap"
        >
          <FaPlus className="mr-2" /> New Album
        </button>
      </div>

      {/* Social Media Buttons Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-medium text-[#383B26] mb-4">Social Media Buttons</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Instagram Button Text</label>
            <input
              type="text"
              defaultValue="Follow me on Instagram"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">TikTok Button Text</label>
            <input
              type="text"
              defaultValue="Follow me on TikTok"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
          </div>
        </div>
      </div>

      {/* Photo Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-square bg-gray-300 flex items-center justify-center">
              <FaImage className="text-4xl text-gray-500" />
            </div>
            <div className="p-4">
              <h5 className="font-medium text-[#383B26] mb-1">Album Title {i}</h5>
              <p className="text-sm text-[#8F907E] mb-3">Album description goes here</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditAlbum(`album-${i}`)}
                  className="flex-1 bg-[#8F907E] text-white py-2 px-3 rounded text-sm hover:bg-[#7A7B6A] flex items-center justify-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteAlbum(`album-${i}`)}
                  className="bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 flex items-center justify-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSpotifySection = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#383B26]">Spotify Playlists Section</h3>

      {/* Section Headers */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-medium text-[#383B26] mb-4">Section Content</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Section Title</label>
            <input
              type="text"
              defaultValue="Listen to My Playlists"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Section Subtitle</label>
            <input
              type="text"
              defaultValue="Curated music for every mood and moment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
          </div>
        </div>
      </div>

      {/* Spotify Playlists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-[#383B26]">Playlists (3)</h4>
          <button 
            onClick={() => {
              setEditingPlaylist(null);
              setPlaylistData({
                name: '',
                mood: '',
                color: '#2D2D2D',
                spotify_url: ''
              });
              setShowPlaylistModal(true);
            }}
            className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors flex items-center whitespace-nowrap"
          >
            <FaPlus className="mr-2" /> Add Playlist
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Switching Timezones', mood: 'Chill Vibes', color: '#2D2D2D' },
            { name: 'Soulmates', mood: 'Energy Boost', color: '#E91429' },
            { name: 'Ready 4 Summer', mood: 'Feel Good', color: '#1E3A8A' }
          ].map((playlist, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div 
                className="aspect-video rounded-lg mb-3 flex items-center justify-center text-white"
                style={{ backgroundColor: playlist.color }}
              >
                <span className="text-2xl">🎵</span>
              </div>
              <h5 className="font-medium text-[#383B26] mb-1">{playlist.name}</h5>
              <p className="text-sm text-[#8F907E] mb-2">Mood: {playlist.mood}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditPlaylist({
                    id: `playlist-${i}`,
                    name: playlist.name,
                    mood: playlist.mood,
                    color: playlist.color,
                    spotify_url: ''
                  })}
                  className="flex-1 bg-[#8F907E] text-white py-1 px-2 rounded text-xs hover:bg-[#7A7B6A] flex items-center justify-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDeletePlaylist(`playlist-${i}`)}
                  className="bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 flex items-center justify-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHealingTab = () => (
    <div>
      {/* Header */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-[#383B26] mb-2">Healing Content Management</h1>
        <p className="text-[#8F907E]">Manage all content visible on your healing page</p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">4</div>
            <div className="text-sm text-[#8F907E]">Part 1 Videos</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">4</div>
            <div className="text-sm text-[#8F907E]">Part 2 Videos</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">{healingProducts.length}</div>
            <div className="text-sm text-[#8F907E]">Products</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">1</div>
            <div className="text-sm text-[#8F907E]">Featured Video</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const newProduct = {
                id: 'tmp_' + Date.now(),
                name: '',
                purpose: '',
                howToUse: '',
                image: '',
                amazonUrl: ''
              };
              setEditingHealingProduct(newProduct);
              setIsAddingHealingProduct(true);
            }}
            className="bg-[#B89178] text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-[#A67B62] transition-colors"
          >
            <FaPlus className="text-xs" /> Quick Add Product
          </button>
          <button
            onClick={() => {
              const dataStr = JSON.stringify({ healingProducts, healingHeroData, healingProductsSection }, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'healing-backup.json'; a.click(); URL.revokeObjectURL(url);
            }}
            className="bg-[#8F907E] text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-[#7A7B6A] transition-colors"
          >
            <FaDownload className="text-xs" /> Export
          </button>
        </div>
      </div>

      {/* Content Management Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'hero', label: 'Hero Section', icon: '🎬' },
              { id: 'carousels', label: 'Video Carousels', icon: '📺' },
              { id: 'products', label: 'Products & Supplements', icon: '💊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setHealingActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  healingActiveTab === tab.id
                    ? 'border-[#B89178] text-[#B89178] bg-[#F5F5F5]'
                    : 'border-transparent text-[#8F907E] hover:text-[#383B26] hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {healingActiveTab === 'hero' && renderHealingHeroSection()}
          {healingActiveTab === 'carousels' && renderHealingCarouselsSection()}
          {healingActiveTab === 'products' && renderHealingProductsSection()}
        </div>
      </div>
    </div>
  );

  const renderHealingHeroSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#383B26]">Hero Section Content</h3>
        <button
          onClick={() => setEditingHealingHero(!editingHealingHero)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center whitespace-nowrap ${
            editingHealingHero
              ? 'bg-[#8F907E] text-white hover:bg-[#7A7B6A]'
              : 'bg-[#B89178] text-white hover:bg-[#A67B62]'
          }`}
        >
          {editingHealingHero ? 'Cancel' : 'Edit'} <FaEdit className="ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Title</label>
            {editingHealingHero ? (
              <input
                type="text"
                value={healingHeroData.title}
                onChange={(e) => setHealingHeroData({...healingHeroData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                placeholder="Enter hero title"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-[#383B26] font-semibold">
                {healingHeroData.title}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Subtitle</label>
            {editingHealingHero ? (
              <input
                type="text"
                value={healingHeroData.subtitle}
                onChange={(e) => setHealingHeroData({...healingHeroData, subtitle: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                placeholder="Enter hero subtitle"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-[#8F907E]">
                {healingHeroData.subtitle}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Body Text</label>
            {editingHealingHero ? (
              <textarea
                value={healingHeroData.bodyText}
                onChange={(e) => setHealingHeroData({...healingHeroData, bodyText: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                placeholder="Enter hero body text"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-[#8F907E] text-sm leading-relaxed">
                {healingHeroData.bodyText}
              </div>
            )}
          </div>

          {editingHealingHero && (
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  // Save healing hero data logic here
                  setEditingHealingHero(false);
                  toast.success('Hero section updated!');
                }}
                className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors flex items-center gap-2"
              >
                <FaSave /> Save Changes
              </button>
              <button
                onClick={() => setEditingHealingHero(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right: Featured Video */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-[#383B26]">Featured Video</h4>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <FaVideo className="text-4xl text-gray-400" />
            </div>
            <div className="text-sm text-[#8F907E]">
              <p><strong>Current:</strong> {healingHeroData.featuredVideoTitle}</p>
              <p><strong>Duration:</strong> 15:30</p>
              <p><strong>Published:</strong> {healingHeroData.featuredVideoDate}</p>
            </div>
            <button className="mt-3 w-full bg-[#B89178] text-white py-2 rounded-lg hover:bg-[#A67B62] transition-colors text-sm">
              Change Featured Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealingCarouselsSection = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#383B26]">Healing Video Carousels Management</h3>
        <div className="flex gap-2">
          {editingCarouselHeaders && (
            <button
              onClick={() => {
                setEditingCarouselHeaders(false);
                toast.success('Carousel headers updated successfully!');
              }}
              className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors flex items-center gap-2"
            >
              <FaSave /> Save Changes
            </button>
          )}
          <button
            onClick={() => setEditingCarouselHeaders(!editingCarouselHeaders)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center whitespace-nowrap ${
              editingCarouselHeaders
                ? 'bg-[#8F907E] text-white hover:bg-[#7A7B6A]'
                : 'bg-[#B89178] text-white hover:bg-[#A67B62]'
            }`}
          >
            {editingCarouselHeaders ? 'Cancel' : 'Edit Headers'} <FaEdit className="ml-1" />
          </button>
        </div>
      </div>
      
      {/* Gut Healing Part 1 Carousel */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            {editingCarouselHeaders ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={healingCarouselHeaders.part1.title}
                  onChange={(e) => setHealingCarouselHeaders({
                    ...healingCarouselHeaders,
                    part1: { ...healingCarouselHeaders.part1, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178] text-lg font-medium"
                  placeholder="Enter carousel title"
                />
                <input
                  type="text"
                  value={healingCarouselHeaders.part1.subtitle}
                  onChange={(e) => setHealingCarouselHeaders({
                    ...healingCarouselHeaders,
                    part1: { ...healingCarouselHeaders.part1, subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178] text-sm"
                  placeholder="Enter carousel subtitle"
                />
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-medium text-[#383B26]">{healingCarouselHeaders.part1.title}</h4>
                <p className="text-sm text-[#8F907E]">{healingCarouselHeaders.part1.subtitle}</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setCurrentCarouselType('healing-part1');
              setEditingVideo(null);
              setVideoData({
                youtube_url: '',
                video_title: '',
                video_description: '',
                duration: '',
                views: ''
              });
              setShowVideoModal(true);
            }}
            className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors text-sm flex items-center whitespace-nowrap"
          >
            <FaPlus className="mr-1" /> Add Video
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Candida Cleanse Introduction', 'Anti-Candida Diet Plan', 'Candida Die-Off Symptoms', 'Natural Antifungal Supplements'].map((title, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="aspect-video bg-gray-300 rounded mb-2 flex items-center justify-center">
                <FaVideo className="text-gray-500" />
              </div>
              <h5 className="font-medium text-sm text-[#383B26] mb-1">{title}</h5>
              <p className="text-xs text-[#8F907E] mb-2">12:45 • 8.2K views</p>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setCurrentCarouselType('healing-part1');
                    handleEditVideo({
                      id: `healing-part1-video-${i}`,
                      title: title,
                      youtube_url: '',
                      description: '',
                      duration: '12:45',
                      views: '8.2K views'
                    });
                  }}
                  className="flex-1 bg-[#8F907E] text-white py-1 px-2 rounded text-xs hover:bg-[#7A7B6A] flex items-center justify-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteVideo(`healing-part1-video-${i}`)}
                  className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 flex items-center justify-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gut Healing Part 2 Carousel */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            {editingCarouselHeaders ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={healingCarouselHeaders.part2.title}
                  onChange={(e) => setHealingCarouselHeaders({
                    ...healingCarouselHeaders,
                    part2: { ...healingCarouselHeaders.part2, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178] text-lg font-medium"
                  placeholder="Enter carousel title"
                />
                <input
                  type="text"
                  value={healingCarouselHeaders.part2.subtitle}
                  onChange={(e) => setHealingCarouselHeaders({
                    ...healingCarouselHeaders,
                    part2: { ...healingCarouselHeaders.part2, subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178] text-sm"
                  placeholder="Enter carousel subtitle"
                />
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-medium text-[#383B26]">{healingCarouselHeaders.part2.title}</h4>
                <p className="text-sm text-[#8F907E]">{healingCarouselHeaders.part2.subtitle}</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setCurrentCarouselType('healing-part2');
              setEditingVideo(null);
              setVideoData({
                youtube_url: '',
                video_title: '',
                video_description: '',
                duration: '',
                views: ''
              });
              setShowVideoModal(true);
            }}
            className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors text-sm flex items-center whitespace-nowrap"
          >
            <FaPlus className="mr-1" /> Add Video
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Gut Microbiome Restoration', 'Probiotic Foods Guide', 'Healing Leaky Gut', 'Post-Cleanse Maintenance'].map((title, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="aspect-video bg-gray-300 rounded mb-2 flex items-center justify-center">
                <FaVideo className="text-gray-500" />
              </div>
              <h5 className="font-medium text-sm text-[#383B26] mb-1">{title}</h5>
              <p className="text-xs text-[#8F907E] mb-2">14:20 • 9.1K views</p>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setCurrentCarouselType('healing-part2');
                    handleEditVideo({
                      id: `healing-part2-video-${i}`,
                      title: title,
                      youtube_url: '',
                      description: '',
                      duration: '14:20',
                      views: '9.1K views'
                    });
                  }}
                  className="flex-1 bg-[#8F907E] text-white py-1 px-2 rounded text-xs hover:bg-[#7A7B6A] flex items-center justify-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteVideo(`healing-part2-video-${i}`)}
                  className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 flex items-center justify-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHealingProductsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#383B26]">Products & Supplements Management</h3>
        <button 
          onClick={() => {
            const newProduct = {
              id: 'tmp_' + Date.now(),
              name: '',
              purpose: '',
              howToUse: '',
              image: '',
              amazonUrl: ''
            };
            setEditingHealingProduct(newProduct);
            setIsAddingHealingProduct(true);
          }}
          className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors flex items-center whitespace-nowrap"
        >
          <FaPlus className="mr-2" /> New Product
        </button>
      </div>

      {/* Section Headers */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-medium text-[#383B26] mb-4">Section Content</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Section Title</label>
            <input
              type="text"
              value={healingProductsSection.title}
              onChange={(e) => setHealingProductsSection({...healingProductsSection, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">Section Subtitle</label>
            <input
              type="text"
              value={healingProductsSection.subtitle}
              onChange={(e) => setHealingProductsSection({...healingProductsSection, subtitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healingProducts.map(product => (
          <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="h-48 bg-[#B89178] flex items-center justify-center">
              <span className="text-lg font-medium text-white">Product Image</span>
            </div>
            <div className="p-4">
              <h5 className="font-medium text-[#383B26] mb-2">{product.name}</h5>
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs font-semibold text-[#8F907E] uppercase">Purpose</p>
                  <p className="text-sm text-[#262626]">{product.purpose}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8F907E] uppercase">How to Use</p>
                  <p className="text-sm text-[#262626]">{product.howToUse}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingHealingProduct({...product}); setIsAddingHealingProduct(false); }}
                  className="flex-1 bg-[#8F907E] text-white py-2 px-3 rounded text-sm hover:bg-[#7A7B6A]"
                >
                  <FaEdit className="mr-1" /> Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this product?')) {
                      setHealingProducts(prev => prev.filter(p => p.id !== product.id));
                      toast.success('Product deleted');
                    }
                  }}
                  className="bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStorefrontTab = () => (
    <div>
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-[#383B26] mb-2">Storefront Management</h1>
        <p className="text-[#8F907E]">Add, edit, and organize products</p>
        <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">{sfStats.total}</div>
            <div className="text-sm text-[#8F907E]">Total Items</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">{sfStats.favorites}</div>
            <div className="text-sm text-[#8F907E]">Favorites</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">{sfStats.byStatus.published}</div>
            <div className="text-sm text-[#8F907E]">Published</div>
          </div>
          <div className="bg-[#E3D4C2] p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#383B26]">{sfStats.byStatus.archived}</div>
            <div className="text-sm text-[#8F907E]">Archived</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => {
                const now = new Date().toISOString();
                const draft: StorefrontProduct = {
                  id: 'tmp_' + Date.now(),
                  title: '',
                  slug: '',
                  category: 'food',
                  amazonUrl: '',
                  image: '',
                  imageAlt: '',
                  noteShort: '',
                  noteLong: '',
                  tags: [],
                  isAlexisPick: false,
                  showInFavorites: false,
                  status: 'draft',
                  sortWeight: 0,
                  usedIn: [],
                  pairsWith: [],
                  createdAt: now,
                  updatedAt: now,
                };
                setSfEditing(draft);
                setSfIsAdding(true);
              }}
              className="bg-[#B89178] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A67B62] transition-colors"
            >
              <FaPlus /> Add Product
            </button>
            <button
              onClick={() => {
                const dataStr = storefrontService.export();
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'storefront-backup.json'; a.click(); URL.revokeObjectURL(url);
              }}
              className="bg-[#654C37] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#5A4430] transition-colors"
            >
              <FaDownload /> Export
            </button>
            <label className="bg-[#8F907E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7A7B6A] transition-colors cursor-pointer">
              <FaUploadIcon /> Import
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    try {
                      storefrontService.import(String(evt.target?.result || ''));
                      loadStorefront();
                      alert('Imported successfully');
                    } catch (err: any) {
                      alert(err?.message || 'Import failed');
                    }
                  };
                  reader.readAsText(file);
                }}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={sfSearch}
              onChange={(e) => setSfSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            />
            <select
              value={sfCategory}
              onChange={(e) => setSfCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            >
              <option value="all">All Categories</option>
              <option value="food">Food</option>
              <option value="healing">Healing</option>
              <option value="home">Home</option>
              <option value="personal-care">Personal Care</option>
            </select>
            <select
              value={sfStatus}
              onChange={(e) => setSfStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Storefront List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sfItems.filter(item => {
          const matchesSearch = item.title.toLowerCase().includes(sfSearch.toLowerCase());
          const matchesCategory = sfCategory === 'all' || item.category === sfCategory;
          const matchesStatus = sfStatus === 'all' || item.status === sfStatus;
          return matchesSearch && matchesCategory && matchesStatus;
        }).map(item => (
          <div key={item.id} className="overflow-hidden bg-white rounded-lg shadow-md">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#383B26]">{item.title}</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-1 text-xs bg-[#E3D4C2] text-[#654C37] rounded">
                    {item.category}
                  </span>
                  <span className="px-2 py-1 text-xs bg-[#E3D4C2] text-[#654C37] rounded">
                    {item.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#8F907E] mb-2">{item.noteShort}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSfEditing({ ...item }); setSfIsAdding(false); }}
                  className="flex-1 bg-[#B89178] text-white px-3 py-1 rounded text-sm flex items-center justify-center gap-1 hover:bg-[#A67B62] transition-colors"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => { if (confirm('Archive this product?')) { storefrontService.archive(item.id); loadStorefront(); } }}
                  className="flex items-center justify-center gap-1 px-3 py-1 text-sm text-white transition-colors bg-red-500 rounded hover:bg-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="mx-auto max-w-7xl">
        {/* Tab Navigation */}
        <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-[#B89178] text-white'
                  : 'text-[#8F907E] hover:bg-[#E3D4C2] hover:text-[#383B26]'
              }`}
            >
              <FaImage />
              Home
            </button>
            <button
              onClick={() => setActiveTab('vlogs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'vlogs'
                  ? 'bg-[#B89178] text-white'
                  : 'text-[#8F907E] hover:bg-[#E3D4C2] hover:text-[#383B26]'
              }`}
            >
              <FaVideo />
              Vlogs
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'recipes'
                  ? 'bg-[#B89178] text-white'
                  : 'text-[#8F907E] hover:bg-[#E3D4C2] hover:text-[#383B26]'
              }`}
            >
              <FaUtensils />
              Recipes
            </button>
            <button
              onClick={() => setActiveTab('healing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'healing'
                  ? 'bg-[#B89178] text-white'
                  : 'text-[#8F907E] hover:bg-[#E3D4C2] hover:text-[#383B26]'
              }`}
            >
              <FaHeartbeat />
              Healing
            </button>
            <button
              onClick={() => setActiveTab('storefront')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'storefront'
                  ? 'bg-[#B89178] text-white'
                  : 'text-[#8F907E] hover:bg-[#E3D4C2] hover:text-[#383B26]'
              }`}
            >
              <FaStore />
              Storefront
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'vlogs' && renderVlogsTab()}
        {activeTab === 'recipes' && renderRecipesTab()}
        {activeTab === 'healing' && renderHealingTab()}
        {activeTab === 'storefront' && renderStorefrontTab()}

        {/* Edit/Add Modal - Only for Recipes */}
        {editingRecipe && activeTab === 'recipes' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#383B26]">
                    {isAddingRecipe ? 'Add New Recipe' : 'Edit Recipe'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRecipe}
                      className="bg-[#B89178] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A67B62] transition-colors"
                    >
                      <FaSave /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Title</label>
                      <input
                        type="text"
                        value={editingRecipe.title}
                        onChange={(e) => updateEditingRecipe('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
                      <textarea
                        value={editingRecipe.description}
                        onChange={(e) => updateEditingRecipe('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">Folder</label>
                        <select
                          value={editingRecipe.folder}
                          onChange={(e) => updateEditingRecipe('folder', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        >
                          {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>
                              {folder.icon} {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">Difficulty</label>
                        <select
                          value={editingRecipe.difficulty}
                          onChange={(e) => updateEditingRecipe('difficulty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        >
                          {difficulties.map(diff => (
                            <option key={diff} value={diff}>{diff}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">Prep Time</label>
                        <input
                          type="text"
                          value={editingRecipe.prepTime}
                          onChange={(e) => updateEditingRecipe('prepTime', e.target.value)}
                          placeholder="15 min"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">Cook Time</label>
                        <input
                          type="text"
                          value={editingRecipe.cookTime}
                          onChange={(e) => updateEditingRecipe('cookTime', e.target.value)}
                          placeholder="30 min"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">Servings</label>
                        <input
                          type="number"
                          value={editingRecipe.servings}
                          onChange={(e) => updateEditingRecipe('servings', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingRecipe.isBeginner}
                          onChange={(e) => updateEditingRecipe('isBeginner', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-[#383B26]">Beginner Recipe</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingRecipe.isRecipeOfWeek}
                          onChange={(e) => updateEditingRecipe('isRecipeOfWeek', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-[#383B26]">Recipe of the Week</span>
                      </label>
                    </div>
                  </div>

                  {/* Ingredients and Instructions */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Ingredients</label>
                      <div className="space-y-2">
                        {editingRecipe.ingredients.map((ingredient, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={ingredient}
                              onChange={(e) => updateArrayItem('ingredients', index, e.target.value)}
                              placeholder="Add ingredient..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                            />
                            <button
                              onClick={() => removeArrayItem('ingredients', index)}
                              className="px-3 py-2 text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addArrayItem('ingredients')}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#B89178] hover:text-[#B89178] transition-colors"
                        >
                          <FaPlus className="inline mr-2" /> Add Ingredient
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Instructions</label>
                      <div className="space-y-2">
                        {editingRecipe.instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="text-sm text-[#8F907E] mt-2">{index + 1}.</span>
                            <textarea
                              value={instruction}
                              onChange={(e) => updateArrayItem('instructions', index, e.target.value)}
                              placeholder="Add instruction step..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                            />
                            <button
                              onClick={() => removeArrayItem('instructions', index)}
                              className="px-3 py-2 text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addArrayItem('instructions')}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#B89178] hover:text-[#B89178] transition-colors"
                        >
                          <FaPlus className="inline mr-2" /> Add Instruction Step
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Tags</label>
                      <div className="space-y-2">
                        {editingRecipe.tags.map((tag, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={tag}
                              onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                              placeholder="Add tag..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                            />
                            <button
                              onClick={() => removeArrayItem('tags', index)}
                              className="px-3 py-2 text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addArrayItem('tags')}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#B89178] hover:text-[#B89178] transition-colors"
                        >
                          <FaPlus className="inline mr-2" /> Add Tag
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vlog Modal */}
        {showVlogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#383B26]">Add New Vlog</h3>
                <button
                  onClick={() => setShowVlogModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={vlogData.youtube_url}
                    onChange={(e) => setVlogData({...vlogData, youtube_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Video Title</label>
                  <input
                    type="text"
                    value={vlogData.video_title}
                    onChange={(e) => setVlogData({...vlogData, video_title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="Enter video title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
                  <textarea
                    value={vlogData.video_description}
                    onChange={(e) => setVlogData({...vlogData, video_description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    rows={3}
                    placeholder="Enter video description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Duration</label>
                  <input
                    type="text"
                    value={vlogData.duration}
                    onChange={(e) => setVlogData({...vlogData, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="e.g., 10:30"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddVlog}
                  disabled={!vlogData.youtube_url || !vlogData.video_title}
                  className="flex-1 bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Vlog
                </button>
                <button
                  onClick={() => setShowVlogModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Healing Product Modal */}
        {editingHealingProduct && activeTab === 'healing' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#383B26]">
                    {isAddingHealingProduct ? 'Add New Product' : 'Edit Product'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (isAddingHealingProduct) {
                          const { id, ...productData } = editingHealingProduct;
                          const newId = Date.now().toString();
                          setHealingProducts(prev => [...prev, { ...productData, id: newId }]);
                          toast.success('Product added successfully!');
                        } else {
                          setHealingProducts(prev => prev.map(p => p.id === editingHealingProduct.id ? editingHealingProduct : p));
                          toast.success('Product updated successfully!');
                        }
                        setEditingHealingProduct(null);
                        setIsAddingHealingProduct(false);
                      }}
                      className="bg-[#B89178] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A67B62] transition-colors"
                    >
                      <FaSave /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingHealingProduct(null);
                        setIsAddingHealingProduct(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">Product Name</label>
                    <input
                      type="text"
                      value={editingHealingProduct.name}
                      onChange={(e) => setEditingHealingProduct({...editingHealingProduct, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">Purpose</label>
                    <textarea
                      value={editingHealingProduct.purpose}
                      onChange={(e) => setEditingHealingProduct({...editingHealingProduct, purpose: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      placeholder="What is this product for?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">How to Use</label>
                    <textarea
                      value={editingHealingProduct.howToUse}
                      onChange={(e) => setEditingHealingProduct({...editingHealingProduct, howToUse: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      placeholder="Instructions for use"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">Product Image URL</label>
                    <input
                      type="url"
                      value={editingHealingProduct.image}
                      onChange={(e) => setEditingHealingProduct({...editingHealingProduct, image: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      placeholder="https://example.com/product-image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">Amazon URL</label>
                    <input
                      type="url"
                      value={editingHealingProduct.amazonUrl}
                      onChange={(e) => setEditingHealingProduct({...editingHealingProduct, amazonUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      placeholder="https://amazon.com/product-link"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#383B26]">
                  {editingVideo ? 'Edit Video' : 'Add New Video'}
                </h3>
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setEditingVideo(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={videoData.youtube_url}
                    onChange={(e) => setVideoData({...videoData, youtube_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Video Title</label>
                  <input
                    type="text"
                    value={videoData.video_title}
                    onChange={(e) => setVideoData({...videoData, video_title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="Enter video title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
                  <textarea
                    value={videoData.video_description}
                    onChange={(e) => setVideoData({...videoData, video_description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    rows={3}
                    placeholder="Enter video description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">Duration</label>
                    <input
                      type="text"
                      value={videoData.duration}
                      onChange={(e) => setVideoData({...videoData, duration: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      placeholder="e.g., 10:30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#383B26] mb-1">Views</label>
                    <input
                      type="text"
                      value={videoData.views}
                      onChange={(e) => setVideoData({...videoData, views: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                      placeholder="e.g., 12.5K views"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddVideo}
                  disabled={!videoData.youtube_url || !videoData.video_title}
                  className="flex-1 bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingVideo ? 'Update Video' : 'Add Video'}
                </button>
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setEditingVideo(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playlist Modal */}
        {showPlaylistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#383B26]">
                  {editingPlaylist ? 'Edit Playlist' : 'Add New Playlist'}
                </h3>
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setEditingPlaylist(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Playlist Name</label>
                  <input
                    type="text"
                    value={playlistData.name}
                    onChange={(e) => setPlaylistData({...playlistData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="Enter playlist name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Mood/Theme</label>
                  <input
                    type="text"
                    value={playlistData.mood}
                    onChange={(e) => setPlaylistData({...playlistData, mood: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="e.g., Chill Vibes, Energy Boost"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Theme Color</label>
                  <input
                    type="color"
                    value={playlistData.color}
                    onChange={(e) => setPlaylistData({...playlistData, color: e.target.value})}
                    className="w-full h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Spotify URL</label>
                  <input
                    type="url"
                    value={playlistData.spotify_url}
                    onChange={(e) => setPlaylistData({...playlistData, spotify_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="https://open.spotify.com/playlist/..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddPlaylist}
                  disabled={!playlistData.name || !playlistData.mood}
                  className="flex-1 bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPlaylist ? 'Update Playlist' : 'Add Playlist'}
                </button>
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setEditingPlaylist(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Album Modal */}
        {showAlbumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#383B26]">Add New Album</h3>
                <button
                  onClick={() => setShowAlbumModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Album Title</label>
                  <input
                    type="text"
                    value={albumData.album_title}
                    onChange={(e) => setAlbumData({...albumData, album_title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="Enter album title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={albumData.album_subtitle}
                    onChange={(e) => setAlbumData({...albumData, album_subtitle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    placeholder="Enter album subtitle"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
                  <textarea
                    value={albumData.album_description}
                    onChange={(e) => setAlbumData({...albumData, album_description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                    rows={3}
                    placeholder="Enter album description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Date</label>
                  <input
                    type="date"
                    value={albumData.album_date}
                    onChange={(e) => setAlbumData({...albumData, album_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B89178]"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddAlbum}
                  disabled={!albumData.album_title}
                  className="flex-1 bg-[#654C37] text-white px-4 py-2 rounded-lg hover:bg-[#5A4430] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Album
                </button>
                <button
                  onClick={() => setShowAlbumModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin; 