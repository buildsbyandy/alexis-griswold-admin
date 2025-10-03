import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { withAdminSSP } from '../lib/auth/withAdminSSP';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaStar, FaHeart, FaDownload, FaUpload as FaUploadIcon, FaVideo, FaStore, FaUtensils, FaImage, FaHeartbeat, FaMusic, FaSignOutAlt, FaFolder } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import toast from 'react-hot-toast';
import FileUpload from '../components/ui/FileUpload';
import { STORAGE_PATHS } from '../lib/constants/storagePaths';
import RecipeModal from '../components/modals/RecipeModal';
import RecipeFolderModal from '../components/modals/RecipeFolderModal';
import VlogModal from '../components/modals/VlogModal';
import PhotoAlbumModal from '../components/modals/PhotoAlbumModal';
import HomeContentModal from '../components/modals/HomeContentModal';
import SpotifySectionConfigModal from '../components/modals/SpotifySectionConfigModal';
import SpotifyPlaylistModal from '../components/modals/SpotifyPlaylistModal';
import HealingProductModal from '../components/modals/HealingProductModal';
import { type HealingProductRow } from '../lib/services/healingService';
import CarouselHeaderModal, { type CarouselHeader } from '../components/modals/CarouselHeaderModal';
import HealingCarouselModal from '../components/modals/HealingCarouselModal';
import SecureImage from '../components/admin/SecureImage';
import { parseSupabaseUrl } from '../util/imageUrl';
import TikTokVideoModal from '../components/modals/TikTokVideoModal';
import StorefrontProductModal from '../components/modals/StorefrontProductModal';
import CategoryPhotoModal from '../components/modals/CategoryPhotoModal';
import FeaturedVideoSelectorModal from '../components/modals/FeaturedVideoSelectorModal';
import recipeService from '../lib/services/recipeService';
import type { Recipe, RecipeFolder } from '../lib/services/recipeService';
import vlogService, { type VlogVideo, type VlogCarouselType } from '../lib/services/vlogService';
import playlistService, { type SpotifyPlaylist } from '../lib/services/playlistService';
import albumService, { type PhotoAlbum } from '../lib/services/albumService';
import healingService, { type HealingVideo } from '../lib/services/healingService';
import storefrontService from '../lib/services/storefrontService';
import { youtubeService } from '../lib/services/youtubeService';
import type { StorefrontProductRow, StorefrontProductFormData, StorefrontCategoryRow } from '../lib/types/storefront';
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
  const [featuredRecipeId, setFeaturedRecipeId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showBeginnerRecipesView, setShowBeginnerRecipesView] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [imageModalGallery, setImageModalGallery] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [recipeActiveTab, setRecipeActiveTab] = useState<'recipes' | 'page-content' | 'hero-videos'>('recipes');
  
  // Recipe page content state
  const [recipePageContent, setRecipePageContent] = useState({
    hero_title: 'RECIPES & TUTORIALS',
    hero_subtitle: 'Living with passion, energy, and confidence starts from within.',
    hero_body_paragraph: 'The recipes and rituals I share here are the foundation of how I fuel my body, mind, and spirit everyday. Every smoothie, every meal, and every moment of self-care is designed to support a vibrant, fast-paced life where you feel light, alive, and ready for anything. This is more than food and tutorials, this is a lifestyle rooted in vitality.',
    hero_background_image: null as string | null,
    hero_cta_text: null as string | null,
    hero_cta_url: null as string | null,
    beginner_section_title: 'Just Starting Out',
    beginner_section_subtitle: 'Simple recipes for beginners',
    show_beginner_section: true,
    page_seo_title: 'Recipes & Tutorials - Alexis Griswold',
    page_seo_description: 'Discover vibrant recipes and wellness tutorials designed to fuel your body, mind, and spirit.'
  });
  
  // Recipe hero videos state
  const [recipeHeroVideos, setRecipeHeroVideos] = useState<any[]>([]);
  const [showAddHeroVideo, setShowAddHeroVideo] = useState(false);
  const [showAddRecipeTikTok, setShowAddRecipeTikTok] = useState(false);
  const [editingRecipeHeroVideo, setEditingRecipeHeroVideo] = useState<any>(null);
  const [newHeroVideo, setNewHeroVideo] = useState({
    youtube_url: '',
    video_title: '',
    video_description: '',
    // Legacy video_order field removed - order managed by carousel system
    video_thumbnail_url: ''
  });
  const [isLoadingRecipeContent, setIsLoadingRecipeContent] = useState(false);
  const [isSavingRecipeContent, setIsSavingRecipeContent] = useState(false);
  const [vlogs, setVlogs] = useState<VlogVideo[]>([]);
  const [featuredVlogId, setFeaturedVlogId] = useState<string | null>(null);
  const [editingVlog, setEditingVlog] = useState<VlogVideo | null>(null);
  const [isAddingVlog, setIsAddingVlog] = useState(false);
  const [vlogActiveTab, setVlogActiveTab] = useState<'hero' | 'videos' | 'gallery' | 'spotify'>('hero');
  const [editingVlogHero, setEditingVlogHero] = useState(false);
  const [spotifySectionConfigModalOpen, setSpotifySectionConfigModalOpen] = useState(false);
  const [spotifySectionConfig, setSpotifySectionConfig] = useState({
    section_title: 'Listen to My Playlists',
    section_subtitle: 'Curated music for every mood and moment'
  });
  const [vlogHeroData, setVlogHeroData] = useState({
    title: 'VLOGS',
    subtitle: 'Step into my life — one video at a time.',
    bodyText: 'Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with purpose, passion, and the simple joys that make each day extraordinary.',
    featuredVideoId: '',
    featuredVideoTitle: '',
    featuredVideoDate: '',
    featuredVideoThumbnail: ''
  });
  const [healingProducts, setHealingProducts] = useState<HealingProductRow[]>([]);
  const [editingHealingProduct, setEditingHealingProduct] = useState<HealingProductRow | null>(null);
  const [isAddingHealingProduct, setIsAddingHealingProduct] = useState(false);
  const [editingCarouselHeader, setEditingCarouselHeader] = useState<CarouselHeader | null>(null);
  const [healingVideos, setHealingVideos] = useState<HealingVideo[]>([]);
  const [editingHealingVideo, setEditingHealingVideo] = useState<HealingVideo | null>(null);
  const [showHealingCarouselModal, setShowHealingCarouselModal] = useState(false);
  const [sfProducts, setSfProducts] = useState<StorefrontProductRow[]>([]);
  const [editingSfProduct, setEditingSfProduct] = useState<StorefrontProductRow | null>(null);
  const [isAddingSfProduct, setIsAddingSfProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [recipeFolders, setRecipeFolders] = useState<RecipeFolder[]>([]);
  const [stats, setStats] = useState({ total: 0, byFolder: {}, beginners: 0, recipeOfWeek: 0 });
  const [sfItems, setSfItems] = useState<StorefrontProductRow[]>([]);
  const [sfEditing, setSfEditing] = useState<StorefrontProductRow | null>(null);
  const [sfIsAdding, setSfIsAdding] = useState(false);
  const [sfSearch, setSfSearch] = useState('');
  const [sfCategory, setSfCategory] = useState<string>('all');
  const [sfStatus, setSfStatus] = useState<string>('all');
  const [sfStats, setSfStats] = useState({ total: 0, byStatus: { draft: 0, published: 0, archived: 0 }, byCategory: {}, favorites: 0 });
  const [sfCategories, setSfCategories] = useState<StorefrontCategoryRow[]>([]);
  const [storefrontActiveTab, setStorefrontActiveTab] = useState<'products' | 'categories' | 'carousels'>('products');
  const [showCategoryPhotoModal, setShowCategoryPhotoModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StorefrontCategoryRow | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [sfTopPicks, setSfTopPicks] = useState<Array<{ id: string; ref_id: string; order_index: number | null; product_title: string | null; image_path: string | null; amazon_url: string | null }>>([]);
  const [sfFavorites, setSfFavorites] = useState<Array<{ id: string; ref_id: string; product_title: string | null; image_path: string | null; amazon_url: string | null }>>([]);
  const [showVlogModal, setShowVlogModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [photoAlbums, setPhotoAlbums] = useState<PhotoAlbum[]>([]);
  const [vlogsPhotoGalleryCarouselId, setVlogsPhotoGalleryCarouselId] = useState<string>('');
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
  const [currentCarouselContext, setCurrentCarouselContext] = useState<'part1' | 'part2' | 'tiktoks' | 'featured'>('part1');
  const [showHealingFeaturedVideoSelector, setShowHealingFeaturedVideoSelector] = useState(false);
  const [healingCarousels, setHealingCarousels] = useState<{
    part1: { title: string; description: string } | null;
    part2: { title: string; description: string } | null;
    tiktoks: { title: string; description: string } | null;
  }>({
    part1: null,
    part2: null,
    tiktoks: null
  });
  const [showVlogFeaturedVideoSelector, setShowVlogFeaturedVideoSelector] = useState(false);
  const [healingHeroData, setHealingHeroData] = useState({
    title: 'HEALING',
    subtitle: 'Your journey to wellness starts here.',
    bodyText: 'From gut health to holistic healing, discover natural methods to restore your body\'s balance and vitality.',
    featuredVideoId: 'dQw4w9WgXcQ',
    featuredVideoTitle: 'Healing Journey Introduction',
    featuredVideoDate: '2024-01-15'
  });

  // Featured video loaded from carousel system
  const [healingFeaturedVideo, setHealingFeaturedVideo] = useState<HealingVideo | null>(null);
  const [loadingFeaturedVideo, setLoadingFeaturedVideo] = useState(false);

  // Vlog stats state
  const [vlogStats, setVlogStats] = useState({ totalVlogs: 0, featuredVlogs: 0, totalAlbums: 0, totalPhotos: 0 });
  const [spotifyStats, setSpotifyStats] = useState({ totalPlaylists: 0, activePlaylists: 0 });

  // Recipe save functionality
  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      let savedRecipeId: string;
      const wasBeginnerBefore = editingRecipe?.is_beginner || false;
      const wasRecipeOfWeekBefore = editingRecipe?.is_recipe_of_week || false;

      if (editingRecipe) {
        // Update existing recipe
        const result = await recipeService.updateRecipe(editingRecipe.id, recipeData);
        if (!result) throw new Error('Failed to update recipe');
        savedRecipeId = editingRecipe.id;
      } else {
        // Create new recipe
        const result = await recipeService.addRecipe(recipeData);
        if (!result) throw new Error('Failed to create recipe');
        // Get the ID of the newly created recipe
        const recipesList = await recipeService.getAllRecipes();
        const newRecipe = recipesList.find(r => r.title === recipeData.title && r.slug === recipeData.slug);
        if (!newRecipe) throw new Error('Failed to find newly created recipe');
        savedRecipeId = newRecipe.id;
      }

      // Sync with carousel system for Beginner Recipes
      if (recipeData.is_beginner !== wasBeginnerBefore) {
        const { findCarouselByPageSlug, createCarouselItem, getCarouselItems, deleteCarouselItem } = await import('../lib/services/carouselService');
        const carousel = await findCarouselByPageSlug('recipes', 'recipes-beginner');

        if (carousel.data) {
          if (recipeData.is_beginner) {
            // Add to beginner carousel
            await createCarouselItem({
              carousel_id: carousel.data.id,
              kind: 'recipe',
              ref_id: savedRecipeId,
              caption: recipeData.title,
              order_index: 0,
              is_active: true,
              album_id: null,
              youtube_id: null,
              link_url: null,
              image_path: recipeData.hero_image_path || null,
              badge: null,
            });
          } else {
            // Remove from beginner carousel
            const items = await getCarouselItems(carousel.data.id);
            const existingItem = items.data?.find(item => item.ref_id === savedRecipeId);
            if (existingItem) {
              await deleteCarouselItem(existingItem.id);
            }
          }
        }
      }

      // Sync with carousel system for Recipe of Week
      if (recipeData.is_recipe_of_week !== wasRecipeOfWeekBefore) {
        const { findCarouselByPageSlug, createCarouselItem, getCarouselItems, deleteCarouselItem } = await import('../lib/services/carouselService');
        const carousel = await findCarouselByPageSlug('recipes', 'recipes-weekly-pick');

        if (carousel.data) {
          if (recipeData.is_recipe_of_week) {
            // Add to weekly pick carousel
            await createCarouselItem({
              carousel_id: carousel.data.id,
              kind: 'recipe',
              ref_id: savedRecipeId,
              caption: recipeData.title,
              order_index: 0,
              is_active: true,
              album_id: null,
              youtube_id: null,
              link_url: null,
              image_path: recipeData.hero_image_path || null,
              badge: null,
            });
          } else {
            // Remove from weekly pick carousel
            const items = await getCarouselItems(carousel.data.id);
            const existingItem = items.data?.find(item => item.ref_id === savedRecipeId);
            if (existingItem) {
              await deleteCarouselItem(existingItem.id);
            }
          }
        }
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
            const { id, created_at, updated_at, ...recipeData } = recipe;
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

  // Recipe page content functionality
  const loadRecipePageContent = async () => {
    try {
      setIsLoadingRecipeContent(true);
      const response = await fetch('/api/recipes/page-content');
      if (response.ok) {
        const data = await response.json();
        setRecipePageContent(data.content);
      }
    } catch (error) {
      console.error('Error loading recipe page content:', error);
      toast.error('Failed to load recipe page content');
    } finally {
      setIsLoadingRecipeContent(false);
    }
  };

  const handleSaveRecipePageContent = async () => {
    try {
      setIsSavingRecipeContent(true);
      const response = await fetch('/api/recipes/page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipePageContent)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save content');
      }

      const data = await response.json();
      setRecipePageContent(data.content);
      toast.success('Recipe page content saved successfully!');
    } catch (error) {
      console.error('Error saving recipe page content:', error);
      toast.error('Failed to save recipe page content');
    } finally {
      setIsSavingRecipeContent(false);
    }
  };

  const loadRecipeHeroVideos = async () => {
    try {
      const response = await fetch('/api/recipes/hero-videos');
      if (response.ok) {
        const data = await response.json();
        setRecipeHeroVideos(data.videos);
      }
    } catch (error) {
      console.error('Error loading recipe hero videos:', error);
      toast.error('Failed to load hero videos');
    }
  };

  const handleDeleteHeroVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      const response = await fetch(`/api/recipes/hero-videos/${videoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete video');
      }

      setRecipeHeroVideos(prev => prev.filter(video => video.id !== videoId));
      toast.success('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting hero video:', error);
      toast.error('Failed to delete video');
    }
  };

  const handleCreateHeroVideo = async () => {
    try {
      const { youtube_url, video_title, video_description, video_thumbnail_url } = newHeroVideo;
      if (!youtube_url.trim()) {
        toast.error('YouTube URL is required');
        return;
      }
      if (!video_title.trim()) {
        toast.error('Video title is required');
        return;
      }

      const response = await fetch('/api/recipes/hero-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url,
          video_title,
          video_description: video_description || null,
          // Legacy video_order field removed - order managed by carousel system
          video_thumbnail_url: video_thumbnail_url || null
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to create hero video' }));
        throw new Error(err.error || 'Failed to create hero video');
      }

      setShowAddHeroVideo(false);
      setNewHeroVideo({ youtube_url: '', video_title: '', video_description: '', video_thumbnail_url: '' });
      await loadRecipeHeroVideos();
      toast.success('Hero video added');
    } catch (error) {
      console.error('Create hero video error:', error);
      toast.error('Failed to add hero video');
    }
  };

  // Vlog save functionality
  const handleSaveVlog = async (vlogData: Omit<VlogVideo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Map from VlogVideo interface to API format
      const apiData = {
        youtube_url: vlogData.youtube_url,
        carousel: vlogData.carousel || 'vlogs-main-channel', // Default to vlogs-main-channel if undefined
        title: vlogData.title,
        description: vlogData.description,
        // Legacy is_featured field removed - featured status managed by carousel system
        order_index: vlogData.order_index,
        thumbnail_url: vlogData.thumbnail_url,
        published_at: vlogData.published_at,
        duration: vlogData.duration
      };

      if (editingVlog) {
        // Update existing vlog via PUT API
        const response = await fetch(`/api/vlogs/${editingVlog.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update vlog');
        }
      } else {
        // Create new vlog via API
        const response = await fetch('/api/vlogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create vlog');
        }
      }

      // Reset UI state immediately after successful API call
      setIsAddingVlog(false);
      setEditingVlog(null);

      // Attempt data reload with separate error handling
      try {
        const vlogsList = await vlogService.getAllVlogs();
        setVlogs(vlogsList);

        const vlogStatsData = await vlogService.getStats();
        setVlogStats(prev => ({
          totalVlogs: vlogStatsData.totalVlogs,
          featuredVlogs: vlogStatsData.featuredVlogs,
          totalAlbums: prev.totalAlbums,
          totalPhotos: prev.totalPhotos,
        }));
      } catch (reloadError) {
        // Log reload errors but don't fail the entire operation
        console.error('Warning: Failed to reload data after successful vlog operation:', reloadError);
        // Vlog was still saved successfully, so we don't throw here
      }

    } catch (error) {
      // This catch block now only handles actual API failures
      console.error('Error saving vlog:', error);
      throw error;
    }
  };

  const handleSaveAlbum = async (albumData: Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at'>, carouselId: string, orderIndex?: number) => {
    try {
      if (editingAlbum) {
        const success = await albumService.updateAlbum(editingAlbum.id, albumData);
        if (!success) throw new Error('Failed to update album');
      } else {
        const success = await albumService.addAlbum(albumData, carouselId, orderIndex);
        if (!success) throw new Error('Failed to create album');
      }

      // Reload albums and stats
      const allAlbums = await albumService.getAllAlbums();
      setPhotoAlbums(allAlbums);
      const vlogStatsData = await vlogService.getStats();
      const albumStats = await albumService.getStats();
      setVlogStats(prev => ({
        totalVlogs: vlogStatsData.totalVlogs,
        featuredVlogs: vlogStatsData.featuredVlogs,
        totalAlbums: albumStats.totalAlbums,
        totalPhotos: albumStats.totalPhotos
      }));

      setEditingAlbum(null);
      setShowAlbumModal(false);
    } catch (error) {
      console.error('Error saving album:', error);
      throw error;
    }
  };

  const handleSavePlaylist = async (playlistData: Omit<SpotifyPlaylist, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingPlaylist) {
        const success = await playlistService.updatePlaylist(editingPlaylist.id, playlistData);
        if (!success) throw new Error('Failed to update playlist');
      } else {
        const success = await playlistService.addPlaylist(playlistData);
        if (!success) throw new Error('Failed to create playlist');
      }

      // Reload playlists and stats
      const allPlaylists = await playlistService.getAllPlaylists();
      setSpotifyPlaylists(allPlaylists);
      setSpotifyStats({
        totalPlaylists: allPlaylists.length,
        activePlaylists: allPlaylists.filter(p => p.is_active).length
      });

      setEditingPlaylist(null);
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Error saving playlist:', error);
      throw error;
    }
  };

  // Healing save functionality
  const handleSaveHealingProduct = async (productData: Omit<HealingProductRow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingHealingProduct) {
        const updateResult = await healingService.update_healing_product(editingHealingProduct.id, productData);
        if (updateResult.error) throw new Error(updateResult.error);
      } else {
        const createResult = await healingService.create_healing_product(productData);
        if (createResult.error) throw new Error(createResult.error);
      }
      
      // Reload products
      const productsList = await healingService.get_all_products();
      setHealingProducts(productsList);

      setIsAddingHealingProduct(false);
      setEditingHealingProduct(null);
    } catch (error) {
      console.error('Error saving healing product:', error);
      throw error;
    }
  };

  const handleSaveCarouselItem = async (itemData: any) => {
    try {
      // Use unified carousel service for ALL item types
      const { findCarouselByPageSlug, createCarouselItem } = await import('../lib/services/carouselService');

      // Map carousel context to slug
      const slugMapping = {
        'part1': 'healing-part-1',
        'part2': 'healing-part-2',
        'tiktoks': 'healing-tiktoks',
        'featured': 'healing-featured'
      };

      const carouselSlug = slugMapping[currentCarouselContext];
      if (!carouselSlug) {
        throw new Error(`Unknown carousel context: ${currentCarouselContext}`);
      }

      // Find the carousel
      const carouselResult = await findCarouselByPageSlug('healing', carouselSlug);
      if (carouselResult.error || !carouselResult.data) {
        throw new Error(`Carousel ${carouselSlug} not found. Please ensure the carousel exists.`);
      }

      if (itemData.type === 'video') {
        const videoData = itemData.data as Omit<HealingVideo, 'id' | 'createdAt' | 'updatedAt'>;
      
        // Extract YouTube ID from URL using the service
        const extractResult = youtubeService.extract_video_id(videoData.youtube_url);
        if (extractResult.error || !extractResult.data) {
          throw new Error(extractResult.error || 'Failed to extract YouTube ID');
        }
        const youtubeId = extractResult.data;
      
        console.log('[DEBUG] Extracted YouTube ID:', youtubeId, 'from URL:', videoData.youtube_url);
      
        const createResult = await createCarouselItem({
          carousel_id: carouselResult.data.id,
          kind: 'video',
          youtube_id: youtubeId,  // Use the extracted ID
          link_url: null,
          caption: videoData.video_title || null,
          order_index: videoData.order || 1,
          is_active: true,
          album_id: null,
          ref_id: null,
          image_path: null,
          badge: null,
        });
      
        if (createResult.error) {
          throw new Error(createResult.error);
        }

      toast.success('Video added successfully!');

      } else if (itemData.type === 'album') {
        // Handle album items using unified system
        const albumData = itemData.data;

        const createResult = await createCarouselItem({
          carousel_id: carouselResult.data.id,
          kind: 'album', // Use 'album' kind for album carousel items
          youtube_id: null,
          link_url: null,
          caption: albumData.title || null,
          order_index: albumData.order || 1,
          is_active: true,
          album_id: albumData.id || null,
          ref_id: albumData.id || null,
          image_path: albumData.cover_image_path || null,
          badge: null,
          // Legacy is_featured field removed - featured status managed by carousel system
        });

        if (createResult.error) {
          throw new Error(createResult.error);
        }

        toast.success('Album added successfully!');
      } else if (itemData.type === 'tiktok') {
        // Handle TikTok items using unified system
        const tiktokData = itemData.data;

        const createResult = await createCarouselItem({
          carousel_id: carouselResult.data.id,
          kind: 'tiktok',
          link_url: tiktokData.link_url,
          caption: tiktokData.caption || null,
          order_index: tiktokData.order_index,
          is_active: true,
          album_id: null,
          ref_id: null,
          image_path: tiktokData.thumbnail_url || null,
          youtube_id: null,
          badge: null,
        });

        if (createResult.error) {
          throw new Error(createResult.error);
        }

        toast.success('TikTok video added successfully!');
      }

      setShowHealingCarouselModal(false);
      setEditingHealingVideo(null);

      // Refresh featured video data if we were working with featured context
      if (currentCarouselContext === 'featured') {
        await loadHealingFeaturedVideo();
      }
    } catch (error) {
      console.error('Error saving carousel item:', error);
      throw error;
    }
  };

  const loadHealingCarousels = async () => {
    try {
      const { findCarouselByPageSlug } = await import('../lib/services/carouselService');

      const [part1, part2, tiktoks] = await Promise.all([
        findCarouselByPageSlug('healing', 'healing-part-1'),
        findCarouselByPageSlug('healing', 'healing-part-2'),
        findCarouselByPageSlug('healing', 'healing-tiktoks')
      ]);

      setHealingCarousels({
        part1: part1.data ? { title: part1.data.title || '', description: part1.data.description || '' } : null,
        part2: part2.data ? { title: part2.data.title || '', description: part2.data.description || '' } : null,
        tiktoks: tiktoks.data ? { title: tiktoks.data.title || '', description: tiktoks.data.description || '' } : null
      });
    } catch (error) {
      console.error('Error loading healing carousels:', error);
    }
  };

  const handleSaveCarouselHeader = async (headerData: Omit<CarouselHeader, 'id' | 'updated_at'>) => {
    try {
      // Use unified carousel service for ALL carousels
      const { findCarouselByPageSlug, updateCarousel } = await import('../lib/services/carouselService');

      // Map carousel type to slug
      const slugMapping = {
        'part1': 'healing-part-1',
        'part2': 'healing-part-2',
        'tiktoks': 'healing-tiktoks'
      };

      const carouselSlug = slugMapping[headerData.type];
      if (!carouselSlug) {
        throw new Error(`Unknown carousel type: ${headerData.type}`);
      }

      // Find the carousel
      const carouselResult = await findCarouselByPageSlug('healing', carouselSlug);
      if (carouselResult.error || !carouselResult.data) {
        throw new Error(`Carousel ${carouselSlug} not found. Please ensure the carousel exists in the database.`);
      }

      // Update the carousel title and description using unified system
      const updateResult = await updateCarousel(carouselResult.data.id, {
        title: headerData.title,
        description: headerData.description,
        is_active: headerData.isActive,
      });

      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      // Reload carousel data to refresh UI
      await loadHealingCarousels();

      setEditingCarouselHeader(null);
      toast.success('Carousel header updated successfully!');
    } catch (error) {
      console.error('Error saving carousel header:', error);
      toast.error('Failed to update carousel header');
      throw error;
    }
  };


  const handleSaveStorefrontProduct = async (productData: StorefrontProductFormData) => {
    try {
      // Use existing API routes for now - they'll handle the validation
      if (sfEditing && !sfIsAdding) {
        // Convert form data to API format
        const apiData = {
          product_title: productData.product_title,
          slug: productData.slug,
          category_slug: productData.category_slug,
          amazon_url: productData.amazon_url,
          price: productData.price,
          image_path: productData.image_path,
          description: productData.description,
          tags: productData.tags,
          status: productData.status,
        };

        const response = await fetch(`/api/storefront/${sfEditing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update product');
        }
      } else {
        // Create new product
        const apiData = {
          product_title: productData.product_title,
          slug: productData.slug || productData.product_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category_slug: productData.category_slug,
          amazon_url: productData.amazon_url,
          price: productData.price,
          image_path: productData.image_path,
          description: productData.description,
          tags: productData.tags,
          status: productData.status,
        };

        const response = await fetch('/api/storefront', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create product');
        }
      }
      
      // Reload products and stats
      const productsList = await storefrontService.get_storefront_products();
      setSfProducts(productsList);
      setSfItems(productsList);

      const storefrontStats = await storefrontService.get_storefront_stats();
      setSfStats(storefrontStats);

      setSfIsAdding(false);
      setSfEditing(null);
    } catch (error) {
      console.error('Error saving storefront product:', error);
      // Ensure modal closes even on error
      setSfIsAdding(false);
      setSfEditing(null);
      alert(error instanceof Error ? error.message : 'Failed to save product');
    }
  };

  // Featured video management functions
  const loadHealingFeaturedVideo = async () => {
    try {
      setLoadingFeaturedVideo(true);
      const featuredVideoResult = await healingService.get_featured_video();
      if (featuredVideoResult.data) {
        setHealingFeaturedVideo(featuredVideoResult.data);
      } else {
        setHealingFeaturedVideo(null);
      }
    } catch (error) {
      console.error('Error loading featured video:', error);
      setHealingFeaturedVideo(null);
    } finally {
      setLoadingFeaturedVideo(false);
    }
  };

  const handleSelectHealingFeaturedVideo = async (video: HealingVideo) => {
    try {
      // Update the healing hero data with the selected video (for legacy modal)
      setHealingHeroData(prev => ({
        ...prev,
        featuredVideoId: video.youtube_id || video.id,
        featuredVideoTitle: video.video_title,
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
      // Use the new API to set the featured vlog
      const response = await fetch('/api/vlogs/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vlogId: video.id })
      });

      if (response.ok) {
        // Update the vlog hero data with the selected video
        setVlogHeroData(prev => ({
          ...prev,
          featuredVideoId: video.id,
          featuredVideoTitle: video.title,
          featuredVideoDate: video.published_at || new Date().toISOString().split('T')[0],
          featuredVideoThumbnail: video.thumbnail_url
        }));

        // Reload vlogs and stats to reflect the new featured status
        const vlogsList = await vlogService.getAllVlogs();
        setVlogs(vlogsList);

        const vlogStatsData = await vlogService.getStats();
        setVlogStats(prev => ({
          totalVlogs: vlogStatsData.totalVlogs,
          featuredVlogs: vlogStatsData.featuredVlogs,
          totalAlbums: prev.totalAlbums,
          totalPhotos: prev.totalPhotos,
        }));

        toast.success('Featured video updated successfully!');
        setShowVlogFeaturedVideoSelector(false);
      } else {
        toast.error('Failed to update featured video');
      }
    } catch (error) {
      console.error('Error updating featured video:', error);
      toast.error('Failed to update featured video');
    }
  };

  // Spotify section configuration save functionality
  const handleSaveSpotifySectionConfig = async (configData: any) => {
    try {
      const response = await fetch('/api/playlists/section-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      
      if (response.ok) {
        // Update local state with the new configuration
        setSpotifySectionConfig(configData);
      } else {
        throw new Error('Failed to save Spotify section configuration');
      }
    } catch (error) {
      console.error('Spotify section config save error:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  // Home content save functionality
  const handleSaveHomeContent = async (contentData: any) => {
    try {
      // Merge text content from modal with existing video paths from parent state
      const completeData = {
        background_video_path: homePageContent.background_video_path || homePageContent.videoBackground,
        fallback_image_path: homePageContent.fallback_image_path || homePageContent.fallbackImage,
        hero_main_title: contentData.hero_main_title || contentData.heroMainTitle,
        hero_subtitle: contentData.hero_subtitle || contentData.heroSubtitle,
        video_title: contentData.video_title || contentData.videoTitle,
        video_description: contentData.video_description || contentData.videoDescription,
        copyright_text: contentData.copyright_text,
        videoOpacity: contentData.videoOpacity ?? 0.7
      };

      const response = await fetch('/api/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData)
      });

      if (response.ok) {
        const responseData = await response.json();

        // Update local state with saved content
        setHomePageContent(prev => ({
          ...prev,
          hero_main_title: completeData.hero_main_title,
          hero_subtitle: completeData.hero_subtitle,
          video_title: completeData.video_title,
          video_description: completeData.video_description,
          videoOpacity: completeData.videoOpacity,
          heroMainTitle: completeData.hero_main_title,
          heroSubtitle: completeData.hero_subtitle,
          videoTitle: completeData.video_title,
          videoDescription: completeData.video_description
        }));

        // Update video history if provided in response
        if (responseData.content?.video_history) {
          setVideoHistory(Array.isArray(responseData.content.video_history)
            ? responseData.content.video_history
            : JSON.parse(responseData.content.video_history)
          );
        }

        toast.success('Home content saved successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save home content');
      }
    } catch (error) {
      console.error('Home content save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save. Please try again.');
      throw error; // Re-throw so modal can handle it
    }
  };

  // Load data function - moved outside useEffect so it can be called from other places
  const loadData = useCallback(async () => {
    const errors: string[] = [];
    
    try {
      // Load recipe data
      try {
        const recipeStats = await recipeService.getRecipeStats();
        setStats(recipeStats);

        const recipesList = await recipeService.getAllRecipes();
        setRecipes(recipesList);

        // Load recipe folders
        const foldersList = await recipeService.getAllFolders();
        setRecipeFolders(foldersList);

        // Load featured recipe
        const featuredRecipe = await recipeService.getFeaturedRecipe();
        if (featuredRecipe) {
          setFeaturedRecipeId(featuredRecipe.id);
        } else {
          setFeaturedRecipeId(null);
        }

        // Load recipe page content
        await loadRecipePageContent();
        await loadRecipeHeroVideos();
      } catch (error) {
        console.error('Error loading recipe data:', error);
        errors.push('Failed to load recipe data');
      }

      // Load storefront data
      try {
        const storefrontStats = await storefrontService.get_storefront_stats();
        setSfStats(storefrontStats);

        const storefrontItems = await storefrontService.get_storefront_products();
        setSfItems(storefrontItems);

        // Load storefront categories
        const response = await fetch('/api/storefront/categories');
        if (response.ok) {
          const data = await response.json();
          setSfCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error loading storefront data:', error);
        errors.push('Failed to load storefront data');
      }

      // Load vlog data
      try {
        const vlogStatsData = await vlogService.getStats();
        setVlogStats(prev => ({
          totalVlogs: vlogStatsData.totalVlogs,
          featuredVlogs: vlogStatsData.featuredVlogs,
          totalAlbums: prev.totalAlbums,
          totalPhotos: prev.totalPhotos,
        }));

        const vlogsList = await vlogService.getAllVlogs();
        setVlogs(vlogsList);

        // Load featured vlog for hero section
        const featuredVlog = await vlogService.getFeaturedVlog();
        if (featuredVlog) {
          setFeaturedVlogId(featuredVlog.id);
          setVlogHeroData(prev => ({
            ...prev,
            featuredVideoId: featuredVlog.id,
            featuredVideoTitle: featuredVlog.title,
            featuredVideoThumbnail: featuredVlog.thumbnail_url,
            featuredVideoDate: featuredVlog.published_at
          }));
        } else {
          setFeaturedVlogId(null);
          // Clear featured video data if none is selected
          setVlogHeroData(prev => ({
            ...prev,
            featuredVideoId: '',
            featuredVideoTitle: '',
            featuredVideoThumbnail: '',
            featuredVideoDate: ''
          }));
        }

        const albumsList = await albumService.getAllAlbums();
        setPhotoAlbums(albumsList);

        // Initialize or find the vlogs photo gallery carousel
        const { findCarouselByPageSlug, createCarousel } = await import('../lib/services/carouselService');
        let vlogsGalleryCarousel = await findCarouselByPageSlug('vlogs', 'vlogs-photo-gallery');

        if (!vlogsGalleryCarousel.data) {
          // Create the carousel if it doesn't exist
          const created = await createCarousel({
            page: 'vlogs',
            slug: 'vlogs-photo-gallery',
            title: 'Photo Gallery',
            is_active: true
          });
          if (!created.error && created.data) {
            setVlogsPhotoGalleryCarouselId(created.data.id);
          }
        } else {
          setVlogsPhotoGalleryCarouselId(vlogsGalleryCarousel.data.id);
        }
      } catch (error) {
        console.error('Error loading vlog data:', error);
        errors.push('Failed to load vlog data');
      }

      // Load healing data
      try {
        // Load healing page content (hero section)
        const contentResponse = await fetch('/api/healing/content');
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          if (contentData.data) {
            setHealingHeroData({
              title: contentData.data.hero_header || 'HEALING',
              subtitle: contentData.data.hero_subtitle || 'Your journey to wellness starts here.',
              bodyText: contentData.data.hero_body_paragraph || 'From gut health to holistic healing, discover natural methods to restore your body\'s balance and vitality.',
              featuredVideoId: contentData.data.hero_video_youtube_url || '',
              featuredVideoTitle: contentData.data.hero_video_title || '',
              featuredVideoDate: contentData.data.hero_video_date || '',
            });
          }
        }

        const healingProductsList = await healingService.get_all_products();
        setHealingProducts(healingProductsList);

        const healingVideosList = await healingService.get_all_videos();
        setHealingVideos(healingVideosList);

        // Load featured video from carousel system
        const featuredVideoResult = await healingService.get_featured_video();
        if (featuredVideoResult.data) {
          setHealingFeaturedVideo(featuredVideoResult.data);
        }

        // Load healing carousel headers
        await loadHealingCarousels();
      } catch (error) {
        console.error('Error loading healing data:', error);
        errors.push('Failed to load healing data');
      }

      // Load playlist data
      try {
        const playlists = await playlistService.getAllPlaylists();
        setSpotifyPlaylists(playlists);
        setSpotifyStats({
          totalPlaylists: playlists.length,
          activePlaylists: playlists.filter(p => p.is_active).length
        });

        // Load Spotify section configuration
        const configResponse = await fetch('/api/playlists/section-config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          setSpotifySectionConfig(configData.config);
        }
      } catch (error) {
        console.error('Error loading playlist data:', error);
        errors.push('Failed to load playlist data');
      }

      // Load home content - this is critical for the home page
      try {
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
          
          // Load video history with better error handling
          try {
            if (content?.video_history) {
              let parsedHistory;
              if (Array.isArray(content.video_history)) {
                parsedHistory = content.video_history;
              } else if (typeof content.video_history === 'string') {
                parsedHistory = JSON.parse(content.video_history);
              } else {
                parsedHistory = [];
              }
              setVideoHistory(parsedHistory);
            } else {
              // Ensure video history is always initialized as an empty array
              setVideoHistory([]);
            }
          } catch (parseError) {
            console.error('Error parsing video history:', parseError);
            setVideoHistory([]);
          }
        } else {
          console.error('Failed to fetch home content:', homeResponse.status, homeResponse.statusText);
          errors.push('Failed to load home page content');
        }
      } catch (error) {
        console.error('Error loading home content:', error);
        errors.push('Failed to load home page content');
      }

      // Show errors if any occurred, but don't fail the entire load
      if (errors.length > 0) {
        console.warn('Some dashboard data failed to load:', errors);
        toast.error(`Some data failed to load: ${errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Critical error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!imageModalUrl) return;

      if (event.key === 'Escape') {
        setImageModalUrl(null);
        setImageModalGallery([]);
        setCurrentImageIndex(0);
      } else if (event.key === 'ArrowRight' && imageModalGallery.length > 0) {
        setCurrentImageIndex(prev => (prev + 1) % imageModalGallery.length);
      } else if (event.key === 'ArrowLeft' && imageModalGallery.length > 0) {
        setCurrentImageIndex(prev => (prev - 1 + imageModalGallery.length) % imageModalGallery.length);
      }
    };

    if (imageModalUrl) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [imageModalUrl, imageModalGallery]);

  // Load carousel data when switching to carousels tab
  useEffect(() => {
    const loadCarouselData = async () => {
      if (activeTab === 'storefront' && storefrontActiveTab === 'carousels') {
        try {
          const [topPicks, favorites] = await Promise.all([
            storefrontService.list_top_picks(),
            storefrontService.list_favorites()
          ]);
          setSfTopPicks(topPicks);
          setSfFavorites(favorites);
        } catch (error) {
          console.error('Error loading carousel data:', error);
          toast.error('Failed to load carousel data');
        }
      }
    };
    loadCarouselData();
  }, [activeTab, storefrontActiveTab]);

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
                      <div className="text-xs text-center text-gray-500">
                        Upload a video to automatically publish it as your background
                      </div>
                      <FileUpload
                        accept="video/*,.mov,.mp4,.avi,.wmv,.flv,.webm,.m4v,.3gp,.mkv"
                        uploadType="video"
                        folder={STORAGE_PATHS.HOME_VIDEOS}
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

                          // Automatically save the new video to database
                          try {
                            const updatedContent = {
                              ...homePageContent,
                              background_video_path: url,
                              videoBackground: url
                            };

                            toast.loading('Saving video...', { id: 'save-video' });

                            const response = await fetch('/api/home', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(updatedContent)
                            });

                            if (response.ok) {
                              const responseData = await response.json();

                              // Update local state
                              setHomePageContent(updatedContent);

                              // Update video history if provided in response
                              if (responseData.content?.video_history) {
                                setVideoHistory(Array.isArray(responseData.content.video_history)
                                  ? responseData.content.video_history
                                  : JSON.parse(responseData.content.video_history)
                                );
                              }

                              toast.success('Video uploaded and published successfully!', { id: 'save-video' });
                            } else {
                              const errorData = await response.json();
                              throw new Error(errorData.error || 'Failed to save video');
                            }
                          } catch (error) {
                            console.error('Error saving video:', error);
                            toast.error(error instanceof Error ? error.message : 'Failed to save video', { id: 'save-video' });
                          }
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        Upload New Video
                      </FileUpload>
                    </div>
                    
                    <div className="p-3 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                      <h4 className="mb-2 text-sm font-medium text-blue-800">📝 Current Content</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-[#8F907E]"><strong>Hero Title:</strong> {homePageContent.heroMainTitle || 'Not set'}</p>
                        <p className="text-sm text-[#8F907E]"><strong>Hero Subtitle:</strong> {homePageContent.heroSubtitle || 'Not set'}</p>
                      </div>
                    </div>
                    
                    {/* Video Opacity Control */}
                    <div className="p-3 mt-4 border border-gray-200 rounded-lg bg-gray-50">
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
                      <div className="text-xs text-center text-gray-500">
                        Upload a high-quality image that represents your video content
                      </div>
                      <FileUpload
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                        uploadType="image"
                        folder={STORAGE_PATHS.HOME_IMAGES}
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

                    <div className="p-3 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                      <h4 className="mb-2 text-sm font-medium text-blue-800">📱 When is this image used?</h4>
                      <ul className="space-y-1 text-xs text-blue-700">
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
                <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
                  <h4 className="mb-1 text-sm font-medium text-blue-800">How it works:</h4>
                  <ul className="space-y-1 text-xs text-blue-700">
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

            {/* Recipe Sub-Navigation */}
            <div className="mb-6 bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex px-6">
                  {[
                    { id: 'recipes', name: 'Recipes', icon: '🍽️' },
                    { id: 'page-content', name: 'Hero Text', icon: '📝' },
                    { id: 'hero-videos', name: 'Hero TikTok Videos', icon: '🎬' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRecipeActiveTab(tab.id as any)}
                      className={`${
                        recipeActiveTab === tab.id
                          ? 'border-[#B8A692] text-[#B8A692]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 mr-8`}
                    >
                      <span>{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {recipeActiveTab === 'recipes' && (
              <>
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
                    <button
                      onClick={() => setShowBeginnerRecipesView(!showBeginnerRecipesView)}
                      className={`px-4 py-2 ${showBeginnerRecipesView ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md flex items-center`}
                    >
                      <FaStar className="mr-2" />
                      {showBeginnerRecipesView ? 'Hide' : 'View'} Beginner Recipes
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
                  {recipeFolders
                    .filter(folder => folder.is_visible)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map(folder => (
                      <option key={folder.id} value={folder.slug}>
                        {folder.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center whitespace-nowrap"
                >
                  <FaFolder className="mr-2" />
                  Manage Folders
                </button>
              </div>
            </div>

            {/* Beginner Recipes Carousel View */}
            {showBeginnerRecipesView && (
              <div className="p-6 mb-6 bg-white border-2 border-blue-200 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-[#383B26] mb-4 flex items-center">
                  <span className="mr-3 text-2xl">👶</span>
                  Beginner Recipes Carousel (Read-Only)
                </h2>
                <p className="text-[#8F907E] mb-6">
                  This view shows recipes currently in the &quot;recipes-beginner&quot; carousel.
                  These are automatically synced when you check/uncheck the &quot;Beginner Recipe&quot; checkbox when editing recipes.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {recipes
                    .filter(recipe => recipe.is_beginner)
                    .map(recipe => (
                      <div key={recipe.id} className="p-4 text-center border border-gray-200 rounded-lg">
                        <div className="relative flex items-center justify-center w-full h-32 mb-3 overflow-hidden bg-gray-200 rounded">
                          {recipe.hero_image_path ? (
                            <Image
                              src={recipe.hero_image_path}
                              alt={recipe.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                            />
                          ) : (
                            <FaUtensils className="text-2xl text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{recipe.title}</p>
                        <p className="text-xs text-gray-500">
                          Beginner • {recipe.category || 'Recipe'}
                          {recipe.prepTime && ` • ${recipe.prepTime}`}
                        </p>
                      </div>
                    ))}

                  {recipes.filter(recipe => recipe.is_beginner).length === 0 && (
                    <div className="p-8 text-center border-2 border-gray-300 border-dashed rounded-lg col-span-full">
                      <FaUtensils className="mx-auto mb-2 text-3xl text-gray-400" />
                      <p className="text-gray-500">No beginner recipes yet. Mark recipes as &quot;Beginner Recipe&quot; when editing them.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recipe Cards Grid */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#383B26] mb-4">Recipe Collection</h2>
              
              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recipes
                    .filter(recipe => 
                      (selectedFolder === 'all' || recipe.folder_slug === selectedFolder) &&
                      (searchTerm === '' || recipe.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(recipe => (
                      <div key={recipe.id} className="overflow-hidden transition-shadow border border-gray-200 rounded-lg hover:shadow-lg">
                        {/* Recipe Image */}
                        <div className="relative flex items-center justify-center h-48 bg-gray-200">
                          {recipe.hero_image_path ? (
                            <div
                              className="relative w-full h-full cursor-pointer group"
                              onClick={() => {
                                setImageModalUrl(recipe.hero_image_path || null);
                                setImageModalGallery(recipe.images || []);
                                setCurrentImageIndex(0);
                              }}
                            >
                              <Image 
                                src={recipe.hero_image_path} 
                                alt={recipe.title} 
                                className="object-cover w-full h-full transition-transform group-hover:scale-105" 
                                fill 
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                              />
                              <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 group-hover:bg-opacity-20">
                                <div className="text-sm font-medium text-white transition-opacity opacity-0 group-hover:opacity-100">
                                  Click to view
                                </div>
                              </div>
                            </div>
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
                            {recipe.is_favorite && <FaStar className="ml-2 text-yellow-500" />}
                          </div>
                          
                          <div className="mb-3 space-y-1">
                            <p className="text-sm text-[#8F907E]">
                              <strong>Category:</strong> {recipe.folder_slug || 'Uncategorized'}
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
                              onClick={async () => {
                                try {
                                  const isFeatured = featuredRecipeId === recipe.id;
                                  let success = false;

                                  if (isFeatured) {
                                    // Remove from featured
                                    success = await recipeService.removeFeaturedRecipe();
                                    if (success) {
                                      setFeaturedRecipeId(null);
                                      toast.success('Recipe removed from featured');
                                    }
                                  } else {
                                    // Set as featured
                                    success = await recipeService.setFeaturedRecipe(recipe.id);
                                    if (success) {
                                      setFeaturedRecipeId(recipe.id);
                                      toast.success('Recipe set as weekly pick');
                                    }
                                  }

                                  if (!success) {
                                    if (isFeatured) {
                                      toast.error('Failed to remove featured recipe');
                                    } else {
                                      toast.error('Failed to set featured recipe');
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error toggling featured recipe:', error);
                                  toast.error('Failed to update featured recipe');
                                }
                              }}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                featuredRecipeId === recipe.id
                                  ? 'text-yellow-500 bg-yellow-50 hover:text-yellow-600 hover:bg-yellow-100'
                                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                              }`}
                              title={featuredRecipeId === recipe.id ? "Remove from weekly pick" : "Set as weekly pick"}
                            >
                              <FaStar />
                            </button>
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
                    <span className="font-medium">{recipes.filter(r => r.is_favorite).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Last Updated:</span>
                    <span className="font-medium">Today</span>
                  </div>
                </div>
              </div>
            </div>
              </>
            )}

            {/* Page Content Tab */}
            {recipeActiveTab === 'page-content' && (
              <div className="space-y-6">
                {/* Hero Section Editor */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-[#383B26] mb-4 flex items-center">
                    <span className="mr-3 text-2xl">📝</span>
                    Recipe Page Hero Content
                  </h2>
                  <p className="text-[#8F907E] mb-6">Manage the main hero section text that appears at the top of the recipes page</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Title</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                        placeholder="RECIPES & TUTORIALS"
                        value={recipePageContent.hero_title}
                        onChange={(e) => setRecipePageContent(prev => ({ ...prev, hero_title: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-gray-500">Main heading displayed prominently</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Subtitle</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                        placeholder="Living with passion, energy, and confidence starts from within."
                        value={recipePageContent.hero_subtitle}
                        onChange={(e) => setRecipePageContent(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-gray-500">Supporting text under the main title</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-2">Hero Body Paragraph</label>
                      <textarea
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                        placeholder="The recipes and rituals I share here are the foundation of how I fuel my body, mind, and spirit everyday..."
                        value={recipePageContent.hero_body_paragraph}
                        onChange={(e) => setRecipePageContent(prev => ({ ...prev, hero_body_paragraph: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-gray-500">Detailed description that appears in the hero section</p>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button 
                        className="px-6 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center disabled:opacity-50"
                        onClick={handleSaveRecipePageContent}
                        disabled={isSavingRecipeContent}
                      >
                        <FaSave className="mr-2" />
                        Save Hero Content
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="p-6 rounded-lg shadow-md bg-gray-50">
                  <h3 className="text-lg font-semibold text-[#383B26] mb-4 flex items-center">
                    <span className="mr-2 text-xl">👁️</span>
                    Live Preview
                  </h3>
                  <div className="p-8 bg-white border-2 border-gray-300 border-dashed rounded-lg">
                    <h1 className="text-4xl font-bold text-[#383B26] mb-3">{recipePageContent.hero_title}</h1>
                    <p className="text-lg text-[#8F907E] mb-4">{recipePageContent.hero_subtitle}</p>
                    <p className="leading-relaxed text-gray-700">
                      {recipePageContent.hero_body_paragraph}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hero TikTok Videos Tab */}
            {recipeActiveTab === 'hero-videos' && (
              <>
              <div className="space-y-6">
                {/* TikTok Reels Carousel Manager */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-[#383B26] flex items-center">
                        <span className="mr-3 text-2xl">🎬</span>
                        TikTok Reels Carousel
                      </h2>
                      <p className="text-[#8F907E] mt-1">Manage the TikTok video carousel that appears in the hero section</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      onClick={() => setShowAddRecipeTikTok(true)}
                    >
                      <FaPlus className="mr-2" />
                      Add TikTok
                    </button>
                  </div>

                  {/* Video List */}
                  <div className="space-y-4">
                    {recipeHeroVideos.length > 0 ? (
                      recipeHeroVideos.map((video) => (
                        <div key={video.id} className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-24 h-16 overflow-hidden bg-gray-200 rounded">
                              {video.video_thumbnail_url ? (
                                <Image
                                  src={video.video_thumbnail_url}
                                  alt={video.caption || 'Video thumbnail'}
                                  width={96}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-300 to-gray-400">
                                  {video.video_type === 'tiktok' ? <SiTiktok className="text-gray-600" /> : <FaVideo className="text-gray-600" />}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[#383B26]">
                                {video.caption || 'Untitled Video'}
                              </h4>
                              <p className="mt-1 text-sm text-gray-600 truncate">{video.link_url}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                Order: {video.order_index}
                                {video.is_active ? (
                                  <span className="ml-1 text-green-600">• Active</span>
                                ) : (
                                  <span className="ml-1 text-red-600">• Inactive</span>
                                )}
                                {video.video_type && (
                                  <span className="ml-1 capitalize">• {video.video_type}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="p-2 text-gray-400 hover:text-[#B8A692]"
                                onClick={() => {
                                  console.log('[Edit Click] Video object:', video);
                                  setEditingRecipeHeroVideo(video);
                                  setShowAddRecipeTikTok(true);
                                }}
                                title="Edit video"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="p-2 text-gray-400 hover:text-red-600"
                                onClick={() => handleDeleteHeroVideo(video.id)}
                                title="Delete video"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Empty State */
                      <div className="py-12 text-center border-2 border-gray-300 border-dashed rounded-lg">
                        <FaVideo className="mx-auto mb-4 text-4xl text-gray-400" />
                        <h3 className="mb-2 text-lg font-medium text-gray-600">No Hero TikTok Videos Yet</h3>
                        <p className="mb-4 text-gray-500">Add TikTok videos to display in the hero carousel</p>
                        <button
                          className="px-6 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                          onClick={() => setShowAddRecipeTikTok(true)}
                        >
                          <FaPlus className="mr-2" />
                          Add Your First TikTok
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Hero Video Modal */}
              {showAddHeroVideo ? (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
                  <div className="w-full max-w-lg overflow-hidden bg-white rounded-lg shadow-xl">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F3F0]">
                      <h3 className="text-lg font-semibold text-[#383B26]">Add Hero Video</h3>
                      <button onClick={() => setShowAddHeroVideo(false)} className="p-1 text-gray-500 rounded hover:text-gray-700 hover:bg-gray-100">
                        <FaTimes />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="p-3 text-sm text-yellow-900 border border-yellow-200 rounded-md bg-yellow-50">
                        The YouTube Reels carousel is optimized for vertical, phone-friendly videos (Shorts). Landscape videos are accepted, but wide dimensions may be cropped within the carousel.
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL *</label>
                        <input
                          type="text"
                          value={newHeroVideo.youtube_url}
                          onChange={(e) => setNewHeroVideo(v => ({ ...v, youtube_url: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">Title *</label>
                        <input
                          type="text"
                          value={newHeroVideo.video_title}
                          onChange={(e) => setNewHeroVideo(v => ({ ...v, video_title: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                          placeholder="Short descriptive title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
                        <textarea
                          value={newHeroVideo.video_description}
                          onChange={(e) => setNewHeroVideo(v => ({ ...v, video_description: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                          placeholder="Optional description..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-[#383B26] mb-1">Order</label>
                          <input
                            type="number"
                            value={0}
                            onChange={() => {}} // Legacy video_order field removed - order managed by carousel system
                            disabled
                            className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            min={0}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#383B26] mb-1">Thumbnail URL</label>
                          <input
                            type="text"
                            value={newHeroVideo.video_thumbnail_url}
                            onChange={(e) => setNewHeroVideo(v => ({ ...v, video_thumbnail_url: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                            placeholder="Optional; auto-generated if empty"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                      <button onClick={() => setShowAddHeroVideo(false)} className="px-4 py-2 text-[#383B26] bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      <button onClick={handleCreateHeroVideo} className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center">
                        <FaSave className="mr-2" />
                        Save Video
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              </>
            )}
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
                        <div className="relative h-48 mb-3 overflow-hidden bg-gray-200 rounded">
                          {vlogHeroData.featuredVideoThumbnail ? (
                            <Image 
                              src={vlogHeroData.featuredVideoThumbnail}
                              alt={vlogHeroData.featuredVideoTitle || 'Featured Video'}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-gray-500">
                                <FaVideo className="mx-auto mb-2 text-xl" />
                                <p className="text-sm">Video Preview</p>
                              </div>
                            </div>
                          )}
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
                      <Image src={vlog.thumbnail_url} alt={vlog.title} className="object-cover w-24 h-16 rounded" width={96} height={64} />
                      <div>
                        <h3 className="font-medium text-[#383B26]">{vlog.title}</h3>
                        <p className="text-sm text-[#8F907E]">{vlog.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-[#8F907E] mt-1">
                          <span>{vlog.duration}</span>
                          <span>{vlog.published_at}</span>
                          {/* Legacy is_featured field removed - featured status managed by carousel system */}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingVlog(vlog)}
                        className="p-2 text-[#B8A692] hover:bg-gray-100 rounded"
                        title="Edit vlog"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const isFeatured = featuredVlogId === vlog.id;
                            let success = false;

                            if (isFeatured) {
                              // Remove from featured
                              success = await vlogService.removeFeaturedVlog();
                              if (success) {
                                setFeaturedVlogId(null);
                                setVlogHeroData(prev => ({
                                  ...prev,
                                  featuredVideoId: '',
                                  featuredVideoTitle: '',
                                  featuredVideoThumbnail: '',
                                  featuredVideoDate: ''
                                }));
                                toast.success('Vlog removed from featured');
                              }
                            } else {
                              // Set as featured
                              success = await vlogService.setFeaturedVlog(vlog.id);
                              if (success) {
                                setFeaturedVlogId(vlog.id);
                                setVlogHeroData(prev => ({
                                  ...prev,
                                  featuredVideoId: vlog.id,
                                  featuredVideoTitle: vlog.title,
                                  featuredVideoThumbnail: vlog.thumbnail_url,
                                  featuredVideoDate: vlog.published_at
                                }));
                                toast.success('Vlog set as featured');
                              }
                            }

                            if (success) {
                              // Reload stats
                              const vlogStatsData = await vlogService.getStats();
                              setVlogStats(prev => ({
                                totalVlogs: vlogStatsData.totalVlogs,
                                featuredVlogs: vlogStatsData.featuredVlogs,
                                totalAlbums: prev.totalAlbums,
                                totalPhotos: prev.totalPhotos,
                              }));
                            } else {
                              if (isFeatured) {
                                toast.error('Failed to remove featured vlog');
                              } else {
                                toast.error('Failed to set featured vlog');
                              }
                            }
                          } catch (error) {
                            console.error('Error toggling featured vlog:', error);
                            toast.error('Failed to update featured vlog');
                          }
                        }}
                        className={`p-2 rounded transition-colors ${
                          featuredVlogId === vlog.id
                            ? 'text-yellow-500 bg-yellow-50 hover:text-yellow-600 hover:bg-yellow-100'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                        title={featuredVlogId === vlog.id ? "Remove from featured" : "Set as featured vlog"}
                      >
                        <FaStar />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this vlog?')) {
                            try {
                              const success = await vlogService.deleteVlog(vlog.id);
                              if (success) {
                                // Reload vlogs and stats after deletion
                                const vlogsList = await vlogService.getAllVlogs();
                                setVlogs(vlogsList);

                                const vlogStatsData = await vlogService.getStats();
                                setVlogStats(prev => ({
                                  totalVlogs: vlogStatsData.totalVlogs,
                                  featuredVlogs: vlogStatsData.featuredVlogs,
                                  totalAlbums: prev.totalAlbums,
                                  totalPhotos: prev.totalPhotos,
                                }));

                                toast.success('Vlog deleted successfully');
                              } else {
                                toast.error('Failed to delete vlog');
                              }
                            } catch (error) {
                              console.error('Error deleting vlog:', error);
                              toast.error('Failed to delete vlog');
                            }
                          }
                        }}
                        className="p-2 text-red-600 rounded hover:bg-red-50"
                        title="Delete vlog"
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
                          src={album.cover_image_path || ''}
                          alt={album.album_title}
                          className="object-cover w-full h-48"
                          width={400}
                          height={192}
                        />
                        {album.is_visible && (
                          <span className="absolute flex items-center px-2 py-1 text-xs text-white bg-green-500 rounded top-2 left-2">
                            <FaStar className="mr-1" />
                            Visible
                          </span>
                        )}
                        <span className="absolute top-2 right-2 bg-[#B8A692] text-white px-2 py-1 rounded text-xs">
                          Album
                        </span>
                      </div>

                      {/* Album Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-[#383B26] mb-2">{album.album_title}</h3>
                        <p className="text-sm text-[#8F907E] mb-2 line-clamp-2">{album.album_description}</p>
                        <p className="text-xs text-[#8F907E] mb-3">
                          {album.album_date}
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
                                  const success = await albumService.deleteAlbum(album.id);
                                  if (success) {
                                    // Clear editing state to prevent trying to load deleted album images
                                    setEditingAlbum(null);
                                    setShowAlbumModal(false);

                                    const albumsList = await albumService.getAllAlbums();
                                    setPhotoAlbums(albumsList);
                                    const vlogStatsData = await vlogService.getStats();
                                    setVlogStats(prev => ({
                                      totalVlogs: vlogStatsData.totalVlogs,
                                      featuredVlogs: vlogStatsData.featuredVlogs,
                                      totalAlbums: prev.totalAlbums,
                                      totalPhotos: prev.totalPhotos,
                                    }));
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
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSpotifySectionConfigModalOpen(true)}
                        className="px-4 py-2 bg-[#8F907E] text-white rounded-md hover:bg-[#7A7A6B] flex items-center"
                      >
                        <FaEdit className="mr-2" />
                        Edit
                      </button>
                      {spotifyPlaylists.length > 0 && (
                        <button 
                          onClick={() => setShowPlaylistModal(true)}
                          className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                        >
                          <FaPlus className="mr-2" />
                          Add Playlist
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Content Display */}
                  <div className="grid grid-cols-1 gap-4 p-4 mb-6 rounded-lg md:grid-cols-2 bg-gray-50">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Section Title</label>
                      <div className="w-full p-2 text-gray-700 bg-white border border-gray-200 rounded-md">
                        {spotifySectionConfig.section_title}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Section Subtitle</label>
                      <div className="w-full p-2 text-gray-700 bg-white border border-gray-200 rounded-md">
                        {spotifySectionConfig.section_subtitle}
                      </div>
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
                              style={{ backgroundColor: playlist.card_color || '#2D2D2D' }}
                            >
                              <FaMusic className="mb-2 text-3xl opacity-70" />
                              <div className="px-2 text-center">
                                <p className="text-sm font-medium">{playlist.playlist_title}</p>
                                <p className="text-xs opacity-80">Order: {playlist.order_index}</p>
                              </div>
                              {!playlist.is_active && (
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
                                <p className="text-sm text-gray-600">Order: {playlist.order_index}</p>
                                <a 
                                  href={playlist.spotify_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#B8A692] hover:text-[#A0956C] truncate block max-w-32"
                                  title={playlist.spotify_url}
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
                                      const success = await playlistService.deletePlaylist(playlist.id);
                                      if (success) {
                                        // Clear editing state to prevent trying to load deleted playlist
                                        setEditingPlaylist(null);
                                        setShowPlaylistModal(false);

                                        const allPlaylists = await playlistService.getAllPlaylists();
                                        setSpotifyPlaylists(allPlaylists);
                                        setSpotifyStats({
                                          totalPlaylists: allPlaylists.length,
                                          activePlaylists: allPlaylists.filter(p => p.is_active).length
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
                <h3 className="text-lg font-semibold text-[#383B26] mb-4">Carousel Capacity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Main Channel:</span>
                    <span className={`font-medium ${vlogs.filter(v => v.carousel === 'vlogs-main-channel').length >= 6 ? 'text-red-600' : 'text-green-600'}`}>
                      {vlogs.filter(v => v.carousel === 'vlogs-main-channel').length}/6
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">AG Vlogs:</span>
                    <span className={`font-medium ${vlogs.filter(v => v.carousel === 'vlogs-ag-vlogs').length >= 6 ? 'text-red-600' : 'text-green-600'}`}>
                      {vlogs.filter(v => v.carousel === 'vlogs-ag-vlogs').length}/6
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F907E]">Featured:</span>
                    <span className="font-medium text-green-600">
                      {/* Legacy is_featured field removed - featured status managed by carousel system */} 0/1
                    </span>
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
                  { id: 'carousels', name: 'Content Carousels', icon: FaVideo },
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
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/healing/content', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    hero_header: healingHeroData.title,
                                    hero_subtitle: healingHeroData.subtitle,
                                    hero_body_paragraph: healingHeroData.bodyText,
                                  })
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to save healing hero section');
                                }

                                setEditingHealingHero(false);
                                toast.success('Hero section updated!');
                              } catch (error) {
                                console.error('Error saving healing hero section:', error);
                                toast.error('Failed to save changes');
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
                        {loadingFeaturedVideo ? (
                          <div className="flex items-center justify-center h-32 mb-3 bg-gray-200 rounded">
                            <div className="text-center text-gray-500">
                              <FaVideo className="mx-auto mb-2 text-xl animate-pulse" />
                              <p className="text-sm">Loading featured video...</p>
                            </div>
                          </div>
                        ) : healingFeaturedVideo ? (
                          <div className="mb-3">
                            <div className="relative overflow-hidden rounded">
                              <Image
                                src={`https://img.youtube.com/vi/${healingFeaturedVideo.youtube_id}/maxresdefault.jpg`}
                                alt={healingFeaturedVideo.video_title}
                                className="object-cover w-full h-32"
                                width={400}
                                height={128}
                              />
                              <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 opacity-0 hover:opacity-100">
                                <FaVideo className="text-2xl text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 mb-3 bg-gray-200 rounded">
                            <div className="text-center text-gray-500">
                              <FaVideo className="mx-auto mb-2 text-xl" />
                              <p className="text-sm">No featured video set</p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          {healingFeaturedVideo ? (
                            <>
                              <p className="text-sm"><strong>Current:</strong> {healingFeaturedVideo.video_title}</p>
                              <p className="text-sm text-[#8F907E]">Description: {healingFeaturedVideo.video_description || 'No description'}</p>
                              <p className="text-sm text-[#8F907E]">YouTube ID: {healingFeaturedVideo.youtube_id}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm"><strong>Current:</strong> No featured video selected</p>
                              <p className="text-sm text-[#8F907E]">Use the button below to select a YouTube video as the featured video</p>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingHealingVideo(null);
                            setCurrentCarouselContext('featured'); // Use featured context for featured video management
                            setShowHealingCarouselModal(true);
                          }}
                          className="w-full mt-3 px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] text-sm"
                        >
                          Add/Change Featured Video
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
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#383B26]">Carousel Headers</h2>
                    <p className="text-[#8F907E] text-sm">Manage the titles and subtitles for video carousels</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="relative p-4 border rounded-lg group">
                      <h3 className="font-medium text-[#383B26] mb-2">{healingCarousels.part1?.title || 'Gut Healing Part 1: Candida Cleanse'}</h3>
                      <p className="text-sm text-[#8F907E]">{healingCarousels.part1?.description || 'Educational videos for candida cleansing process'}</p>
                      <button
                        onClick={() => setEditingCarouselHeader({
                          id: 'part1',
                          title: healingCarousels.part1?.title || 'Gut Healing Part 1: Candida Cleanse',
                          description: healingCarousels.part1?.description || 'Educational videos for candida cleansing process',
                          type: 'part1',
                          isActive: true,
                          updated_at: new Date()
                        })}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-[#B8A692] transition-colors"
                      >
                        <FaEdit />
                      </button>
                    </div>
                    <div className="relative p-4 border rounded-lg group">
                      <h3 className="font-medium text-[#383B26] mb-2">{healingCarousels.part2?.title || 'Gut Healing Part 2: Rebuild & Repair'}</h3>
                      <p className="text-sm text-[#8F907E]">{healingCarousels.part2?.description || 'Videos focused on rebuilding gut health after cleansing'}</p>
                      <button
                        onClick={() => setEditingCarouselHeader({
                          id: 'part2',
                          title: healingCarousels.part2?.title || 'Gut Healing Part 2: Rebuild & Repair',
                          description: healingCarousels.part2?.description || 'Videos focused on rebuilding gut health after cleansing',
                          type: 'part2',
                          isActive: true,
                          updated_at: new Date()
                        })}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-[#B8A692] transition-colors"
                      >
                        <FaEdit />
                      </button>
                    </div>
                    <div className="relative p-4 border rounded-lg group">
                      <h3 className="font-medium text-[#383B26] mb-2">{healingCarousels.tiktoks?.title || 'TikTok Inspirations'}</h3>
                      <p className="text-sm text-[#8F907E]">{healingCarousels.tiktoks?.description || 'Inspirational TikTok videos for motivation and healing'}</p>
                      <button
                        onClick={() => setEditingCarouselHeader({
                          id: 'tiktoks',
                          title: healingCarousels.tiktoks?.title || 'TikTok Inspirations',
                          description: healingCarousels.tiktoks?.description || 'Inspirational TikTok videos for motivation and healing',
                          type: 'tiktoks',
                          isActive: true,
                          updated_at: new Date()
                        })}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-[#B8A692] transition-colors"
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
                        <h3 className="text-lg font-semibold text-[#383B26]">{healingCarousels.part1?.title || 'Gut Healing Part 1: Candida Cleanse'}</h3>
                        <p className="text-sm text-[#8F907E]">{healingCarousels.part1?.description || 'Educational videos for candida cleansing process'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingHealingVideo(null);
                          setCurrentCarouselContext('part1');
                          setShowHealingCarouselModal(true);
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        <FaPlus className="mr-2" />
                        Add Content
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {healingVideos
                        .filter(video => video.carousel === 'part1' && video.isActive)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((video) => (
                          <div key={video.id} className="overflow-hidden border border-gray-200 rounded-lg">
                            <div className="relative">
                              <Image
                                src={`https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                                alt={video.video_title}
                                className="object-cover w-full h-32"
                                width={400}
                                height={128}
                              />
                              <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 opacity-0 hover:opacity-100">
                                <FaVideo className="text-2xl text-white" />
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm text-[#383B26] mb-1 truncate">{video.video_title}</h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingHealingVideo(video);
                                    setShowHealingCarouselModal(true);
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
                                        const videosList = await healingService.get_all_videos();
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
                        <h3 className="text-lg font-semibold text-[#383B26]">{healingCarousels.part2?.title || 'Gut Healing Part 2: Rebuild & Repair'}</h3>
                        <p className="text-sm text-[#8F907E]">{healingCarousels.part2?.description || 'Videos focused on rebuilding gut health after cleansing'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingHealingVideo(null);
                          setCurrentCarouselContext('part2');
                          setShowHealingCarouselModal(true);
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        <FaPlus className="mr-2" />
                        Add Content
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {healingVideos
                        .filter(video => video.carousel === 'part2' && video.isActive)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((video) => (
                          <div key={video.id} className="overflow-hidden border border-gray-200 rounded-lg">
                            <div className="relative">
                              <Image
                                src={`https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                                alt={video.video_title}
                                className="object-cover w-full h-32"
                                width={400}
                                height={128}
                              />
                              <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 opacity-0 hover:opacity-100">
                                <FaVideo className="text-2xl text-white" />
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm text-[#383B26] mb-1 truncate">{video.video_title}</h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingHealingVideo(video);
                                    setShowHealingCarouselModal(true);
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
                                        const videosList = await healingService.get_all_videos();
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

                  {/* TikTok Inspirations Carousel */}
                  <div className="p-6 bg-white rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#383B26]">{healingCarousels.tiktoks?.title || 'TikTok Inspirations'}</h3>
                        <p className="text-sm text-[#8F907E]">{healingCarousels.tiktoks?.description || 'Inspirational TikTok videos for motivation and healing'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingHealingVideo(null);
                          setCurrentCarouselContext('tiktoks');
                          setShowHealingCarouselModal(true);
                        }}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                      >
                        <FaPlus className="mr-2" />
                        Add TikTok
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {/* TikTok videos will be loaded here */}
                      <div className="flex items-center justify-center h-32 border-2 border-gray-200 border-dashed rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">No TikTok videos yet</p>
                          <p className="text-xs text-gray-400">Click &quot;Add TikTok&quot; to get started</p>
                        </div>
                      </div>
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
                        .filter(product => product.is_active)
                        .sort((a, b) => (a.product_order || 0) - (b.product_order || 0))
                        .map((product) => (
                          <div
                            key={product.id}
                            className="p-4 transition-shadow border rounded-lg cursor-pointer hover:shadow-md group"
                            onClick={() => setEditingHealingProduct(product)}
                          >
                            <div className="relative mb-3">
                              {product.product_image_path ? (
                                (() => {
                                  const parsedUrl = parseSupabaseUrl(product.product_image_path);
                                  if (parsedUrl) {
                                    return (
                                      <SecureImage
                                        bucket={parsedUrl.bucket}
                                        path={parsedUrl.path}
                                        alt={product.product_title}
                                        width={400}
                                        height={128}
                                        className="object-cover w-full h-32 rounded"
                                      />
                                    );
                                  } else {
                                    return (
                                      <div className="flex items-center justify-center h-32 bg-gray-200 rounded">
                                        <span className="text-xs text-gray-400">Invalid image URL</span>
                                      </div>
                                    );
                                  }
                                })()
                              ) : (
                                <div className="flex items-center justify-center h-32 bg-gray-200 rounded">
                                  <FaHeartbeat className="text-xl text-gray-400" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-[#383B26] mb-1 group-hover:text-[#B8A692] transition-colors">{product.product_title}</h3>
                            <p className="text-sm text-[#8F907E] mb-2 line-clamp-2">{product.product_purpose}</p>
                            {product.amazon_url && (
                              <a
                                href={product.amazon_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-xs text-[#B8A692] hover:text-[#A0956C] mb-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View on Amazon →
                              </a>
                            )}
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingHealingProduct(product);
                                }}
                                className="flex-1 px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this product?')) {
                                    const deleteResult = await healingService.delete_healing_product(product.id);
                                    if (deleteResult.error) throw new Error(deleteResult.error);
                                    const productsList = await healingService.get_all_products();
                                    setHealingProducts(productsList);
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

              {/* Sub-tabs Navigation */}
              <div className="flex gap-4 mt-6 border-b">
                <button
                  onClick={() => setStorefrontActiveTab('products')}
                  className={`pb-3 px-1 font-medium text-sm transition-colors ${
                    storefrontActiveTab === 'products'
                      ? 'border-b-2 border-[#B8A692] text-[#383B26]'
                      : 'text-gray-500 hover:text-[#383B26]'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setStorefrontActiveTab('categories')}
                  className={`pb-3 px-1 font-medium text-sm transition-colors ${
                    storefrontActiveTab === 'categories'
                      ? 'border-b-2 border-[#B8A692] text-[#383B26]'
                      : 'text-gray-500 hover:text-[#383B26]'
                  }`}
                >
                  Categories
                </button>
                <button
                  onClick={() => setStorefrontActiveTab('carousels')}
                  className={`pb-3 px-1 font-medium text-sm transition-colors ${
                    storefrontActiveTab === 'carousels'
                      ? 'border-b-2 border-[#B8A692] text-[#383B26]'
                      : 'text-gray-500 hover:text-[#383B26]'
                  }`}
                >
                  Carousels
                </button>
              </div>
              
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

            {/* Products Tab */}
            {storefrontActiveTab === 'products' && (
              <>
            {/* Enhanced Controls */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const now = new Date().toISOString();
                      const draft: StorefrontProductRow = {
                        id: 'tmp_' + Date.now(),
                        product_title: '',
                        slug: '',
                        category_slug: '',
                        amazon_url: '',
                        image_path: '',
                        image_alt: '',
                        description: '',
                        price: null,
                        tags: [],
                        status: 'draft',
                        created_at: now,
                        updated_at: now,
                        click_count: null,
                        clicks_30d: null,
                        deleted_at: null,
                        imageAlt: null,
                        is_top_clicked: null,
                        pairs_with: null,
                        used_in: null
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
                        // TODO: Implement export functionality
                        const dataStr = JSON.stringify(sfProducts, null, 2);
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
                            // TODO: Implement import functionality
                            // storefrontService.import(text);
                            const products = await storefrontService.get_storefront_products();
                            setSfProducts(products);
                            setSfItems(products);
                            const stats = await storefrontService.get_storefront_stats();
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
                  <button
                    onClick={() => setShowCategoryPhotoModal(true)}
                    className="bg-[#B8A692] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#A0956C] transition-colors"
                  >
                    <FaImage /> Category Photos
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
                    {sfCategories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.category_name}
                      </option>
                    ))}
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
                    const matchesCategory = sfCategory === 'all' || product.category_slug === sfCategory;
                    const matchesStatus = sfStatus === 'all' || product.status === sfStatus;
                    const matchesSearch = sfSearch === '' || 
                      product.product_title.toLowerCase().includes(sfSearch.toLowerCase()) ||
                      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(sfSearch.toLowerCase())));
                    return matchesCategory && matchesStatus && matchesSearch;
                  })
                  .map(product => (
                    <div key={product.id} className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg hover:shadow-md">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-100 rounded-lg">
                          {product.image_path ? (
                            <Image 
                              src={product.image_path || '/placeholder.jpg'} 
                              alt={product.product_title} 
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
                                <h3 className="text-lg font-semibold text-[#383B26] truncate">{product.product_title}</h3>
                                
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-[#8F907E] mb-2">
                                <span className="bg-[#E3D4C2] px-2 py-1 rounded-full capitalize">{product.category_slug?.replace('-', ' ')}</span>
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
                                {product.description || 'No description'}
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
                                  if (confirm(`Delete "${product.product_title}"?`)) {
                                    try {
                                      await storefrontService.delete_storefront_product(product.id);
                                      const products = await storefrontService.get_storefront_products();
                                      setSfProducts(products);
                                      setSfItems(products);
                                      const stats = await storefrontService.get_storefront_stats();
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
              </>
            )}

            {/* Categories Tab */}
            {storefrontActiveTab === 'categories' && (
              <div className="space-y-6">
                {/* Categories Management */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#383B26]">Category Management</h2>
                      <p className="text-[#8F907E] text-sm">Manage storefront categories</p>
                    </div>
                    <button
                      onClick={() => {
                        if (sfCategories.length >= 4) {
                          toast.error('Maximum of 4 categories allowed. Please contact the web developer to add more.');
                          return;
                        }
                        setEditingCategory(null);
                        setIsAddingCategory(true);
                        setShowCategoryPhotoModal(true);
                      }}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaPlus className="mr-2" />
                      Add Category
                    </button>
                  </div>

                  {/* Categories List */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {sfCategories.map((category) => (
                      <div key={category.id} className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md">
                        <div className="flex items-start gap-4">
                          {/* Category Image */}
                          <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-100 rounded-lg">
                            {category.category_image_path ? (
                              <Image
                                src={category.category_image_path || '/placeholder.jpg'}
                                alt={category.category_name}
                                className="object-cover w-full h-full"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <FaImage className="text-xl text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Category Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-[#383B26] mb-1">{category.category_name}</h3>
                            <p className="mb-2 text-sm text-gray-600">{category.slug}</p>
                            {category.category_description && (
                              <p className="text-sm text-gray-500 line-clamp-2">{category.category_description}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setEditingCategory(category);
                                setIsAddingCategory(false);
                                setShowCategoryPhotoModal(true);
                              }}
                              className="bg-[#B89178] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#A67B62] flex items-center gap-1"
                            >
                              <FaEdit className="text-xs" /> Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete category "${category.category_name}"?`)) {
                                  try {
                                    await storefrontService.delete_storefront_category(category.id);
                                    const categories = await storefrontService.get_storefront_categories();
                                    setSfCategories(categories);
                                    toast.success('Category deleted');
                                  } catch (error: any) {
                                    toast.error(error.message || 'Delete failed');
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
                    ))}

                    {sfCategories.length === 0 && (
                      <div className="p-8 text-center rounded-lg col-span-full bg-gray-50">
                        <FaImage className="mx-auto mb-4 text-4xl text-gray-300" />
                        <h3 className="mb-2 text-lg font-medium text-gray-600">No categories found</h3>
                        <p className="mb-4 text-gray-500">Add your first category to get started</p>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setIsAddingCategory(true);
                            setShowCategoryPhotoModal(true);
                          }}
                          className="bg-[#B89178] text-white px-4 py-2 rounded-lg hover:bg-[#A67B62] flex items-center gap-2 mx-auto"
                        >
                          <FaPlus /> Add Category
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Carousels Tab */}
            {storefrontActiveTab === 'carousels' && (
              <div className="space-y-6">
                {/* Top Picks Carousel */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#383B26]">Top Picks</h3>
                      <p className="text-sm text-[#8F907E]">Curated list of Alexis&apos; top product recommendations</p>
                    </div>
                    <button
                      onClick={async () => {
                        // TODO: Open product selector modal to add products to top picks
                        toast('Product selector coming soon');
                      }}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaPlus className="mr-2" />
                      Add Product
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {sfTopPicks.length === 0 ? (
                      <div className="p-8 text-center rounded-lg col-span-full bg-gray-50">
                        <FaStar className="mx-auto mb-4 text-4xl text-gray-300" />
                        <p className="text-gray-500">No top picks added yet</p>
                      </div>
                    ) : (
                      sfTopPicks
                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                        .map((item) => (
                          <div key={item.id} className="overflow-hidden border border-gray-200 rounded-lg">
                            <div className="relative h-32 bg-gray-100">
                              {item.image_path && (
                                <Image
                                  src={item.image_path}
                                  alt={item.product_title || 'Product'}
                                  className="object-cover w-full h-full"
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              )}
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm text-[#383B26] mb-1 truncate">{item.product_title}</h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={async () => {
                                    if (confirm('Remove from Top Picks?')) {
                                      try {
                                        await storefrontService.set_top_pick(item.ref_id, false);
                                        const topPicks = await storefrontService.list_top_picks();
                                        setSfTopPicks(topPicks);
                                        toast.success('Removed from Top Picks');
                                      } catch (error) {
                                        toast.error('Failed to remove from Top Picks');
                                      }
                                    }
                                  }}
                                  className="flex items-center px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                                >
                                  <FaTrash className="mr-1" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Favorites Carousel */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#383B26]">Favorites</h3>
                      <p className="text-sm text-[#8F907E]">Featured favorite products on the storefront</p>
                    </div>
                    <button
                      onClick={async () => {
                        // TODO: Open product selector modal to add products to favorites
                        toast('Product selector coming soon');
                      }}
                      className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
                    >
                      <FaPlus className="mr-2" />
                      Add Product
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {sfFavorites.length === 0 ? (
                      <div className="p-8 text-center rounded-lg col-span-full bg-gray-50">
                        <FaHeart className="mx-auto mb-4 text-4xl text-gray-300" />
                        <p className="text-gray-500">No favorites added yet</p>
                      </div>
                    ) : (
                      sfFavorites.map((item) => (
                        <div key={item.id} className="overflow-hidden border border-gray-200 rounded-lg">
                          <div className="relative h-32 bg-gray-100">
                            {item.image_path && (
                              <Image
                                src={item.image_path}
                                alt={item.product_title || 'Product'}
                                className="object-cover w-full h-full"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm text-[#383B26] mb-1 truncate">{item.product_title}</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={async () => {
                                  if (confirm('Remove from Favorites?')) {
                                    try {
                                      await storefrontService.set_favorite(item.ref_id, false);
                                      const favorites = await storefrontService.list_favorites();
                                      setSfFavorites(favorites);
                                      toast.success('Removed from Favorites');
                                    } catch (error) {
                                      toast.error('Failed to remove from Favorites');
                                    }
                                  }
                                }}
                                className="flex items-center px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                <FaTrash className="mr-1" />
                                Remove
                              </button>
                            </div>
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

      {/* Recipe Folder Modal */}
      <RecipeFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        folders={recipeFolders}
        onSave={async () => {
          const foldersList = await recipeService.getAllFolders();
          setRecipeFolders(foldersList);
        }}
      />

      {/* Recipe TikTok Modal */}
      <TikTokVideoModal
        isOpen={showAddRecipeTikTok}
        onClose={() => {
          setShowAddRecipeTikTok(false);
          setEditingRecipeHeroVideo(null);
        }}
        video={editingRecipeHeroVideo ? {
          link_url: editingRecipeHeroVideo.link_url,
          caption: editingRecipeHeroVideo.caption,
          order_index: editingRecipeHeroVideo.order_index,
          thumbnail_url: editingRecipeHeroVideo.video_thumbnail_url
        } : null}
        onSave={async (tiktokData) => {
          try {
            if (editingRecipeHeroVideo) {
              // Update existing video
              const { updateCarouselItem } = await import('../lib/services/carouselService');
              await updateCarouselItem(editingRecipeHeroVideo.id, {
                link_url: tiktokData.link_url,
                caption: tiktokData.caption || null,
                order_index: tiktokData.order_index,
                image_path: tiktokData.thumbnail_url || null,
              });
              toast.success('TikTok video updated successfully!');
            } else {
              // Create new video
              const { findCarouselByPageSlug, createCarouselItem } = await import('../lib/services/carouselService');
              const carousel = await findCarouselByPageSlug('recipes', 'recipes-hero-videos');

              if (carousel.data) {
                await createCarouselItem({
                  carousel_id: carousel.data.id,
                  kind: 'tiktok',
                  link_url: tiktokData.link_url,
                  caption: tiktokData.caption || null,
                  order_index: tiktokData.order_index || 0,
                  is_active: true,
                  image_path: tiktokData.thumbnail_url || null,
                  album_id: null,
                  ref_id: null,
                  youtube_id: null,
                  badge: null,
                });
                toast.success('TikTok video added successfully!');
              }
            }

            setShowAddRecipeTikTok(false);
            setEditingRecipeHeroVideo(null);
            // Reload hero videos to show changes
            await loadRecipeHeroVideos();
          } catch (error) {
            console.error('Error saving TikTok:', error);
            toast.error(`Failed to ${editingRecipeHeroVideo ? 'update' : 'add'} TikTok video`);
          }
        }}
      />

      {/* Image Modal */}
      {imageModalUrl && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black bg-opacity-90">
          <div className="relative flex flex-col items-center justify-center w-full h-full max-w-6xl">
            <button
              onClick={() => {
                setImageModalUrl(null);
                setImageModalGallery([]);
                setCurrentImageIndex(0);
              }}
              className="absolute z-10 p-2 text-white transition-all bg-black bg-opacity-50 rounded-full top-4 right-4 hover:bg-opacity-70"
              aria-label="Close image"
            >
              <FaTimes className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative flex items-center justify-center flex-1 w-full mb-4">
              <Image
                src={imageModalGallery.length > 0 ? imageModalGallery[currentImageIndex] : imageModalUrl}
                alt="Recipe image"
                className="object-contain max-w-full max-h-full"
                fill
                sizes="90vw"
              />
            </div>

            {/* Gallery Navigation */}
            {imageModalGallery.length > 1 && (
              <div className="w-full max-w-4xl">
                {/* Image counter */}
                <div className="mb-2 text-sm text-center text-white">
                  {currentImageIndex + 1} / {imageModalGallery.length}
                </div>

                {/* Thumbnail strip */}
                <div className="flex justify-center gap-2 px-4 pb-2 overflow-x-auto">
                  {imageModalGallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-white scale-110'
                          : 'border-gray-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>

                {/* Arrow key hint */}
                <div className="mt-2 text-xs text-center text-gray-400">
                  Use ← → arrow keys to navigate
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vlog Modal */}
      <VlogModal
        isOpen={isAddingVlog || !!editingVlog}
        onClose={() => {
          setIsAddingVlog(false);
          setEditingVlog(null);
        }}
        vlog={editingVlog}
        onSave={handleSaveVlog}
        currentCarouselCount={vlogs.length}
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
        carouselId={vlogsPhotoGalleryCarouselId}
        forcePageType="vlogs"
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


      {/* Healing Carousel Modal */}
      <HealingCarouselModal
        isOpen={showHealingCarouselModal}
        onClose={() => {
          setShowHealingCarouselModal(false);
          setEditingHealingVideo(null);
        }}
        editingVideo={editingHealingVideo}
        carouselContext={currentCarouselContext}
        onSave={handleSaveCarouselItem}
      />

      {/* Storefront Product Modal */}
      {(sfIsAdding || !!sfEditing) && (
        <StorefrontProductModal
          isOpen={true}
          onClose={() => {
            setSfIsAdding(false);
            setSfEditing(null);
          }}
          product={sfEditing}
          onSave={handleSaveStorefrontProduct}
          categories={sfCategories}
        />
      )}

      {/* Category Photo Modal */}
      <CategoryPhotoModal
        isOpen={showCategoryPhotoModal}
        onClose={() => {
          setShowCategoryPhotoModal(false);
          setEditingCategory(null);
          setIsAddingCategory(false);
        }}
        categories={sfCategories}
        category={editingCategory}
        mode={isAddingCategory ? 'create' : 'edit'}
        onUpdate={async () => {
          // Refresh categories when photo is updated
          try {
            const response = await fetch('/api/storefront/categories');
            if (response.ok) {
              const data = await response.json();
              setSfCategories(data.categories || []);
            }
          } catch (error) {
            console.error('Error refreshing categories:', error);
          }
        }}
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

      {/* Spotify Section Config Modal */}
      <SpotifySectionConfigModal
        isOpen={spotifySectionConfigModalOpen}
        onClose={() => setSpotifySectionConfigModalOpen(false)}
        initialData={spotifySectionConfig}
        onSave={handleSaveSpotifySectionConfig}
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