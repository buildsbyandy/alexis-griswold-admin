import React, { useState, useEffect } from 'react';
import { FaPlay, FaCalendar, FaYoutube, FaInstagram, FaExternalLinkAlt, FaSpotify, FaChevronDown } from 'react-icons/fa';
import Modal from '../components/Modal';
import VideoCarousel from '../components/VideoCarousel';
import Divider from '../components/Divider';
import SectionWrapper from '../components/SectionWrapper';
import vlogService from '../services/vlogService';
import type { VlogVideo, PhotoAlbum, SpotifyPlaylist } from '../services/vlogService';

// CMS-ready hero section data structure
interface HeroSectionData {
  title: string;
  subtitle: string;
  videoUrl: string;
  ctaLabel: string;
  thumbnailOverride?: string;
}

// Default hero content (can be replaced with CMS data)
const heroData: HeroSectionData = {
  title: "VLOGS",
  subtitle: "Step into my life — one video at a time.\n\nEvery moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with passion, purpose, and the simple joys that make each day extraordinary.",
  videoUrl: "", // Will be populated from featured vlog
  ctaLabel: "Watch Now"
};

const inspiringMessage = `Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with passion, purpose, and the simple joys that make each day extraordinary. From morning routines to travel adventures, from cooking sessions to life reflections - this is my journey, and I'm sharing it with you.`;

export const Vlogs: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VlogVideo | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [showAllImages, setShowAllImages] = useState<boolean>(false);
  const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState<number>(0);
  const [vlogs, setVlogs] = useState<VlogVideo[]>([]);
  const [personalVlogs, setPersonalVlogs] = useState<VlogVideo[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [featuredVlog, setFeaturedVlog] = useState<VlogVideo | null>(null);
  const [activeSpotifyTab, setActiveSpotifyTab] = useState<number>(0);
  const [loadedIframes, setLoadedIframes] = useState<Set<number>>(new Set());


  useEffect(() => {
    loadVlogData();
  }, []);

  const loadVlogData = () => {
    setVlogs(vlogService.getDisplayVlogs(6));
    setPersonalVlogs(vlogService.getPersonalVlogs());
    setAlbums(vlogService.getDisplayAlbums(6));
    setPlaylists(vlogService.getDisplayPlaylists(3));
    setFeaturedVlog(vlogService.getFeaturedVlog());
  };

  const handleImageModalNav = (dir: number) => {
    if (!selectedAlbum) return;
    const newIndex = (selectedPhotoIndex + dir + selectedAlbum.photos.length) % selectedAlbum.photos.length;
    setSelectedPhotoIndex(newIndex);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedAlbum) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleImageModalNav(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleImageModalNav(1);
    }
  };

  useEffect(() => {
    if (selectedAlbum) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedAlbum, selectedPhotoIndex]);

  // Reset thumbnail scroll when photo changes
  useEffect(() => {
    if (selectedAlbum && selectedPhotoIndex >= thumbnailScrollIndex + 5) {
      setThumbnailScrollIndex(Math.max(0, selectedPhotoIndex - 4));
    } else if (selectedAlbum && selectedPhotoIndex < thumbnailScrollIndex) {
      setThumbnailScrollIndex(selectedPhotoIndex);
    }
  }, [selectedPhotoIndex, selectedAlbum, thumbnailScrollIndex]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleVideoClick = (video: VlogVideo) => {
    setSelectedVideo(video);
  };

  const handleYouTubeClick = () => {
    window.open(vlogService.getYouTubeChannelUrl(), '_blank');
  };

  const handleInstagramClick = () => {
    window.open(vlogService.getInstagramUrl(), '_blank');
  };

  const handleThumbnailScroll = (direction: number) => {
    if (!selectedAlbum) return;
    const maxScroll = Math.max(0, selectedAlbum.photos.length - 5);
    const newScrollIndex = Math.max(0, Math.min(maxScroll, thumbnailScrollIndex + direction));
    setThumbnailScrollIndex(newScrollIndex);
  };

  const handleShowAllImages = () => {
    setShowAllImages(true);
  };

  const handleCloseShowAll = () => {
    setShowAllImages(false);
  };

  const handleSelectImageFromGrid = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowAllImages(false);
  };

  return (
    <div className="flex flex-col w-full overflow-x-hidden font-serif text-text-1100">
      <div className="font-brand-body">
      
      {/* Hero Section */}
      <SectionWrapper
        bg="bg-[#d3c1b0]"
        className="-mt-4"
        contentClassName="py-12 sm:py-16"
      >
        {/* Main Hero Content */}
        <div className="relative flex flex-col items-center justify-center w-full min-h-[60vh] gap-6 sm:gap-8">
          {/* Content Container */}
          <div className="relative z-10 flex flex-col items-center w-full gap-8 mx-auto sm:gap-12 max-w-7xl lg:flex-row lg:gap-16">
            
            {/* Text Content - Left Side */}
            <div className="w-full space-y-4 lg:w-1/2">
              <h1 className="mb-4 text-2xl font-bold tracking-wide text-center text-black sm:mb-6 sm:text-3xl lg:text-5xl lg:text-left">
                {heroData.title}
              </h1>
              <div className="text-sm leading-relaxed text-center max-w-prose sm:text-base lg:text-lg lg:text-left">
                {heroData.subtitle.split('\n\n').map((paragraph, index) => (
                  <p key={index} className={`${index === 0 ? 'font-semibold text-text-1100 mb-3 sm:mb-4' : 'text-black'}`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            
            {/* Featured Video - Right Side */}
            <div className="w-full lg:w-1/2">
              <div className="relative w-full max-w-2xl">
                <div 
                  className="relative px-3 py-3 overflow-hidden transition-all duration-300 transform cursor-pointer bg-primary-200 rounded-xl shadow-strong hover:scale-105 hover:shadow-strong reduced-motion lg:px-4 lg:py-4"
                  onClick={() => featuredVlog && setSelectedVideo(featuredVlog)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Play featured video: ${featuredVlog?.title || 'Featured vlog'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      featuredVlog && setSelectedVideo(featuredVlog);
                    }
                  }}
                >
                  {featuredVlog ? (
                    <>
                      {/* Video Thumbnail */}
                      <div className="relative w-full overflow-hidden aspect-video">
                        <img 
                          src={heroData.thumbnailOverride || featuredVlog.thumbnailUrl} 
                          alt={featuredVlog.title}
                          className="object-cover object-center w-full h-full"
                        />
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black bg-opacity-20 hover:bg-opacity-30">
                          <div className="flex items-center justify-center w-16 h-16 transition-all duration-300 transform bg-white rounded-full shadow-lg sm:w-20 sm:h-20 bg-opacity-90 hover:scale-110 reduced-motion">
                            <FaPlay className="ml-1 text-xl sm:text-2xl text-text-1100" aria-hidden="true" />
                          </div>
                        </div>
                        {/* Duration Badge */}
                        <div className="absolute px-2 py-1 text-xs font-medium text-white bg-black bg-opacity-75 rounded-full sm:px-3 sm:py-1 sm:text-sm bottom-3 right-3 sm:bottom-4 sm:right-4">
                          {featuredVlog.duration}
                        </div>
                      </div>
                      {/* Video Info */}
                      <div className="p-2 sm:p-3">
                        <h3 className="mb-1 overflow-hidden text-sm font-semibold sm:text-base text-text-1100 sm:mb-2 whitespace-nowrap text-ellipsis">{featuredVlog.title}</h3>
                        <p className="mb-2 text-xs text-black sm:mb-3 line-clamp-1">{featuredVlog.description}</p>
                        {/* CTA and Meta Info */}
                        <div className="flex items-center justify-between gap-2">
                          <button 
                            className="px-4 py-1 text-xs bg-[#B89178] text-black font-medium rounded-md hover:bg-[#A67B62] transition-colors sm:px-6 sm:py-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVideo(featuredVlog);
                            }}
                          >
                            {heroData.ctaLabel}
                          </button>
                          <div className="flex items-center gap-1.5 text-xs sm:gap-2 text-black">
                            <div className="flex items-center gap-1">
                              <FaCalendar />
                              <span>{formatDate(featuredVlog.publishedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center aspect-video bg-primary-600">
                      <span className="text-lg font-medium text-white sm:text-xl">Featured Vlog</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </SectionWrapper>

      {/* Scroll Indicator - Consistent absolute positioning at bottom of hero */}
      <div className="absolute inset-x-0 z-30 flex justify-center pointer-events-none animate-bounce reduced-motion bottom-2 sm:bottom-4 md:bottom-6">
        <div className="flex flex-col items-center gap-2 text-black">
          <FaChevronDown className="text-2xl sm:text-xl md:text-2xl" aria-hidden="true" />
        </div>
      </div>

      {/* Vlogs Section - Stacked Carousel Layout */}
      <SectionWrapper
        bg="bg-[#cbb6a6]"
        topDivider="curve"
        dividerColor="text-[#d3c1b0]"
        contentClassName="pt-28 pb-4 sm:pt-32 sm:pb-6"
      >
        
        <div className="space-y-6 sm:space-y-8">
          {/* Latest Vlogs Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
              <h2 className="sr-only">Latest Vlogs</h2>
              
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-semibold tracking-wide text-black uppercase">Main Channel</span>
                <button
                  onClick={handleYouTubeClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 btn hover:bg-red-700 sm:px-6 sm:py-3"
                  title="Visit A Life with Alexis Griswold - Main YouTube Channel"
                  aria-label="Visit A Life with Alexis Griswold - Main YouTube Channel"
                >
                  <FaYoutube className="text-sm" />
                  <span className="hidden sm:inline"> More of my life in motion</span>
                  <span className="sm:hidden"> More vlogs</span>
                </button>
              </div>
            </div>
            <div role="region" aria-label="Latest vlogs carousel" className="overflow-hidden">
              <VideoCarousel 
                videos={vlogs} 
                onVideoClick={handleVideoClick}
                cardBgClass="bg-[#F2EDE4]"
                arrowBgClass="bg-[#F2EDE4]"
                arrowHoverBgClass="hover:bg-[#E3D4C2]"
                dotActiveBgClass="bg-[#D8C9B8]"
              />
            </div>
          </div>

          {/* Optional Mini Cue Divider */}
          <div className="flex justify-center py-4">
            <div className="w-24 h-px bg-black opacity-100" />
          </div>

          {/* Personal Vlogs Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
              <h2 className="sr-only">Personal Vlogs</h2>
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-semibold tracking-wide text-black uppercase">AG Vlogs</span>
                <button
                  onClick={() => window.open('https://www.youtube.com/@Alexisgriswoldvlogs', '_blank')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 btn hover:bg-red-700 sm:px-6 sm:py-3"
                  title="Visit AG Vlogs - Personal YouTube Channel"
                  aria-label="Visit AG Vlogs - Personal YouTube Channel"
                >
                  <FaYoutube className="text-sm" />
                  <span className="hidden sm:inline"> Life behind the posts</span>
                  <span className="sm:hidden"> Behind the posts </span>
                </button>
              </div>
            </div>
            <div role="region" aria-label="Personal vlogs carousel" className="overflow-hidden">
              <VideoCarousel 
                videos={personalVlogs} 
                onVideoClick={handleVideoClick}
                cardBgClass="bg-[#F2EDE4]"
                arrowBgClass="bg-[#F2EDE4]"
                arrowHoverBgClass="hover:bg-[#E3D4C2]"
                dotActiveBgClass="bg-[#D8C9B8]"
              />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Gallery Section with Social Media Links */}
      <SectionWrapper
        bg="bg-[#e0d0be]"
        topDivider="curve"
        dividerColor="text-[#cbb6a6]"
        contentClassName="pt-44 pb-4 sm:pt-48 sm:pb-6"
      >
        <div className="text-center">
          <div className="flex justify-center gap-4 mb-6">
            {/* Instagram CTA */}
            <button
              onClick={() => window.open('https://www.instagram.com/lexigriswold', '_blank')}
              className="flex items-center w-1/2 max-w-xs gap-2 px-6 py-3 font-semibold text-white btn bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 sm:px-8 sm:py-4"
              aria-label="Follow me on Instagram (opens in new tab)"
            >
              <FaInstagram className="text-xl sm:text-2xl" aria-hidden="true" />
              <span className="hidden sm:inline">Follow me on Instagram</span>
              <span className="sm:hidden">Instagram</span>
              <FaExternalLinkAlt className="text-sm" aria-hidden="true" />
            </button>

            {/* TikTok CTA */}
            <button
              onClick={() => window.open('https://www.tiktok.com/@alexisgriswoldd', '_blank')}
              className="flex items-center w-1/2 max-w-xs gap-2 px-6 py-3 font-semibold text-white bg-black btn hover:bg-gray-800 sm:px-8 sm:py-4"
              aria-label="Follow me on TikTok (opens in new tab)"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="hidden sm:inline">Follow me on TikTok</span>
              <span className="sm:hidden">TikTok</span>
              <FaExternalLinkAlt className="text-sm" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {albums.slice(0, 6).map((album) => (
            <div 
              key={album.id} 
              className="w-full overflow-hidden transition-all duration-200 transform rounded-lg cursor-pointer bg-primary-200 shadow-soft hover:shadow-medium hover:scale-105 aspect-square focus-visible-ring reduced-motion"
              onClick={() => setSelectedAlbum(album)}
              role="button"
              tabIndex={0}
              aria-label={`View photo album: ${album.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedAlbum(album);
                }
              }}
            >
              <div className="relative w-full h-full">
                <img 
                  src={album.coverImage} 
                  alt={album.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black bg-opacity-0 hover:bg-opacity-20">
                  <div className="text-center text-white transition-opacity opacity-0 hover:opacity-100">
                    <h4 className="mb-1 text-xs font-semibold sm:text-sm">{album.title}</h4>
                    <p className="text-xs">{album.photos.length} photos</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* Spotify Iframe Section */}
      <SectionWrapper
        bg="bg-[#d3c1b0]"
        topDivider="intersecting-curves"
        dividerColor="text-[#e0d0be]"
        contentClassName="pt-32 pb-12 sm:pt-36 sm:pb-16"
      >
        <div className="mb-4 text-center sm:mb-6">
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl text-text-1100">Listen to My Playlists</h2>
          <p className="text-lg text-black sm:text-xl">Curated music for every mood and moment</p>
        </div>

        {/* Spotify CTA Button */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <button
            onClick={() => window.open(vlogService.getSpotifyProfileUrl(), '_blank')}
            className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-green-600 btn hover:bg-green-700 sm:px-8 sm:py-4"
            aria-label="Catch my vibe on Spotify (opens in new tab)"
          >
            <FaSpotify className="text-xl sm:text-2xl" />
            <span className="hidden sm:inline">Catch my vibe on Spotify</span>
            <span className="sm:hidden">Catch my vibe on Spotify</span>
            <FaExternalLinkAlt className="text-sm" />
          </button>
        </div>

        {/* Desktop Layout - Side by Side */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {playlists.map((playlist, index) => (
            <div key={playlist.id} className="w-full">
              {/* Screen reader only heading */}
              <h3 className="sr-only">{playlist.name}</h3>
              
              <div className="w-full h-[380px] rounded-xl overflow-hidden shadow-strong hover:shadow-strong transition-all duration-300">
                {loadedIframes.has(index) ? (
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${playlist.url.split('/').pop()}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="encrypted-media"
                    loading="lazy"
                    title={playlist.name}
                    className="w-full h-full"
                  />
                ) : (
                  <div 
                    className="group relative w-full h-full cursor-pointer overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:ring-4 hover:ring-white hover:ring-opacity-30"
                    style={{
                      background: playlist.previewColor 
                        ? `linear-gradient(135deg, ${playlist.previewColor}dd, ${playlist.previewColor}aa)`
                        : 'linear-gradient(135deg, #1DB954dd, #1ed760aa)'
                    }}
                    onClick={() => setLoadedIframes(prev => new Set([...prev, index]))}
                  >
                    {/* Background Overlay for Better Text Contrast */}
                    <div className="absolute inset-0 transition-all duration-300 bg-black bg-opacity-30 group-hover:bg-opacity-20"></div>
                    
                    {/* Content Overlay */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                      {/* Spotify Logo */}
                      <div className="mb-6">
                        <FaSpotify className="text-4xl text-white drop-shadow-lg" />
                      </div>
                      
                      {/* Playlist Info with Enhanced Contrast */}
                      <div className="w-full max-w-xs mb-6">
                        <div className="w-full px-4 py-2 mb-3 bg-black rounded-lg bg-opacity-40 backdrop-blur-sm">
                          <h4 className="overflow-hidden text-lg font-bold text-white drop-shadow-lg whitespace-nowrap text-ellipsis">
                            {playlist.stylizedTitle || playlist.name}
                          </h4>
                        </div>
                        <div className="w-full px-4 py-1 bg-black rounded-md bg-opacity-30 backdrop-blur-sm">
                          <p className="text-sm text-white text-opacity-95 drop-shadow-md line-clamp-2">
                            {playlist.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mood Tag */}
                      <div className="mb-6">
                        <span className="inline-block px-3 py-1 text-xs font-medium text-white bg-white bg-opacity-25 rounded-full shadow-lg backdrop-blur-sm">
                          {index === 0 ? 'Chill Vibes' : index === 1 ? 'Energy Boost' : 'Feel Good'}
                        </span>
                      </div>
                      
                      {/* Play Button Overlay - Smaller and Offset */}
                      <div className="absolute transition-all duration-300 transform -translate-y-1/2 opacity-0 top-1/2 right-6 group-hover:opacity-100">
                        <div className="flex items-center justify-center w-12 h-12 transition-transform duration-300 transform scale-90 bg-white rounded-full shadow-2xl bg-opacity-95 group-hover:scale-100 group-hover:shadow-white group-hover:shadow-lg">
                          <FaPlay className="text-lg text-[#1DB954] ml-0.5" />
                        </div>
                      </div>
                      
                      {/* Subtle CTA */}
                      <div className="absolute left-0 right-0 text-center bottom-4">
                        <p className="text-xs font-medium text-white text-opacity-70 drop-shadow-md">
                          Tap to listen 🎧
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Layout - Responsive Carousel */}
        <div className="lg:hidden">
          {/* Mobile Carousel Navigation */}
          <div className="flex justify-center mb-6">
                      <div className="flex p-1 rounded-lg bg-primary-200">
            {playlists.map((playlist, index) => (
              <button
                key={playlist.id}
                onClick={() => setActiveSpotifyTab(index)}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 min-h-[44px] focus-visible-ring ${
                  activeSpotifyTab === index
                    ? 'bg-white text-text-1100 shadow-sm'
                    : 'text-black hover:text-text-1100'
                }`}
                aria-label={`Switch to ${playlist.name} playlist`}
                aria-selected={activeSpotifyTab === index}
              >
                  {playlist.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Carousel Content */}
          <div className="relative">
            {playlists.map((playlist, index) => (
              <div
                key={playlist.id}
                className={`transition-all duration-300 ${
                  activeSpotifyTab === index ? 'opacity-100 block' : 'opacity-0 hidden'
                }`}
              >
                {/* Screen reader only heading */}
                <h3 className="sr-only">{playlist.name}</h3>
                
                <div className="w-full aspect-[16/9] overflow-hidden transition-all duration-300 shadow-strong rounded-xl active:shadow-strong">
                  {loadedIframes.has(index) ? (
                    <div className="relative w-full h-full overflow-hidden rounded-xl">
                      <iframe
                        src={`https://open.spotify.com/embed/playlist/${playlist.url.split('/').pop()}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="encrypted-media"
                        loading="lazy"
                        title={playlist.name}
                        className="w-full h-full rounded-xl"
                      />
                    </div>
                  ) : (
                                          <div 
                        className="relative w-full h-full overflow-hidden transition-all duration-300 transform cursor-pointer group rounded-xl active:scale-95"
                        style={{
                          background: playlist.previewColor 
                            ? `linear-gradient(135deg, ${playlist.previewColor}dd, ${playlist.previewColor}aa)`
                            : 'linear-gradient(135deg, #1DB954dd, #1ed760aa)'
                        }}
                        onClick={() => setLoadedIframes(prev => new Set([...prev, index]))}
                      >
                        {/* Background Overlay for Better Text Contrast */}
                        <div className="absolute inset-0 transition-all duration-300 bg-black bg-opacity-30 group-active:bg-opacity-20"></div>
                        
                        {/* Mobile Content Overlay - Restructured for Better Spacing */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                          {/* Top Section: Spotify Logo */}
                          <div className="mb-4">
                            <FaSpotify className="text-2xl text-white drop-shadow-lg" />
                          </div>
                          
                          {/* Middle Section: Playlist Info - Simplified */}
                          <div className="mb-4 w-full max-w-[240px]">
                            <div className="w-full px-3 py-2 bg-black rounded-lg bg-opacity-40 backdrop-blur-sm">
                              <h4 className="text-sm font-bold text-white drop-shadow-lg line-clamp-1">
                                {playlist.stylizedTitle || playlist.name}
                              </h4>
                            </div>
                          </div>
                          
                          {/* Bottom Section: Mood Tag */}
                          <div className="mb-3">
                            <span className="inline-block px-3 py-1 text-sm font-medium text-white bg-white bg-opacity-25 rounded-full shadow-lg backdrop-blur-sm">
                              {index === 0 ? 'Chill Vibes' : index === 1 ? 'Energy Boost' : 'Feel Good'}
                            </span>
                          </div>
                          
                          {/* CTA - Fixed at Bottom */}
                          <div className="absolute left-0 right-0 text-center bottom-2">
                            <p className="text-xs font-medium text-white text-opacity-80 drop-shadow-md">
                              Tap to listen 🎧
                            </p>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Video Modal */}
      {selectedVideo && (
        <Modal isOpen={true} onClose={() => setSelectedVideo(null)}>
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-2xl mb-3 aspect-video max-h-[50vh]">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg"
              />
            </div>
            <div className="w-full max-w-2xl p-4 rounded-lg bg-gray-50 opacity-80">
              {/* Mobile-first layout: Stack content vertically, date at bottom right */}
              <div className="flex flex-col">
                {/* Title and description get full width */}
                <div className="w-full mb-3">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#383B26] mb-2 text-left leading-tight">{selectedVideo.title}</h3>
                  <p className="text-sm sm:text-base text-[#8F907E] leading-relaxed text-left">{selectedVideo.description}</p>
                </div>
                {/* Date positioned at bottom right */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-1 text-sm sm:text-base text-[#8F907E]">
                    <FaCalendar />
                    <span>{formatDate(selectedVideo.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Album Modal */}
      {selectedAlbum && (
        <Modal isOpen={true} onClose={() => setSelectedAlbum(null)}>
          <div className="relative w-full max-w-4xl">
            {/* Compact Header */}
            <div className="pt-0 pb-2 mb-2 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-[#8F907E]">
                <span className="font-semibold text-[#383B26]">{selectedAlbum.title}</span>
                <span>•</span>
                <span>{selectedAlbum.description}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <FaCalendar />
                  <span>{formatDate(selectedAlbum.date)}</span>
                </div>
              </div>
            </div>
            
            {/* Main image with hover details */}
            <div className="relative flex items-center justify-center mb-3">
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#E3D4C2] rounded-full p-2 shadow hover:bg-[#B89178] transition-colors z-10" 
                onClick={(e) => { e.stopPropagation(); handleImageModalNav(-1); }} 
                aria-label="Previous photo"
              >
                &#8592;
              </button>
              
              {/* Image container with hover effects */}
              <div className="relative overflow-hidden group rounded-xl">
                <img 
                  src={selectedAlbum.photos[selectedPhotoIndex].src} 
                  alt={selectedAlbum.photos[selectedPhotoIndex].alt} 
                  className="max-h-[60vh] w-full object-contain cursor-pointer hover:scale-105 transition-transform duration-200" 
                  onClick={() => {
                    // Click to zoom - open in new tab for full size
                    window.open(selectedAlbum.photos[selectedPhotoIndex].src, '_blank');
                  }}
                />
                
                {/* Hover overlay for photo details */}
                <div className="absolute bottom-0 left-0 right-0 h-24 transition-all duration-300 opacity-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/30 to-transparent group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-white">
                    <p className="mb-1 text-lg font-semibold drop-shadow-lg">{selectedAlbum.photos[selectedPhotoIndex].alt}</p>
                    {selectedAlbum.photos[selectedPhotoIndex].caption && (
                      <p className="text-sm opacity-95 drop-shadow-md">{selectedAlbum.photos[selectedPhotoIndex].caption}</p>
                    )}
                  </div>
                </div>
              </div>
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#E3D4C2] rounded-full p-2 shadow hover:bg-[#B89178] transition-colors z-10" 
                onClick={(e) => { e.stopPropagation(); handleImageModalNav(1); }} 
                aria-label="Next photo"
              >
                &#8594;
              </button>
            </div>
            
            {/* Spacer for sticky thumbnail strip */}
            <div className="pb-24"></div>

            {/* Sticky Bottom Thumbnail Strip */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[#383B26]">Current: {selectedPhotoIndex + 1} of {selectedAlbum.photos.length}</h4>
                  <button
                    onClick={handleShowAllImages}
                    className="text-sm text-[#B89178] hover:text-[#A67B62] font-medium transition-colors"
                  >
                    Show all
                  </button>
                </div>
                
                <div className="relative flex items-center">
                  {/* Left scroll button */}
                  {thumbnailScrollIndex > 0 && (
                    <button
                      onClick={() => handleThumbnailScroll(-1)}
                      className="absolute left-0 z-10 p-1 transition-colors bg-white rounded-full shadow-md hover:bg-gray-50"
                      aria-label="Scroll left"
                    >
                      &#8592;
                    </button>
                  )}
                  
                  {/* Thumbnail container */}
                  <div className="flex gap-2 px-8 overflow-hidden">
                    {selectedAlbum.photos.slice(thumbnailScrollIndex, thumbnailScrollIndex + 5).map((photo, idx) => {
                      const actualIndex = thumbnailScrollIndex + idx;
                      return (
                        <img
                          key={actualIndex}
                          src={photo.src}
                          alt={photo.alt}
                          className={`flex-shrink-0 rounded-md h-16 w-16 object-cover cursor-pointer border-2 transition-all duration-200 ${
                            selectedPhotoIndex === actualIndex 
                              ? 'border-[#B89178] scale-110 shadow-lg' 
                              : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          onClick={() => setSelectedPhotoIndex(actualIndex)}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Right scroll button */}
                  {thumbnailScrollIndex + 5 < selectedAlbum.photos.length && (
                    <button
                      onClick={() => handleThumbnailScroll(1)}
                      className="absolute right-0 z-10 p-1 transition-colors bg-white rounded-full shadow-md hover:bg-gray-50"
                      aria-label="Scroll right"
                    >
                      &#8594;
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Show All Images Modal */}
      {showAllImages && selectedAlbum && (
        <Modal isOpen={true} onClose={handleCloseShowAll}>
          <div className="relative w-full max-w-6xl">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-semibold text-[#383B26] mb-2">{selectedAlbum.title} - All Photos</h3>
              <p className="text-[#8F907E]">Click any image to select it</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[70vh] overflow-y-auto">
              {selectedAlbum.photos.map((photo, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedPhotoIndex === idx 
                      ? 'ring-4 ring-[#B89178] scale-105' 
                      : 'hover:scale-105 hover:shadow-lg'
                  }`}
                  onClick={() => handleSelectImageFromGrid(idx)}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="object-cover w-full h-full"
                  />
                  {selectedPhotoIndex === idx && (
                    <div className="absolute top-2 right-2 bg-[#B89178] text-white text-xs px-2 py-1 rounded-full">
                      Current
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white bg-black bg-opacity-50">
                    {photo.alt}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={handleCloseShowAll}
                className="bg-[#B89178] text-white px-6 py-2 rounded-lg hover:bg-[#A67B62] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </div>
  );
}; 