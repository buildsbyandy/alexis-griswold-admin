import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { withAdminSSP } from '../lib/auth/withAdminSSP';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaStar, FaDownload, FaUpload as FaUploadIcon, FaVideo, FaStore, FaUtensils, FaImage, FaHeartbeat, FaMusic } from 'react-icons/fa';
import toast from 'react-hot-toast';
import FileUpload from '../components/ui/FileUpload';
import RecipeModal from '../components/modals/RecipeModal';
import VlogModal from '../components/modals/VlogModal';
import PhotoAlbumModal from '../components/modals/PhotoAlbumModal';
import SpotifyPlaylistModal from '../components/modals/SpotifyPlaylistModal';
import HealingProductModal, { type HealingProduct } from '../components/modals/HealingProductModal';
import CarouselHeaderModal, { type CarouselHeader } from '../components/modals/CarouselHeaderModal';
import HealingFeaturedVideoModal, { type HealingFeaturedVideo } from '../components/modals/HealingFeaturedVideoModal';
import HealingVideoModal from '../components/modals/HealingVideoModal';
import StorefrontProductModal from '../components/modals/StorefrontProductModal';
import recipeService from '../lib/services/recipeService';
import type { Recipe } from '../lib/services/recipeService';
import vlogService, { type VlogVideo, type PhotoAlbum, type SpotifyPlaylist } from '../lib/services/vlogService';
import healingService, { type HealingVideo } from '../lib/services/healingService';
import storefrontService, { type StorefrontProduct } from '../lib/services/storefrontService';

type AdminTab = 'home' | 'vlogs' | 'recipes' | 'healing' | 'storefront';

// Component for authenticated admin content
const AdminContent: React.FC = () => {
  // All useState hooks at the top level
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [vlogs, setVlogs] = useState<VlogVideo[]>([]);
  const [editingVlog, setEditingVlog] = useState<VlogVideo | null>(null);
  const [isAddingVlog, setIsAddingVlog] = useState(false);
  const [vlogActiveTab, setVlogActiveTab] = useState<'hero' | 'videos' | 'gallery' | 'spotify'>('hero');
  const [editingVlogHero, setEditingVlogHero] = useState(false);
  const [vlogHeroData, setVlogHeroData] = useState({
    title: 'VLOGS',
    subtitle: 'Step into my life — one video at a time.',
    bodyText: 'Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with purpose, passion, and the simple joys that make each day extraordinary.'
  });
  const [healingProducts, setHealingProducts] = useState<HealingProduct[]>([]);
  const [editingHealingProduct, setEditingHealingProduct] = useState<HealingProduct | null>(null);
  const [isAddingHealingProduct, setIsAddingHealingProduct] = useState(false);
  const [editingCarouselHeader, setEditingCarouselHeader] = useState<CarouselHeader | null>(null);
  const [editingHealingFeaturedVideo, setEditingHealingFeaturedVideo] = useState<HealingFeaturedVideo | null>(null);
  const [healingVideos, setHealingVideos] = useState<HealingVideo[]>([]);
  const [editingHealingVideo, setEditingHealingVideo] = useState<HealingVideo | null>(null);
  const [showHealingVideoModal, setShowHealingVideoModal] = useState(false);
  const [sfProducts, setSfProducts] = useState<StorefrontProduct[]>([]);
  const [editingSfProduct, setEditingSfProduct] = useState<StorefrontProduct | null>(null);
  const [isAddingSfProduct, setIsAddingSfProduct] = useState(false);
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
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [photoAlbums, setPhotoAlbums] = useState<PhotoAlbum[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
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

  // Recipe save functionality
  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });

      if (!response.ok) throw new Error('Failed to save recipe');
      
      // Reload recipes
      const recipesList = await recipeService.getAllRecipes();
      setRecipes(recipesList);
      
      // Update stats
      const recipeStats = await recipeService.getRecipeStats();
      setStats(recipeStats);

      setIsAddingRecipe(false);
      setEditingRecipe(null);
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  };

  // Vlog save functionality
  const handleSaveVlog = async (vlogData: Omit<VlogVideo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingVlog) {
        // Update existing vlog
        const success = await vlogService.updateVlog(editingVlog.id, vlogData);
        if (!success) throw new Error('Failed to update vlog');
      } else {
        // Create new vlog
        const success = await vlogService.addVlog(vlogData);
        if (!success) throw new Error('Failed to create vlog');
      }
      
      // Reload vlogs and stats
      const vlogsList = await vlogService.getAllVlogs();
      setVlogs(vlogsList);
      
      const vlogStatsData = await vlogService.getStats();
      setVlogStats(vlogStatsData);

      setIsAddingVlog(false);
      setEditingVlog(null);
    } catch (error) {
      console.error('Error saving vlog:', error);
      throw error;
    }
  };

  const handleSaveAlbum = async (albumData: Omit<PhotoAlbum, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingAlbum) {
        const success = await vlogService.updateAlbum(editingAlbum.id, albumData);
        if (!success) throw new Error('Failed to update album');
      } else {
        const success = await vlogService.addAlbum(albumData);
        if (!success) throw new Error('Failed to create album');
      }
      
      // Reload albums and stats
      const allAlbums = await vlogService.getAllAlbums();
      setPhotoAlbums(allAlbums);
      const vlogStatsData = await vlogService.getStats();
      setVlogStats(vlogStatsData);

      setEditingAlbum(null);
      setShowAlbumModal(false);
    } catch (error) {
      console.error('Error saving album:', error);
      throw error;
    }
  };

  const handleSavePlaylist = async (playlistData: Omit<SpotifyPlaylist, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingPlaylist) {
        const success = await vlogService.updatePlaylist(editingPlaylist.id, playlistData);
        if (!success) throw new Error('Failed to update playlist');
      } else {
        const success = await vlogService.addPlaylist(playlistData);
        if (!success) throw new Error('Failed to create playlist');
      }
      
      // Reload playlists and stats
      const allPlaylists = await vlogService.getAllPlaylists();
      setSpotifyPlaylists(allPlaylists);
      setSpotifyStats({
        totalPlaylists: allPlaylists.length,
        activePlaylists: allPlaylists.filter(p => p.isActive).length
      });

      setEditingPlaylist(null);
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Error saving playlist:', error);
      throw error;
    }
  };

  // Healing save functionality
  const handleSaveHealingProduct = async (productData: Omit<HealingProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingHealingProduct) {
        const success = await healingService.updateProduct(editingHealingProduct.id, productData);
        if (!success) throw new Error('Failed to update healing product');
      } else {
        const success = await healingService.addProduct(productData);
        if (!success) throw new Error('Failed to create healing product');
      }
      
      // Reload products
      const productsList = await healingService.getAllProducts();
      setHealingProducts(productsList);

      setIsAddingHealingProduct(false);
      setEditingHealingProduct(null);
    } catch (error) {
      console.error('Error saving healing product:', error);
      throw error;
    }
  };

  const handleSaveHealingVideo = async (videoData: Omit<HealingVideo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingHealingVideo) {
        const success = await healingService.updateVideo(editingHealingVideo.id, videoData);
        if (!success) throw new Error('Failed to update healing video');
      } else {
        const success = await healingService.addVideo(videoData);
        if (!success) throw new Error('Failed to create healing video');
      }
      
      // Reload videos
      const videosList = await healingService.getAllVideos();
      setHealingVideos(videosList);

      setShowHealingVideoModal(false);
      setEditingHealingVideo(null);
    } catch (error) {
      console.error('Error saving healing video:', error);
      throw error;
    }
  };

  const handleSaveCarouselHeader = async (headerData: Omit<CarouselHeader, 'id' | 'updatedAt'>) => {
    try {
      const success = await healingService.updateCarouselHeader(headerData);
      if (!success) throw new Error('Failed to update carousel header');
      
      setEditingCarouselHeader(null);
    } catch (error) {
      console.error('Error saving carousel header:', error);
      throw error;
    }
  };

  const handleSaveHealingFeaturedVideo = async (videoData: Omit<HealingFeaturedVideo, 'id' | 'updatedAt'>) => {
    try {
      const success = await healingService.updateFeaturedVideo(videoData);
      if (!success) throw new Error('Failed to update healing featured video');
      
      setEditingHealingFeaturedVideo(null);
    } catch (error) {
      console.error('Error saving healing featured video:', error);
      throw error;
    }
  };

  const handleSaveStorefrontProduct = async (productData: Omit<StorefrontProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingSfProduct) {
        // Update existing product
        await storefrontService.update(editingSfProduct.id, productData);
      } else {
        // Create new product
        await storefrontService.add(productData);
      }
      
      // Reload products and stats
      const productsList = await storefrontService.getAll();
      setSfProducts(productsList);
      setSfItems(productsList);

      const storefrontStats = await storefrontService.getStats();
      setSfStats(storefrontStats);

      setIsAddingSfProduct(false);
      setEditingSfProduct(null);
    } catch (error) {
      console.error('Error saving storefront product:', error);
      throw error;
    }
  };

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

        const vlogsList = await vlogService.getAllVlogs();
        setVlogs(vlogsList);

        const albumsList = await vlogService.getAllAlbums();
        setPhotoAlbums(albumsList);

        const healingProductsList = await healingService.getAllProducts();
        setHealingProducts(healingProductsList);

        const healingVideosList = await healingService.getAllVideos();
        setHealingVideos(healingVideosList);

        const playlists = await vlogService.getAllPlaylists();
        setSpotifyPlaylists(playlists);
        setSpotifyStats({
          totalPlaylists: playlists.length,
          activePlaylists: playlists.filter(p => p.isActive).length
        });

        // Load home content
        const homeResponse = await fetch('/api/home');
        if (homeResponse.ok) {
          const homeData = await homeResponse.json();
          setHomePageContent(homeData.content);
        }
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
                    <div className="bg-gray-200 h-48 flex items-center justify-center rounded relative group">
                      {homePageContent.videoBackground ? (
                        <video 
                          src={homePageContent.videoBackground} 
                          className="w-full h-full object-cover rounded"
                          muted
                          loop
                          controls
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <FaVideo className="mx-auto mb-2 text-2xl" />
                          <p>No Video</p>
                          <p className="text-sm">Upload a background video</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FileUpload
                          accept="video/*"
                          uploadType="video"
                          onUpload={(url) => setHomePageContent(prev => ({ ...prev, videoBackground: url }))}
                          className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                        >
                          Upload Video
                        </FileUpload>
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
                    <div className="bg-gray-200 h-48 flex items-center justify-center rounded relative group">
                      {homePageContent.fallbackImage ? (
                        <img 
                          src={homePageContent.fallbackImage} 
                          alt="Fallback Image"
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <FaImage className="mx-auto mb-2 text-2xl" />
                          <p>No Image</p>
                          <p className="text-sm">Upload a fallback image</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FileUpload
                          accept="image/*"
                          uploadType="image"
                          onUpload={(url) => setHomePageContent(prev => ({ ...prev, fallbackImage: url }))}
                          className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                        >
                          Upload Image
                        </FileUpload>
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
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/home', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(homePageContent)
                        });
                        
                        if (response.ok) {
                          setEditingHomeContent(false);
                          toast.success('Homepage content saved successfully!');
                        } else {
                          throw new Error('Failed to save');
                        }
                      } catch (error) {
                        toast.error('Failed to save homepage content');
                        console.error('Save error:', error);
                      }
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
                  onClick={() => setIsAddingVlog(true)}
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
                {[
                  { id: 'hero', name: 'Hero Section', icon: FaStar },
                  { id: 'videos', name: 'Video Carousels', icon: FaVideo },
                  { id: 'gallery', name: 'Photo Gallery', icon: FaImage },
                  { id: 'spotify', name: 'Spotify Section', icon: FaVideo }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setVlogActiveTab(tab.id as any)}
                      className={`px-4 py-2 border-b-2 font-medium flex items-center transition-colors ${
                        vlogActiveTab === tab.id
                          ? 'border-[#B8A692] text-[#383B26]'
                          : 'border-transparent text-[#8F907E] hover:text-[#383B26]'
                      }`}
                    >
                      <Icon className="mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Section Content */}
            {vlogActiveTab === 'hero' && (
              <div className="space-y-6">
                {/* Hero Content */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#383B26]">Hero Section Content</h2>
                      <p className="text-[#8F907E] text-sm">Configure the main hero area of your vlogs page</p>
                    </div>
                    <button
                      onClick={() => setEditingVlogHero(!editingVlogHero)}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaEdit className="mr-2" />
                      {editingVlogHero ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Text Content */}
                    <div>
                      {editingVlogHero ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[#383B26] mb-1">Title</label>
                            <input
                              type="text"
                              value={vlogHeroData.title}
                              onChange={(e) => setVlogHeroData(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#383B26] mb-1">Subtitle</label>
                            <input
                              type="text"
                              value={vlogHeroData.subtitle}
                              onChange={(e) => setVlogHeroData(prev => ({ ...prev, subtitle: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#383B26] mb-1">Body Text</label>
                            <textarea
                              value={vlogHeroData.bodyText}
                              onChange={(e) => setVlogHeroData(prev => ({ ...prev, bodyText: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md h-32 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            />
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/vlogs/hero', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(vlogHeroData)
                                });
                                
                                if (response.ok) {
                                  setEditingVlogHero(false);
                                  toast.success('Vlogs hero content saved successfully!');
                                } else {
                                  throw new Error('Failed to save');
                                }
                              } catch (error) {
                                toast.error('Failed to save vlogs hero content');
                                console.error('Save error:', error);
                              }
                            }}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                          >
                            <FaSave className="mr-2" />
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h2 className="text-2xl font-bold text-[#383B26] mb-2">{vlogHeroData.title}</h2>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-[#8F907E]"><strong>Hero Subtitle:</strong></p>
                              <p className="text-sm">{vlogHeroData.subtitle}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[#8F907E]"><strong>Hero Body Text:</strong></p>
                              <p className="text-sm">{vlogHeroData.bodyText}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Featured Video Preview */}
                    <div>
                      <h3 className="font-medium text-[#383B26] mb-3">Featured Video Preview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="bg-gray-200 h-32 flex items-center justify-center rounded mb-3">
                          <div className="text-center text-gray-500">
                            <FaVideo className="mx-auto mb-2 text-xl" />
                            <p className="text-sm">Video Preview</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm"><strong>Current:</strong> Latest vlog from video management</p>
                          <p className="text-sm text-[#8F907E]">Automatically shows the most recent active video</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {vlogActiveTab === 'videos' && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#383B26]">Video Management</h2>
                  <p className="text-[#8F907E] text-sm">Manage your YouTube videos and featured content</p>
                </div>
                <button 
                  onClick={() => setIsAddingVlog(true)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add Video
                </button>
              </div>

              <div className="space-y-4">
                {vlogs.map((vlog) => (
                  <div key={vlog.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img src={vlog.thumbnailUrl} alt={vlog.title} className="w-24 h-16 object-cover rounded" />
                      <div>
                        <h3 className="font-medium text-[#383B26]">{vlog.title}</h3>
                        <p className="text-sm text-[#8F907E]">{vlog.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-[#8F907E] mt-1">
                          <span>{vlog.duration}</span>
                          <span>{vlog.views} views</span>
                          <span>{vlog.publishedAt}</span>
                          {vlog.isFeatured && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Featured</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingVlog(vlog)}
                        className="p-2 text-[#B8A692] hover:bg-gray-100 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this vlog?')) {
                            vlogService.deleteVlog(vlog.id).then(() => {
                              setVlogs(vlogs.filter(v => v.id !== vlog.id));
                            });
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Photo Gallery Tab */}
            {vlogActiveTab === 'gallery' && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#383B26]">Photo Gallery Management</h2>
                  <p className="text-[#8F907E] text-sm">Organize your photo albums and collections</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingAlbum(null);
                    setShowAlbumModal(true);
                  }}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add Album
                </button>
              </div>
              
              {photoAlbums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photoAlbums.map((album) => (
                    <div key={album.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Album Cover */}
                      <div className="relative">
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full h-48 object-cover"
                        />
                        {album.isFeatured && (
                          <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center">
                            <FaStar className="mr-1" />
                            Featured
                          </span>
                        )}
                        <span className="absolute top-2 right-2 bg-[#B8A692] text-white px-2 py-1 rounded text-xs">
                          {album.category}
                        </span>
                      </div>
                      
                      {/* Album Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-[#383B26] mb-2">{album.title}</h3>
                        <p className="text-sm text-[#8F907E] mb-2 line-clamp-2">{album.description}</p>
                        <p className="text-xs text-[#8F907E] mb-3">
                          {album.photos.length} photos • {album.date}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingAlbum(album);
                              setShowAlbumModal(true);
                            }}
                            className="flex-1 px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C] flex items-center justify-center"
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this album?')) {
                                try {
                                  const success = await vlogService.deleteAlbum(album.id);
                                  if (success) {
                                    const albumsList = await vlogService.getAllAlbums();
                                    setPhotoAlbums(albumsList);
                                    const vlogStatsData = await vlogService.getStats();
                                    setVlogStats(vlogStatsData);
                                    toast.success('Album deleted successfully!');
                                  } else {
                                    throw new Error('Failed to delete album');
                                  }
                                } catch (error) {
                                  console.error('Delete error:', error);
                                  toast.error('Failed to delete album');
                                }
                              }
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#8F907E]">
                  <FaImage className="mx-auto text-4xl mb-4 opacity-50" />
                  <p>No photo albums created yet</p>
                  <p className="text-sm mt-2">Click "Add Album" to create your first photo album</p>
                </div>
              )}
            </div>
            )}

            {/* Spotify Tab */}
            {vlogActiveTab === 'spotify' && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#383B26]">Spotify Playlists Section</h2>
                      <p className="text-[#8F907E] text-sm">Configure section content and manage playlists</p>
                    </div>
                    <button 
                      onClick={() => setShowPlaylistModal(true)}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaPlus className="mr-2" />
                      Add Playlist
                    </button>
                  </div>

                  {/* Section Content Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Section Title</label>
                      <input
                        type="text"
                        defaultValue="Listen to My Playlists"
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Section Subtitle</label>
                      <input
                        type="text"
                        defaultValue="Curated music for every mood and moment"
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      />
                    </div>
                  </div>

                  {/* Playlists Grid */}
                  {spotifyPlaylists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {spotifyPlaylists.map((playlist) => (
                        <div key={playlist.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Playlist Card */}
                          <div className="relative">
                            <div 
                              className="h-32 flex flex-col items-center justify-center text-white relative"
                              style={{ backgroundColor: playlist.color }}
                            >
                              <FaMusic className="text-3xl mb-2 opacity-70" />
                              <div className="text-center px-2">
                                <p className="font-medium text-sm">{playlist.name}</p>
                                <p className="text-xs opacity-80">Mood: {playlist.mood}</p>
                              </div>
                              {!playlist.isActive && (
                                <div className="absolute top-2 right-2">
                                  <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                                    Hidden
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Card Actions */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Order: {playlist.order}</p>
                                <a 
                                  href={playlist.spotifyUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#B8A692] hover:text-[#A0956C] truncate block max-w-32"
                                  title={playlist.spotifyUrl}
                                >
                                  View on Spotify
                                </a>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingPlaylist(playlist);
                                    setShowPlaylistModal(true);
                                  }}
                                  className="text-[#B8A692] hover:text-[#A0956C]"
                                  title="Edit Playlist"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this playlist?')) {
                                      const success = await vlogService.deletePlaylist(playlist.id);
                                      if (success) {
                                        const allPlaylists = await vlogService.getAllPlaylists();
                                        setSpotifyPlaylists(allPlaylists);
                                        setSpotifyStats({
                                          totalPlaylists: allPlaylists.length,
                                          activePlaylists: allPlaylists.filter(p => p.isActive).length
                                        });
                                        toast.success('Playlist deleted successfully!');
                                      } else {
                                        toast.error('Failed to delete playlist');
                                      }
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete Playlist"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[#8F907E]">
                      <FaMusic className="mx-auto text-4xl mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Playlists Yet</p>
                      <p className="text-sm">Add your first Spotify playlist to get started</p>
                      <button 
                        onClick={() => setShowPlaylistModal(true)}
                        className="mt-4 px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                      >
                        <FaPlus className="mr-2" />
                        Add Playlist
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

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
                    <div className="border rounded-lg p-4 relative group">
                      <h3 className="font-medium text-[#383B26] mb-2">Gut Healing Part 1: Candida Cleanse</h3>
                      <p className="text-sm text-[#8F907E]">Educational videos for candida cleansing process</p>
                      <button
                        onClick={() => setEditingCarouselHeader({
                          id: 'part1',
                          title: 'Gut Healing Part 1: Candida Cleanse',
                          description: 'Educational videos for candida cleansing process',
                          type: 'part1',
                          isActive: true,
                          updatedAt: new Date()
                        })}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-[#B8A692] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaEdit />
                      </button>
                    </div>
                    <div className="border rounded-lg p-4 relative group">
                      <h3 className="font-medium text-[#383B26] mb-2">Gut Healing Part 2: Rebuild & Repair</h3>
                      <p className="text-sm text-[#8F907E]">Videos focused on rebuilding gut health after cleansing</p>
                      <button
                        onClick={() => setEditingCarouselHeader({
                          id: 'part2',
                          title: 'Gut Healing Part 2: Rebuild & Repair',
                          description: 'Videos focused on rebuilding gut health after cleansing',
                          type: 'part2',
                          isActive: true,
                          updatedAt: new Date()
                        })}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-[#B8A692] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Video Carousels */}
                <div className="space-y-6">
                  {/* Part 1 Carousel */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#383B26]">Gut Healing Part 1: Candida Cleanse</h3>
                        <p className="text-sm text-[#8F907E]">Educational videos for candida cleansing process</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingHealingVideo(null);
                          setShowHealingVideoModal(true);
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        <FaPlus className="mr-2" />
                        Add Video
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {healingVideos
                        .filter(video => video.carousel === 'part1' && video.isActive)
                        .sort((a, b) => a.order - b.order)
                        .map((video) => (
                          <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative">
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <FaVideo className="text-white text-2xl" />
                              </div>
                              {video.duration && (
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                  {video.duration}
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm text-[#383B26] mb-1 truncate">{video.title}</h4>
                              {video.views && (
                                <p className="text-xs text-[#8F907E] mb-2">{video.views} views</p>
                              )}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingHealingVideo(video);
                                    setShowHealingVideoModal(true);
                                  }}
                                  className="px-2 py-1 bg-[#B8A692] text-white rounded text-xs hover:bg-[#A0956C] flex items-center"
                                >
                                  <FaEdit className="mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this video?')) {
                                      const success = await healingService.deleteVideo(video.id);
                                      if (success) {
                                        const videosList = await healingService.getAllVideos();
                                        setHealingVideos(videosList);
                                        toast.success('Video deleted successfully!');
                                      } else {
                                        toast.error('Failed to delete video');
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center"
                                >
                                  <FaTrash className="mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Part 2 Carousel */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#383B26]">Gut Healing Part 2: Rebuild & Repair</h3>
                        <p className="text-sm text-[#8F907E]">Videos focused on rebuilding gut health after cleansing</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingHealingVideo(null);
                          setShowHealingVideoModal(true);
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        <FaPlus className="mr-2" />
                        Add Video
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {healingVideos
                        .filter(video => video.carousel === 'part2' && video.isActive)
                        .sort((a, b) => a.order - b.order)
                        .map((video) => (
                          <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative">
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <FaVideo className="text-white text-2xl" />
                              </div>
                              {video.duration && (
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                  {video.duration}
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm text-[#383B26] mb-1 truncate">{video.title}</h4>
                              {video.views && (
                                <p className="text-xs text-[#8F907E] mb-2">{video.views} views</p>
                              )}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingHealingVideo(video);
                                    setShowHealingVideoModal(true);
                                  }}
                                  className="px-2 py-1 bg-[#B8A692] text-white rounded text-xs hover:bg-[#A0956C] flex items-center"
                                >
                                  <FaEdit className="mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this video?')) {
                                      const success = await healingService.deleteVideo(video.id);
                                      if (success) {
                                        const videosList = await healingService.getAllVideos();
                                        setHealingVideos(videosList);
                                        toast.success('Video deleted successfully!');
                                      } else {
                                        toast.error('Failed to delete video');
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center"
                                >
                                  <FaTrash className="mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
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
                    <button 
                      onClick={() => setIsAddingHealingProduct(true)}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaPlus className="mr-2" />
                      Add Product
                    </button>
                  </div>

                  {/* Healing Products */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {healingProducts.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <FaHeartbeat className="mx-auto text-4xl text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">No products added yet</p>
                        <button 
                          onClick={() => setIsAddingHealingProduct(true)}
                          className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                        >
                          <FaPlus className="mr-2" />
                          Add Your First Product
                        </button>
                      </div>
                    ) : (
                      healingProducts
                        .filter(product => product.isActive)
                        .sort((a, b) => a.order - b.order)
                        .map((product) => (
                          <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="relative mb-3">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-full h-24 object-cover rounded"
                                />
                              ) : (
                                <div className="bg-gray-200 h-24 rounded flex items-center justify-center">
                                  <FaHeartbeat className="text-gray-400 text-xl" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-[#383B26] mb-1">{product.name}</h3>
                            <p className="text-sm text-[#8F907E] mb-2 line-clamp-2">{product.purpose}</p>
                            {product.howToUse && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-1">How to use: {product.howToUse}</p>
                            )}
                            {product.amazonUrl && (
                              <a 
                                href={product.amazonUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-xs text-[#B8A692] hover:text-[#A0956C] mb-2"
                              >
                                View on Amazon →
                              </a>
                            )}
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={() => setEditingHealingProduct(product)}
                                className="flex-1 px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C]"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this product?')) {
                                    const success = await healingService.deleteProduct(product.id);
                                    if (success) {
                                      const productsList = await healingService.getAllProducts();
                                      setHealingProducts(productsList);
                                    }
                                  }
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
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
                  <option value="food">Food</option>
                  <option value="healing">Healing</option>
                  <option value="home">Home</option>
                  <option value="personal-care">Personal Care</option>
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
                            <button 
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this product?')) {
                                  try {
                                    await storefrontService.delete(product.id);
                                    const productsList = await storefrontService.getAll();
                                    setSfProducts(productsList);
                                    setSfItems(productsList);
                                    const storefrontStats = await storefrontService.getStats();
                                    setSfStats(storefrontStats);
                                    toast.success('Product deleted successfully!');
                                  } catch (error) {
                                    console.error('Delete error:', error);
                                    toast.error('Failed to delete product');
                                  }
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
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

      {/* Recipe Modal */}
      <RecipeModal
        isOpen={isAddingRecipe || !!editingRecipe}
        onClose={() => {
          setIsAddingRecipe(false);
          setEditingRecipe(null);
        }}
        recipe={editingRecipe}
        onSave={handleSaveRecipe}
      />

      {/* Vlog Modal */}
      <VlogModal
        isOpen={isAddingVlog || !!editingVlog}
        onClose={() => {
          setIsAddingVlog(false);
          setEditingVlog(null);
        }}
        vlog={editingVlog}
        onSave={handleSaveVlog}
      />

      {/* Photo Album Modal */}
      <PhotoAlbumModal
        isOpen={showAlbumModal}
        onClose={() => {
          setShowAlbumModal(false);
          setEditingAlbum(null);
        }}
        album={editingAlbum}
        onSave={handleSaveAlbum}
      />

      {/* Spotify Playlist Modal */}
      <SpotifyPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => {
          setShowPlaylistModal(false);
          setEditingPlaylist(null);
        }}
        playlist={editingPlaylist}
        onSave={handleSavePlaylist}
      />

      {/* Healing Product Modal */}
      <HealingProductModal
        isOpen={isAddingHealingProduct || !!editingHealingProduct}
        onClose={() => {
          setIsAddingHealingProduct(false);
          setEditingHealingProduct(null);
        }}
        product={editingHealingProduct}
        onSave={handleSaveHealingProduct}
      />

      {/* Carousel Header Modal */}
      <CarouselHeaderModal
        isOpen={!!editingCarouselHeader}
        onClose={() => setEditingCarouselHeader(null)}
        carouselHeader={editingCarouselHeader}
        onSave={handleSaveCarouselHeader}
      />

      {/* Healing Featured Video Modal */}
      <HealingFeaturedVideoModal
        isOpen={!!editingHealingFeaturedVideo}
        onClose={() => setEditingHealingFeaturedVideo(null)}
        currentVideo={editingHealingFeaturedVideo}
        onSave={handleSaveHealingFeaturedVideo}
      />

      {/* Healing Video Modal */}
      <HealingVideoModal
        isOpen={showHealingVideoModal}
        onClose={() => {
          setShowHealingVideoModal(false);
          setEditingHealingVideo(null);
        }}
        video={editingHealingVideo}
        onSave={handleSaveHealingVideo}
      />

      {/* Storefront Product Modal */}
      <StorefrontProductModal
        isOpen={isAddingSfProduct || !!editingSfProduct}
        onClose={() => {
          setIsAddingSfProduct(false);
          setEditingSfProduct(null);
        }}
        product={editingSfProduct}
        onSave={handleSaveStorefrontProduct}
      />
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