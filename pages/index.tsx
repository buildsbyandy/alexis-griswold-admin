import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { withAdminSSP } from '../lib/auth/withAdminSSP';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaStar, FaDownload, FaUpload as FaUploadIcon, FaVideo, FaStore, FaUtensils, FaImage, FaHeartbeat, FaMusic, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import FileUpload from '../components/ui/FileUpload';
import RecipeModal from '../components/modals/RecipeModal';
import VlogModal from '../components/modals/VlogModal';
import PhotoAlbumModal from '../components/modals/PhotoAlbumModal';
import HomeContentModal from '../components/modals/HomeContentModal';
import SpotifyPlaylistModal from '../components/modals/SpotifyPlaylistModal';
import HealingProductModal, { type HealingProduct } from '../components/modals/HealingProductModal';
import CarouselHeaderModal, { type CarouselHeader } from '../components/modals/CarouselHeaderModal';
import HealingFeaturedVideoModal, { type HealingFeaturedVideo } from '../components/modals/HealingFeaturedVideoModal';
import HealingVideoModal from '../components/modals/HealingVideoModal';
import StorefrontProductModal from '../components/modals/StorefrontProductModal';
import FeaturedVideoSelectorModal from '../components/modals/FeaturedVideoSelectorModal';
import recipeService from '../lib/services/recipeService';
import type { Recipe } from '../lib/services/recipeService';
import vlogService, { type VlogVideo, type PhotoAlbum, type SpotifyPlaylist } from '../lib/services/vlogService';
import healingService, { type HealingVideo } from '../lib/services/healingService';
import storefrontService, { type StorefrontProduct } from '../lib/services/storefrontService';
import VideoHistoryCarousel from '../components/ui/VideoHistoryCarousel';

type AdminTab = 'home' | 'vlogs' | 'recipes' | 'healing' | 'storefront';

interface VideoHistoryItem {
  path: string;
  uploaded_at: string;
  title: string;
  size?: number;
}

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
    bodyText: 'Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with purpose, passion, and the simple joys that make each day extraordinary.',
    featuredVideoId: '',
    featuredVideoTitle: '',
    featuredVideoDate: ''
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
  const [homeContentModalOpen, setHomeContentModalOpen] = useState(false);
  const [homePageContent, setHomePageContent] = useState({
    background_video_path: '',
    fallback_image_path: '',
    hero_main_title: 'Welcome to Alexis Griswold',
    hero_subtitle: 'Experience wellness, recipes, and lifestyle content',
    video_title: 'Welcome to Alexis Griswold - Wellness and Lifestyle Content',
    video_description: 'Experience wellness, recipes, and lifestyle content with Alexis Griswold. Discover healthy recipes, healing practices, and lifestyle tips.',
    videoOpacity: 0.7, // Default opacity overlay for text readability
    // Frontend-specific field names for compatibility
    videoBackground: '',
    fallbackImage: '',
    heroMainTitle: 'Welcome to Alexis Griswold',
    heroSubtitle: 'Experience wellness, recipes, and lifestyle content',
    videoTitle: 'Welcome to Alexis Griswold - Wellness and Lifestyle Content',
    videoDescription: 'Experience wellness, recipes, and lifestyle content with Alexis Griswold. Discover healthy recipes, healing practices, and lifestyle tips.'
  });
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);

  // Healing tab state
  const [healingActiveTab, setHealingActiveTab] = useState<'hero' | 'carousels' | 'products'>('hero');
  const [editingHealingHero, setEditingHealingHero] = useState(false);
  const [editingCarouselHeaders, setEditingCarouselHeaders] = useState(false);
  const [showHealingFeaturedVideoSelector, setShowHealingFeaturedVideoSelector] = useState(false);
  const [showVlogFeaturedVideoSelector, setShowVlogFeaturedVideoSelector] = useState(false);
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
      if (editingRecipe) {
        // Update existing recipe
        const result = await recipeService.updateRecipe(editingRecipe.id, recipeData);
        if (!result) throw new Error('Failed to update recipe');
      } else {
        // Create new recipe
        const result = await recipeService.addRecipe(recipeData);
        if (!result) throw new Error('Failed to create recipe');
      }
      
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

  // Recipe delete functionality
  const handleDeleteRecipe = async (recipeId: string) => {
    if (window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      try {
        const success = await recipeService.deleteRecipe(recipeId);
        if (success) {
          const recipesList = await recipeService.getAllRecipes();
          setRecipes(recipesList);
          
          const recipeStats = await recipeService.getRecipeStats();
          setStats(recipeStats);
        }
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  // Recipe export functionality
  const handleExportRecipes = async () => {
    try {
      const recipesDataString = await recipeService.exportRecipes();
      const blob = new Blob([recipesDataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recipes-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting recipes:', error);
    }
  };

  // Recipe import functionality - simplified for now
  const handleImportRecipes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const importedRecipes = JSON.parse(text);
          
          // Add each imported recipe individually
          for (const recipe of importedRecipes) {
            const { id, createdAt, updatedAt, ...recipeData } = recipe;
            await recipeService.addRecipe(recipeData);
          }
          
          // Reload recipes
          const recipesList = await recipeService.getAllRecipes();
          setRecipes(recipesList);
          
          const recipeStats = await recipeService.getRecipeStats();
          setStats(recipeStats);
          
          alert(`Successfully imported ${importedRecipes.length} recipes!`);
        } catch (error) {
          console.error('Error importing recipes:', error);
          alert('Error importing recipes. Please check the file format.');
        }
      }
    };
    input.click();
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
      if (sfEditing && !sfIsAdding) {
        // Update existing product
        await storefrontService.update(sfEditing.id, productData);
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

      setSfIsAdding(false);
      setSfEditing(null);
    } catch (error) {
      console.error('Error saving storefront product:', error);
      throw error;
    }
  };

  // Featured video selection handlers
  const handleSelectHealingFeaturedVideo = async (video: HealingVideo) => {
    try {
      // Update the healing hero data with the selected video
      setHealingHeroData(prev => ({
        ...prev,
        featuredVideoId: video.youtubeId || video.id,
        featuredVideoTitle: video.title,
        featuredVideoDate: new Date().toISOString().split('T')[0]
      }));
      
      toast.success('Featured video updated successfully!');
    } catch (error) {
      console.error('Error updating featured video:', error);
      toast.error('Failed to update featured video');
    }
  };

  const handleSelectVlogFeaturedVideo = async (video: VlogVideo) => {
    try {
      // Update the vlog hero data with the selected video
      setVlogHeroData(prev => ({
        ...prev,
        featuredVideoId: video.youtubeId || video.id,
        featuredVideoTitle: video.title,
        featuredVideoDate: video.publishedAt || new Date().toISOString().split('T')[0]
      }));
      
      toast.success('Featured video updated successfully!');
    } catch (error) {
      console.error('Error updating featured video:', error);
      toast.error('Failed to update featured video');
    }
  };

  // Home content save functionality
  const handleSaveHomeContent = async (contentData: any) => {
    try {
      const response = await fetch('/api/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          background_video_path: homePageContent.background_video_path || homePageContent.videoBackground,
          fallback_image_path: homePageContent.fallback_image_path || homePageContent.fallbackImage,
          hero_main_title: contentData.hero_main_title || contentData.heroMainTitle,
          hero_subtitle: contentData.hero_subtitle || contentData.heroSubtitle,
          video_title: contentData.video_title || contentData.videoTitle,
          video_description: contentData.video_description || contentData.videoDescription,
          videoOpacity: contentData.videoOpacity || homePageContent.videoOpacity || 0.7
        })
      });
      
      if (response.ok) {
        // Update local state with the new content
        setHomePageContent(prev => ({
          ...prev,
          hero_main_title: contentData.hero_main_title || contentData.heroMainTitle,
          hero_subtitle: contentData.hero_subtitle || contentData.heroSubtitle,
          video_title: contentData.video_title || contentData.videoTitle,
          video_description: contentData.video_description || contentData.videoDescription,
          videoOpacity: contentData.videoOpacity || prev.videoOpacity || 0.7,
          heroMainTitle: contentData.hero_main_title || contentData.heroMainTitle,
          heroSubtitle: contentData.hero_subtitle || contentData.heroSubtitle,
          videoTitle: contentData.video_title || contentData.videoTitle,
          videoDescription: contentData.video_description || contentData.videoDescription
        }));
        // Reload data to get any server-side updates
        loadData();
      } else {
        throw new Error('Failed to save home content');
      }
    } catch (error) {
      console.error('Home content save error:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  // Load data function - moved outside useEffect so it can be called from other places
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
        const content = homeData.content;
        // Normalize paths: strip accidental '/public' prefix and ensure video is full URL
        const normalizedFallback = (content?.fallback_image_path || '').replace(/^\/public\//, '/');
        const normalizedVideo = content?.background_video_path || '';
        
        // Map API response to frontend state structure (safe defaults)
        setHomePageContent({
          background_video_path: normalizedVideo,
          fallback_image_path: normalizedFallback,
          hero_main_title: content?.hero_main_title || 'Welcome to Alexis Griswold',
          hero_subtitle: content?.hero_subtitle || 'Experience wellness, recipes, and lifestyle content',
          video_title: content?.video_title || 'Welcome to Alexis Griswold - Wellness and Lifestyle Content',
          video_description: content?.video_description || 'Experience wellness, recipes, and lifestyle content with Alexis Griswold. Discover healthy recipes, healing practices, and lifestyle tips.',
          videoOpacity: content?.videoOpacity || 0.7,
          // Frontend-specific field names for compatibility
          videoBackground: normalizedVideo,
          fallbackImage: normalizedFallback,
          heroMainTitle: content?.hero_main_title || 'Welcome to Alexis Griswold',
          heroSubtitle: content?.hero_subtitle || 'Experience wellness, recipes, and lifestyle content',
          videoTitle: content?.video_title || 'Welcome to Alexis Griswold - Wellness and Lifestyle Content',
          videoDescription: content?.video_description || 'Experience wellness, recipes, and lifestyle content with Alexis Griswold. Discover healthy recipes, healing practices, and lifestyle tips.'
        });
        
        // Load video history if it exists
        if (content?.video_history) {
          setVideoHistory(Array.isArray(content.video_history) 
            ? content.video_history 
            : JSON.parse(content.video_history)
          );
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Alexis Griswold Admin Dashboard</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <FaSignOutAlt className="w-4 h-4" />
            Logout
          </button>
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
              <div className="flex mt-4 space-x-3">
                <button className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center">
                  <FaDownload className="mr-2" />
                  Export Settings
                </button>
              </div>
            </div>

            {/* Media Management */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#383B26]">Home Page Media</h2>
                  <p className="text-[#8F907E]">Configure the video background and fallback image</p>
                </div>
                <button
                  onClick={() => setHomeContentModalOpen(true)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Edit Content
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Video Background */}
                <div>
                  <h3 className="text-lg font-medium text-[#383B26] mb-3 flex items-center">
                    <FaVideo className="mr-2" />
                    Video Background
                  </h3>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <div className="relative flex items-center justify-center h-48 bg-gray-200 rounded group">
                      {homePageContent.videoBackground ? (
                        <div className="relative w-full h-full">
                          <video 
                            src={homePageContent.videoBackground} 
                            className="object-cover w-full h-full rounded"
                            muted
                            loop
                            controls
                          />
                          {/* Opacity Overlay Preview */}
                          <div 
                            className="absolute inset-0 bg-black rounded" 
                            style={{ opacity: 1 - homePageContent.videoOpacity }}
                          />
                          {/* Text Preview Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                              <p className="text-lg font-bold">Preview Text</p>
                              <p className="text-sm">Opacity: {Math.round(homePageContent.videoOpacity * 100)}%</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <FaVideo className="mx-auto mb-2 text-2xl" />
                          <p>No Video</p>
                          <p className="text-sm">Upload a background video</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button - Now below video preview */}
                    <div className="flex flex-col items-center mt-3 space-y-2">
                      <div className="text-xs text-gray-500 text-center">
                        Upload a video to automatically publish it as your background
                      </div>
                      <FileUpload
                        accept="video/*,.mov,.mp4,.avi,.wmv,.flv,.webm,.m4v,.3gp,.mkv"
                        uploadType="video"
                        onUpload={async (url) => {
                          console.log('Video uploaded to:', url);
                          
                          // Check if we're at max history (3 videos) and prompt to delete
                          if (videoHistory.length >= 3) {
                            const shouldProceed = confirm(
                              'You have reached the maximum of 3 videos in history. ' +
                              'To upload this new video, you need to delete an existing video first. ' +
                              'Would you like to proceed? (You can delete videos from the history section below)'
                            );
                            
                            if (!shouldProceed) {
                              toast('Upload cancelled. Please delete a video from history first.');
                              return;
                            }
                          }
                          
                          const updatedContent = { 
                            ...homePageContent, 
                            background_video_path: url,
                            videoBackground: url // Keep both for compatibility
                          };
                          console.log('Updating homePageContent to:', updatedContent);
                          setHomePageContent(updatedContent);
                          
                          // Auto-save to database when video uploads
                          try {
                            console.log('Sending PUT request to /api/home...');
                            const response = await fetch('/api/home', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(updatedContent)
                            });
                            
                            if (response.ok) {
                              const responseData = await response.json();
                              console.log('API response success:', responseData);
                              toast.success('Video uploaded and published successfully!');
                              
                              // Update video history from API response
                              if (responseData.content?.video_history) {
                                setVideoHistory(Array.isArray(responseData.content.video_history) 
                                  ? responseData.content.video_history 
                                  : JSON.parse(responseData.content.video_history)
                                );
                              }
                            } else {
                              const errorData = await response.json();
                              console.error('API Error:', errorData);
                              toast.error(`Failed to publish: ${errorData.error || 'Unknown error'}`);
                            }
                          } catch (error) {
                            console.error('Auto-save error:', error);
                            toast.error('Video uploaded but failed to publish. Please click "Save Changes" to publish.');
                          }
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        Upload New Video
                      </FileUpload>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">📝 Current Content</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-[#8F907E]"><strong>Hero Title:</strong> {homePageContent.heroMainTitle || 'Not set'}</p>
                        <p className="text-sm text-[#8F907E]"><strong>Hero Subtitle:</strong> {homePageContent.heroSubtitle || 'Not set'}</p>
                      </div>
                    </div>
                    
                    {/* Video Opacity Control */}
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-medium text-[#383B26] mb-2">Video Opacity Control</h4>
                      <p className="text-xs text-[#8F907E] mb-2">Current: {Math.round((homePageContent.videoOpacity || 0.7) * 100)}%</p>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={homePageContent.videoOpacity || 0.7}
                          onChange={(e) => setHomePageContent(prev => ({ ...prev, videoOpacity: parseFloat(e.target.value) }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #B8A692 0%, #B8A692 ${(homePageContent.videoOpacity || 0.7) * 100}%, #e5e5e5 ${(homePageContent.videoOpacity || 0.7) * 100}%, #e5e5e5 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-[#8F907E]">
                          <span>0% (Dark)</span>
                          <span>50% (Balanced)</span>
                          <span>100% (Bright)</span>
                        </div>
                      </div>
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
                  <div className="p-4 bg-gray-100 rounded-lg">
                    {/* Image Preview */}
                    <div className="relative flex items-center justify-center h-48 bg-gray-200 rounded">
                      {homePageContent.fallbackImage ? (
                        <Image 
                          src={homePageContent.fallbackImage} 
                          alt="Fallback Image Preview"
                          className="object-cover w-full h-full rounded"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <FaImage className="mx-auto mb-2 text-2xl" />
                          <p className="font-medium">No Fallback Image</p>
                          <p className="text-sm">Upload an image below</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button - Now below image preview */}
                    <div className="flex flex-col items-center mt-3 space-y-2">
                      <div className="text-xs text-gray-500 text-center">
                        Upload a high-quality image that represents your video content
                      </div>
                      <FileUpload
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                        uploadType="image"
                        onUpload={(url) => {
                          console.log('Fallback image uploaded:', url);
                          setHomePageContent(prev => ({ 
                            ...prev, 
                            fallbackImage: url,
                            fallback_image_path: url 
                          }));
                          toast.success('Fallback image uploaded successfully!');
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        Upload Fallback Image
                      </FileUpload>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">📱 When is this image used?</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• <strong>Mobile devices</strong> where video autoplay is restricted</li>
                        <li>• <strong>Slow connections</strong> when the video fails to load</li>
                        <li>• <strong>Accessibility</strong> as the poster frame before video plays</li>
                        <li>• <strong>SEO</strong> as the main image for search engines and social media</li>
                      </ul>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-[#8F907E]"><strong>Current Image:</strong> {homePageContent.fallbackImage ? 'Set ✓' : 'Not uploaded'}</p>
                    </div>
                  </div>
                </div>
              </div>


            </div>

            {/* Video History Management */}
            <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#383B26] mb-2">📹 Video History</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">How it works:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>Upload a video</strong> → It&apos;s automatically published as your background</li>
                    <li>• <strong>Previous videos</strong> are saved in history (max 3)</li>
                    <li>• <strong>Click any video</strong> in history to make it current</li>
                    <li>• <strong>Delete videos</strong> from history to free up space</li>
                  </ul>
                </div>
              </div>
              <VideoHistoryCarousel
                currentVideo={homePageContent.videoBackground}
                videoHistory={videoHistory}
                onVideoSelect={(videoPath) => {
                  setHomePageContent(prev => ({
                    ...prev,
                    videoBackground: videoPath
                  }));
                  toast.success('Video selected as current background');
                }}
                onVideoDelete={(videoPath) => {
                  setVideoHistory(prev => prev.filter(v => v.path !== videoPath));
                }}
                onRefresh={loadData}
              />
            </div>

            {/* Media Recommendations */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#383B26] mb-4">📝 Media Recommendations</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-blue-50">
                  <h3 className="font-medium text-[#383B26] mb-3 flex items-center">
                    <FaVideo className="mr-2 text-blue-600" />
                    Background Video Guidelines
                  </h3>
                  <ul className="text-sm text-[#8F907E] space-y-2">
                    <li><strong>Duration:</strong> 10-30 seconds (loops seamlessly)</li>
                    <li><strong>Formats:</strong> MP4, MOV, WebM, AVI, WMV (MP4/H.264 preferred)</li>
                    <li><strong>Resolution:</strong> 1920x1080 (Full HD) recommended</li>
                    <li><strong>File Size:</strong> Under 25MB maximum (5-10MB ideal)</li>
                    <li><strong>Frame Rate:</strong> 24-30 FPS</li>
                    <li><strong>Audio:</strong> Remove audio track (muted autoplay)</li>
                    <li><strong>Content:</strong> Avoid rapid movements or flashing</li>
                    <li><strong>Compression:</strong> High compression for web delivery</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-green-50">
                  <h3 className="font-medium text-[#383B26] mb-3 flex items-center">
                    <FaImage className="mr-2 text-green-600" />
                    Fallback Image Guidelines
                  </h3>
                  <ul className="text-sm text-[#8F907E] space-y-2">
                    <li><strong>Format:</strong> JPEG or WebP for photos</li>
                    <li><strong>Resolution:</strong> 1920x1080 (matches video aspect)</li>
                    <li><strong>File Size:</strong> Under 500KB optimized</li>
                    <li><strong>Quality:</strong> High quality but web-optimized</li>
                    <li><strong>Content:</strong> Representative frame from video</li>
                    <li><strong>Usage:</strong> Mobile devices & video load failures</li>
                    <li><strong>Alt Text:</strong> Include descriptive text overlay</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Media Settings */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#383B26] mb-4">Media Settings & Behavior</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <h3 className="font-medium text-[#383B26] mb-2">Video Behavior</h3>
                  <ul className="text-sm text-[#8F907E] space-y-1">
                    <li>• Auto-play on desktop</li>
                    <li>• Muted by default</li>
                    <li>• Loops continuously</li>
                    <li>• Responsive scaling</li>
                    <li>• Preload optimization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-[#383B26] mb-2">Mobile Experience</h3>
                  <ul className="text-sm text-[#8F907E] space-y-1">
                    <li>• Shows fallback image</li>
                    <li>• Optimized loading</li>
                    <li>• Touch-friendly</li>
                    <li>• Bandwidth conscious</li>
                    <li>• Battery friendly</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-[#383B26] mb-2">Fallback Triggers</h3>
                  <ul className="text-sm text-[#8F907E] space-y-1">
                    <li>• Video load failure</li>
                    <li>• Slow connection</li>
                    <li>• Mobile devices</li>
                    <li>• User preference</li>
                    <li>• Browser restrictions</li>
                  </ul>
                </div>
              </div>

              {/* Performance Tips */}
              <div className="p-4 mt-6 border-l-4 border-yellow-400 rounded-lg bg-yellow-50">
                <h4 className="font-medium text-[#383B26] mb-2">💡 Performance Tips</h4>
                <ul className="text-sm text-[#8F907E] space-y-1">
                  <li>• <strong>File size matters:</strong> Large files (50MB+) will fail to upload - aim for 5-10MB</li>
                  <li>• Use video compression tools like HandBrake, Compressor, or online converters</li>
                  <li>• iPhone/Mac users: Export at &quot;High Efficiency&quot; or &quot;Most Compatible&quot; settings</li>
                  <li>• Test upload with smaller files first to verify functionality</li>
                  <li>• Consider using a CDN for better global loading performance</li>
                  <li>• The fallback image should capture the essence of your video</li>
                </ul>
              </div>

              {/* File Size Warning */}
              <div className="p-4 mt-4 border-l-4 border-red-400 rounded-lg bg-red-50">
                <h4 className="font-medium text-[#383B26] mb-2">⚠️ Common Upload Issues</h4>
                <ul className="text-sm text-[#8F907E] space-y-1">
                  <li>• <strong>Large files (50MB+):</strong> Upload will timeout or fail</li>
                  <li>• <strong>Unsupported formats:</strong> System supports MP4, MOV, WebM, AVI, WMV</li>
                  <li>• <strong>Network timeouts:</strong> Compress videos before uploading</li>
                  <li>• <strong>Browser limits:</strong> Some browsers limit upload size to 25-50MB</li>
                </ul>
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
            <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsAddingRecipe(true)}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add New Recipe
                </button>
                <button 
                  onClick={handleExportRecipes}
                  className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Export
                </button>
                <button 
                  onClick={handleImportRecipes}
                  className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center"
                >
                  <FaUploadIcon className="mr-2" />
                  Import
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
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
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#383B26] mb-4">Recipe Collection</h2>
              
              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recipes
                    .filter(recipe => 
                      (selectedFolder === 'all' || recipe.folder === selectedFolder) &&
                      (searchTerm === '' || recipe.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(recipe => (
                      <div key={recipe.id} className="overflow-hidden transition-shadow border border-gray-200 rounded-lg hover:shadow-lg">
                        {/* Recipe Image */}
                        <div className="flex items-center justify-center h-48 bg-gray-200">
                          {recipe.imageUrl ? (
                            <Image src={recipe.imageUrl} alt={recipe.title} className="object-cover w-full h-full" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                          ) : (
                            <div className="text-center text-gray-500">
                              <FaUtensils className="mx-auto mb-2 text-2xl" />
                              <p className="text-sm">No Image</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Recipe Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-[#383B26] truncate">{recipe.title}</h3>
                            {recipe.isFavorite && <FaStar className="ml-2 text-yellow-500" />}
                          </div>
                          
                          <div className="mb-3 space-y-1">
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
                          
                          <p className="mb-3 text-sm text-gray-600 line-clamp-2">
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
                            <button 
                              onClick={() => handleDeleteRecipe(recipe.id)}
                              className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FaUtensils className="mx-auto mb-4 text-6xl text-gray-300" />
                  <h3 className="mb-2 text-xl font-medium text-gray-500">No recipes yet</h3>
                  <p className="mb-6 text-gray-400">Get started by adding your first recipe</p>
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
            <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
              <div className="p-6 bg-white rounded-lg shadow-md">
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

              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Published:</span>
                    <span className="font-medium">{recipes.filter(r => r.status === 'published').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Drafts:</span>
                    <span className="font-medium">{recipes.filter(r => r.status === 'draft').length}</span>
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
              <div className="flex mt-4 space-x-3">
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
            <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
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
                <div className="p-6 bg-white rounded-lg shadow-md">
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

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                            className="flex items-center px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                          >
                            <FaSave className="mr-2" />
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-gray-50">
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
                      <div className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center h-32 mb-3 bg-gray-200 rounded">
                          <div className="text-center text-gray-500">
                            <FaVideo className="mx-auto mb-2 text-xl" />
                            <p className="text-sm">Video Preview</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {vlogHeroData.featuredVideoTitle ? (
                            <>
                              <p className="text-sm"><strong>Current:</strong> {vlogHeroData.featuredVideoTitle}</p>
                              <p className="text-sm text-[#8F907E]">Published: {vlogHeroData.featuredVideoDate}</p>
                              <p className="text-sm text-[#8F907E]">ID: {vlogHeroData.featuredVideoId}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm"><strong>Current:</strong> No featured video selected</p>
                              <p className="text-sm text-[#8F907E]">Click below to select a featured video from your carousel</p>
                            </>
                          )}
                        </div>
                        <button 
                          onClick={() => setShowVlogFeaturedVideoSelector(true)}
                          className="w-full mt-3 px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] text-sm"
                        >
                          Change Featured Video
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {vlogActiveTab === 'videos' && (
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
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
                  <div key={vlog.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Image src={vlog.thumbnailUrl} alt={vlog.title} className="object-cover w-24 h-16 rounded" width={96} height={64} />
                      <div>
                        <h3 className="font-medium text-[#383B26]">{vlog.title}</h3>
                        <p className="text-sm text-[#8F907E]">{vlog.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-[#8F907E] mt-1">
                          <span>{vlog.duration}</span>
                          <span>{vlog.views} views</span>
                          <span>{vlog.publishedAt}</span>
                          {vlog.isFeatured && <span className="px-2 py-1 text-yellow-800 bg-yellow-100 rounded">Featured</span>}
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
                        className="p-2 text-red-600 rounded hover:bg-red-50"
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
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {photoAlbums.map((album) => (
                    <div key={album.id} className="overflow-hidden border border-gray-200 rounded-lg">
                      {/* Album Cover */}
                      <div className="relative">
                        <Image
                          src={album.coverImage}
                          alt={album.title}
                          className="object-cover w-full h-48"
                          width={400}
                          height={192}
                        />
                        {album.isFeatured && (
                          <span className="absolute flex items-center px-2 py-1 text-xs text-white bg-yellow-500 rounded top-2 left-2">
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
                            className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
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
                  <FaImage className="mx-auto mb-4 text-4xl opacity-50" />
                  <p>No photo albums created yet</p>
                  <p className="mt-2 text-sm">Click &quot;Add Album&quot; to create your first photo album</p>
                </div>
              )}

              {/* Image Upload Guidelines */}
              <div className="p-6 mt-6 border-l-4 border-blue-400 rounded-lg bg-blue-50">
                <h3 className="font-medium text-[#383B26] mb-4 flex items-center">
                  <FaImage className="mr-2 text-blue-600" />
                  📷 Image Upload Guidelines
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-[#383B26] mb-3">Recommended Formats</h4>
                    <ul className="text-sm text-[#8F907E] space-y-1">
                      <li>• <strong>JPG/JPEG:</strong> Best for photos with many colors</li>
                      <li>• <strong>PNG:</strong> Best for images with transparency</li>
                      <li>• <strong>WebP:</strong> Modern format with great compression</li>
                      <li>• <strong>File Size:</strong> Under 10MB maximum (1-3MB ideal)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#383B26] mb-3">Avoid These Formats</h4>
                    <ul className="space-y-1 text-sm text-red-600">
                      <li>• <strong>RAW files:</strong> CR2, NEF, ARW, DNG (too large)</li>
                      <li>• <strong>TIFF/TIF:</strong> Uncompressed, very large files</li>
                      <li>• <strong>PSD:</strong> Photoshop files (not web-compatible)</li>
                      <li>• <strong>Large images:</strong> 50MP+ photos need resizing</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 mt-4 border-l-2 border-yellow-400 rounded bg-yellow-50">
                  <p className="text-sm text-[#8F907E]">
                    <strong>💡 Tip:</strong> If uploading from iPhone/Android, use &quot;Medium&quot; or &quot;Large&quot; size options instead of &quot;Actual Size&quot; to avoid huge file sizes.
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* Spotify Tab */}
            {vlogActiveTab === 'spotify' && (
              <>
                <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
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
                  <div className="grid grid-cols-1 gap-4 p-4 mb-6 rounded-lg md:grid-cols-2 bg-gray-50">
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {spotifyPlaylists.map((playlist) => (
                        <div key={playlist.id} className="overflow-hidden border border-gray-200 rounded-lg">
                          {/* Playlist Card */}
                          <div className="relative">
                            <div 
                              className="relative flex flex-col items-center justify-center h-32 text-white"
                              style={{ backgroundColor: playlist.color }}
                            >
                              <FaMusic className="mb-2 text-3xl opacity-70" />
                              <div className="px-2 text-center">
                                <p className="text-sm font-medium">{playlist.name}</p>
                                <p className="text-xs opacity-80">Mood: {playlist.mood}</p>
                              </div>
                              {!playlist.isActive && (
                                <div className="absolute top-2 right-2">
                                  <span className="px-2 py-1 text-xs text-white bg-gray-500 rounded">
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
                      <FaMusic className="mx-auto mb-4 text-4xl opacity-50" />
                      <p className="mb-2 text-lg font-medium">No Playlists Yet</p>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-6 bg-white rounded-lg shadow-md">
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

              <div className="p-6 bg-white rounded-lg shadow-md">
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

              <div className="p-6 bg-white rounded-lg shadow-md">
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
            <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
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
                <div className="p-6 bg-white rounded-lg shadow-md">
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

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                            className="flex items-center px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                          >
                            <FaSave className="mr-2" />
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-gray-50">
                          <h3 className="text-2xl font-bold text-[#383B26] mb-2">{healingHeroData.title}</h3>
                          <p className="text-lg text-[#8F907E] mb-3">{healingHeroData.subtitle}</p>
                          <p className="text-sm text-gray-700">{healingHeroData.bodyText}</p>
                        </div>
                      )}
                    </div>

                    {/* Featured Video */}
                    <div>
                      <h3 className="font-medium text-[#383B26] mb-3">Featured Video</h3>
                      <div className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center h-32 mb-3 bg-gray-200 rounded">
                          <div className="text-center text-gray-500">
                            <FaVideo className="mx-auto mb-2 text-xl" />
                            <p className="text-sm">Video Preview</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {healingHeroData.featuredVideoTitle ? (
                            <>
                              <p className="text-sm"><strong>Current:</strong> {healingHeroData.featuredVideoTitle}</p>
                              <p className="text-sm text-[#8F907E]">Published: {healingHeroData.featuredVideoDate}</p>
                              <p className="text-sm text-[#8F907E]">ID: {healingHeroData.featuredVideoId}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm"><strong>Current:</strong> No featured video selected</p>
                              <p className="text-sm text-[#8F907E]">Click below to select a featured video from your carousel</p>
                            </>
                          )}
                        </div>
                        <button 
                          onClick={() => setShowHealingFeaturedVideoSelector(true)}
                          className="w-full mt-3 px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] text-sm"
                        >
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
                <div className="p-6 bg-white rounded-lg shadow-md">
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

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="relative p-4 border rounded-lg group">
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
                    <div className="relative p-4 border rounded-lg group">
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
                  <div className="p-6 bg-white rounded-lg shadow-md">
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

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {healingVideos
                        .filter(video => video.carousel === 'part1' && video.isActive)
                        .sort((a, b) => a.order - b.order)
                        .map((video) => (
                          <div key={video.id} className="overflow-hidden border border-gray-200 rounded-lg">
                            <div className="relative">
                              <Image
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="object-cover w-full h-32"
                                width={400}
                                height={128}
                              />
                              <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 opacity-0 hover:opacity-100">
                                <FaVideo className="text-2xl text-white" />
                              </div>
                              {video.duration && (
                                <div className="absolute px-2 py-1 text-xs text-white bg-black bg-opacity-75 rounded bottom-2 right-2">
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
                                  className="flex items-center px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
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
                  <div className="p-6 bg-white rounded-lg shadow-md">
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

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {healingVideos
                        .filter(video => video.carousel === 'part2' && video.isActive)
                        .sort((a, b) => a.order - b.order)
                        .map((video) => (
                          <div key={video.id} className="overflow-hidden border border-gray-200 rounded-lg">
                            <div className="relative">
                              <Image
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="object-cover w-full h-32"
                                width={400}
                                height={128}
                              />
                              <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 opacity-0 hover:opacity-100">
                                <FaVideo className="text-2xl text-white" />
                              </div>
                              {video.duration && (
                                <div className="absolute px-2 py-1 text-xs text-white bg-black bg-opacity-75 rounded bottom-2 right-2">
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
                                  className="flex items-center px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
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
                <div className="p-6 bg-white rounded-lg shadow-md">
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {healingProducts.length === 0 ? (
                      <div className="py-8 text-center col-span-full">
                        <FaHeartbeat className="mx-auto mb-4 text-4xl text-gray-300" />
                        <p className="mb-4 text-gray-500">No products added yet</p>
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
                          <div key={product.id} className="p-4 transition-shadow border rounded-lg hover:shadow-md">
                            <div className="relative mb-3">
                              {product.imageUrl ? (
                                <Image 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="object-cover w-full h-24 rounded"
                                  width={400}
                                  height={96}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-24 bg-gray-200 rounded">
                                  <FaHeartbeat className="text-xl text-gray-400" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-[#383B26] mb-1">{product.name}</h3>
                            <p className="text-sm text-[#8F907E] mb-2 line-clamp-2">{product.purpose}</p>
                            {product.howToUse && (
                              <p className="mb-2 text-xs text-gray-600 line-clamp-1">How to use: {product.howToUse}</p>
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
                                className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
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
              <p className="text-[#8F907E]">Add, edit, and organize products</p>
              
              {/* Enhanced Stats */}
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

            {/* Enhanced Controls */}
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
                        description: '',
                        price: undefined,
                        tags: [],
                        isAlexisPick: false,
                        isFavorite: false,
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
                    onClick={async () => {
                      try {
                        const dataStr = storefrontService.export();
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'storefront-backup.json';
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Products exported!');
                      } catch (error) {
                        toast.error('Export failed');
                      }
                    }}
                    className="bg-[#8F907E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7A7B6A] transition-colors"
                  >
                    <FaDownload /> Export
                  </button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            const text = await file.text();
                            storefrontService.import(text);
                            const products = await storefrontService.getAll();
                            setSfProducts(products);
                            setSfItems(products);
                            const stats = await storefrontService.getStats();
                            setSfStats(stats);
                            toast.success('Products imported!');
                          } catch (error) {
                            toast.error('Import failed');
                          }
                        }
                      };
                      input.click();
                    }}
                    className="bg-[#8F907E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7A7B6A] transition-colors"
                  >
                    <FaUploadIcon /> Import
                  </button>
                </div>
                
                {/* Search */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={sfSearch}
                    onChange={(e) => setSfSearch(e.target.value)}
                    className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B89178] focus:ring-1 focus:ring-[#B89178]"
                  />
                  <select
                    value={sfCategory}
                    onChange={(e) => setSfCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B89178] focus:ring-1 focus:ring-[#B89178]"
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B89178] focus:ring-1 focus:ring-[#B89178]"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Enhanced Product Grid */}
            <div className="space-y-4">
              {sfItems.length > 0 ? (
                sfItems
                  .filter(product => {
                    const matchesCategory = sfCategory === 'all' || product.category === sfCategory;
                    const matchesStatus = sfStatus === 'all' || product.status === sfStatus;
                    const matchesSearch = sfSearch === '' || 
                      product.title.toLowerCase().includes(sfSearch.toLowerCase()) ||
                      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(sfSearch.toLowerCase())));
                    return matchesCategory && matchesStatus && matchesSearch;
                  })
                  .map(product => (
                    <div key={product.id} className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg hover:shadow-md">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-100 rounded-lg">
                          {(product.image || product.imageUrl) ? (
                            <Image 
                              src={(product.image || product.imageUrl) || '/placeholder.jpg'} 
                              alt={product.title} 
                              className="object-cover w-full h-full" 
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <FaStore className="text-xl text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-[#383B26] truncate">{product.title}</h3>
                                {product.showInFavorites && (
                                  <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">⭐ Favorite</span>
                                )}
                                {product.isAlexisPick && (
                                  <span className="bg-[#B89178] text-white text-xs px-2 py-1 rounded-full">Alexis&apos; Pick</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-[#8F907E] mb-2">
                                <span className="bg-[#E3D4C2] px-2 py-1 rounded-full capitalize">{product.category.replace('-', ' ')}</span>
                                <span className={`px-2 py-1 rounded-full ${
                                  product.status === 'published' ? 'bg-green-100 text-green-800' :
                                  product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.status}
                                </span>
                                {product.price && (
                                  <span className="font-semibold text-[#B89178]">
                                    ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                                  </span>
                                )}
                              </div>
                              
                              <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                                {product.noteShort || product.description || 'No description'}
                              </p>
                              
                              {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {product.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {product.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">+{product.tags.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSfEditing(product)}
                                className="bg-[#B89178] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#A67B62] flex items-center gap-1"
                              >
                                <FaEdit className="text-xs" /> Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete "${product.title}"?`)) {
                                    try {
                                      await storefrontService.delete(product.id);
                                      const products = await storefrontService.getAll();
                                      setSfProducts(products);
                                      setSfItems(products);
                                      const stats = await storefrontService.getStats();
                                      setSfStats(stats);
                                      toast.success('Product deleted');
                                    } catch (error) {
                                      toast.error('Delete failed');
                                    }
                                  }
                                }}
                                className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-8 text-center bg-white rounded-lg">
                  <FaStore className="mx-auto mb-4 text-4xl text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-600">No products found</h3>
                  <p className="mb-4 text-gray-500">
                    {sfSearch || sfCategory !== 'all' || sfStatus !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'Add your first product to get started'}
                  </p>
                  <button
                    onClick={() => setSfIsAdding(true)}
                    className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] flex items-center gap-2 mx-auto"
                  >
                    <FaPlus /> Add Product
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Analytics */}
            <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-[#8F907E] uppercase mb-3">Categories</h3>
                <div className="space-y-2">
                  {Object.entries(sfStats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="capitalize">{category.replace('-', ' ')}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-[#8F907E] uppercase mb-3">Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Published</span>
                    <span className="font-medium text-green-600">{sfStats.byStatus.published}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Drafts</span>
                    <span className="font-medium text-yellow-600">{sfStats.byStatus.draft}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Archived</span>
                    <span className="font-medium text-gray-600">{sfStats.byStatus.archived}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-[#8F907E] uppercase mb-3">Favorites</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#B89178] mb-1">{sfStats.favorites}</div>
                  <div className="text-xs text-gray-500">Featured products</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-[#8F907E] uppercase mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setSfCategory('food')}
                    className="w-full p-1 text-sm text-left rounded hover:bg-gray-50"
                  >
                    View Food ({(sfStats.byCategory as any).food || 0})
                  </button>
                  <button 
                    onClick={() => setSfStatus('draft')}
                    className="w-full p-1 text-sm text-left rounded hover:bg-gray-50"
                  >
                    View Drafts ({sfStats.byStatus.draft})
                  </button>
                  <button 
                    onClick={() => setSfIsAdding(true)}
                    className="w-full text-left text-sm hover:bg-gray-50 p-1 rounded text-[#B89178]"
                  >
                    + Add Product
                  </button>
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
        isOpen={sfIsAdding || !!sfEditing}
        onClose={() => {
          setSfIsAdding(false);
          setSfEditing(null);
        }}
        product={sfEditing}
        onSave={handleSaveStorefrontProduct}
      />

      {/* Featured Video Selector Modals */}
      <FeaturedVideoSelectorModal
        isOpen={showHealingFeaturedVideoSelector}
        onClose={() => setShowHealingFeaturedVideoSelector(false)}
        videos={healingVideos}
        currentFeaturedVideoId={healingHeroData.featuredVideoId}
        onSelect={handleSelectHealingFeaturedVideo}
        title="Select Featured Video for Healing Page"
      />

      <FeaturedVideoSelectorModal
        isOpen={showVlogFeaturedVideoSelector}
        onClose={() => setShowVlogFeaturedVideoSelector(false)}
        videos={vlogs}
        currentFeaturedVideoId={vlogHeroData.featuredVideoId}
        onSelect={handleSelectVlogFeaturedVideo}
        title="Select Featured Video for Vlogs Page"
      />

      {/* Home Content Modal */}
      <HomeContentModal
        isOpen={homeContentModalOpen}
        onClose={() => setHomeContentModalOpen(false)}
        initialData={homePageContent}
        onSave={handleSaveHomeContent}
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