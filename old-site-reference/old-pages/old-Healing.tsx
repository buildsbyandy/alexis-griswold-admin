import React, { useState } from 'react';
import { FaPlay, FaCalendar, FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa';
import Modal from '../components/Modal';
import VideoCarousel from '../components/VideoCarousel';
import SectionLayout from '../components/SectionLayout';
import HealingSectionWrapper from '../components/HealingSectionWrapper';

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
  title: "HEALING",
  subtitle: "Your journey to wellness starts here.\n\nFrom gut health to holistic healing, discover natural methods to restore your body's balance and vitality. Every step of this journey is guided by science-backed approaches and time-tested remedies that honor your body's innate healing wisdom.",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  ctaLabel: "Watch Now"
};

// Sample data for gut healing videos
const gutHealingPart1Videos = [
  {
    id: 'candida-video-1',
    title: 'Candida Cleanse Introduction',
    description: 'Understanding candida overgrowth and natural cleansing methods',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-01-15',
    views: '8.2K',
    duration: '12:45',
    isFeatured: false,
    order: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'candida-video-2',
    title: 'Anti-Candida Diet Plan',
    description: 'Complete meal plan to eliminate candida naturally',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-01-20',
    views: '6.7K',
    duration: '15:30',
    isFeatured: false,
    order: 2,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'candida-video-3',
    title: 'Candida Die-Off Symptoms',
    description: 'How to manage and reduce die-off symptoms during cleanse',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-01-25',
    views: '5.9K',
    duration: '10:20',
    isFeatured: false,
    order: 3,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'candida-video-4',
    title: 'Natural Antifungal Supplements',
    description: 'Best supplements to support candida elimination',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-02-01',
    views: '7.3K',
    duration: '13:15',
    isFeatured: false,
    order: 4,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
];

const gutHealingPart2Videos = [
  {
    id: 'rebuild-video-1',
    title: 'Gut Microbiome Restoration',
    description: 'Rebuilding healthy gut bacteria after candida cleanse',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-02-10',
    views: '9.1K',
    duration: '14:20',
    isFeatured: false,
    order: 1,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  },
  {
    id: 'rebuild-video-2',
    title: 'Probiotic Foods Guide',
    description: 'Best probiotic-rich foods to restore gut health',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-02-15',
    views: '6.8K',
    duration: '11:45',
    isFeatured: false,
    order: 2,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: 'rebuild-video-3',
    title: 'Healing Leaky Gut',
    description: 'Natural methods to repair intestinal permeability',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-02-20',
    views: '8.5K',
    duration: '16:30',
    isFeatured: false,
    order: 3,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: 'rebuild-video-4',
    title: 'Post-Cleanse Maintenance',
    description: 'Long-term strategies to maintain gut health',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-02-25',
    views: '7.2K',
    duration: '12:10',
    isFeatured: false,
    order: 4,
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-25')
  }
];

// Sample data for tutorial products
const healingProducts = [
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
  },
  {
    id: 'l-glutamine-1',
    name: 'Pure Encapsulations L-Glutamine',
    purpose: 'Repair intestinal lining and reduce inflammation',
    howToUse: 'Take 5g powder mixed in water on empty stomach',
    image: '/public/images/products/glutamine-1.jpg',
    amazonUrl: 'https://amazon.com/placeholder-glutamine-1'
  },
  {
    id: 'aloe-vera-1',
    name: 'Lily of the Desert Aloe Vera',
    purpose: 'Soothe digestive tract and support natural healing',
    howToUse: 'Take 2-4 oz daily, preferably before meals',
    image: '/public/images/products/aloe-1.jpg',
    amazonUrl: 'https://amazon.com/placeholder-aloe-1'
  },
  {
    id: 'omega-3-1',
    name: 'Nordic Naturals Omega-3',
    purpose: 'Reduce inflammation and support brain-gut connection',
    howToUse: 'Take 2 softgels daily with food',
    image: '/public/images/products/omega-1.jpg',
    amazonUrl: 'https://amazon.com/placeholder-omega-1'
  }
];

const Healing: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const handleVideoClick = (video: any) => {
    setSelectedVideo(video);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SectionLayout bgHero="#E6F2E8">
      <div className="w-full text-[#383B26] font-serif flex flex-col bg-[#cbb6a6] overflow-x-hidden">
        <div className="font-brand-body">
        
        {/* Hero Section - Pale Mint Green Background */}
        <HealingSectionWrapper
          bg="bg-[#E6F2E8]"
          className="-mt-4"
          contentClassName="min-h-[85vh] py-12 sm:py-16"
        >
          {/* Main Hero Content */}
          <div className="relative flex flex-col items-center justify-center w-full gap-6 sm:gap-8">
            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full gap-8 mx-auto sm:gap-12 max-w-7xl lg:flex-row lg:gap-16">
              
              {/* Text Content - Left Side */}
              <div className="flex flex-col items-center justify-center w-full px-4 sm:px-0 lg:w-1/2 lg:items-start lg:pr-4">
                <h1 className="mb-6 text-2xl font-bold tracking-wide text-center text-[#383B26] sm:mb-8 sm:text-3xl lg:text-4xl xl:text-5xl lg:text-left">
                  {heroData.title}
                </h1>
                <div className="space-y-4 text-sm leading-relaxed text-center sm:text-base lg:text-base xl:text-lg lg:text-left lg:space-y-6 max-w-none lg:max-w-full">
                  <p className="font-semibold text-[#262626]">
                    Your journey to wellness starts here.
                  </p>
                  <p className="text-[#262626]">
                    From gut health to holistic healing, discover natural methods to restore your body&apos;s balance and vitality. Every step of this journey is guided by science-backed approaches and time-tested remedies that honor your body&apos;s innate healing wisdom.
                  </p>
                </div>
              </div>
              
              {/* Featured Video - Right Side */}
              <div className="flex flex-col items-center justify-start w-full px-4 sm:px-0 lg:w-1/2 lg:pl-2">
                <div className="relative w-full max-w-2xl">
                  <div 
                    className="relative px-3 py-3 overflow-hidden transition-all duration-300 transform bg-white cursor-pointer rounded-xl shadow-strong hover:scale-105 hover:shadow-strong reduced-motion lg:px-4 lg:py-4"
                    onClick={() => setSelectedVideo({ id: 'dQw4w9WgXcQ', title: 'Healing Journey Introduction', description: 'Your journey to wellness starts here', publishedAt: '2024-01-15' })}
                    role="button"
                    tabIndex={0}
                    aria-label="Play featured video: Healing Journey Introduction"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedVideo({ id: 'dQw4w9WgXcQ', title: 'Healing Journey Introduction', description: 'Your journey to wellness starts here', publishedAt: '2024-01-15' });
                      }
                    }}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative w-full overflow-hidden aspect-video">
                      <img 
                        src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" 
                        alt="Healing Journey Introduction"
                        className="object-cover object-center w-full h-full"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black bg-opacity-20 hover:bg-opacity-30">
                        <div className="flex items-center justify-center w-16 h-16 transition-all duration-300 transform bg-white rounded-full shadow-lg sm:w-20 sm:h-20 bg-opacity-90 hover:scale-110 reduced-motion">
                          <FaPlay className="ml-1 text-xl sm:text-2xl text-[#383B26]" aria-hidden="true" />
                        </div>
                      </div>
                      {/* Duration Badge */}
                      <div className="absolute px-2 py-1 text-xs font-medium text-white bg-black bg-opacity-75 rounded-full sm:px-3 sm:py-1 sm:text-sm bottom-3 right-3 sm:bottom-4 sm:right-4">
                        15:30
                      </div>
                    </div>
                    {/* Video Info */}
                    <div className="p-2 sm:p-3">
                      <h3 className="mb-1 overflow-hidden text-sm font-semibold sm:text-base text-[#383B26] sm:mb-2 whitespace-nowrap text-ellipsis">Healing Journey Introduction</h3>
                      <p className="mb-2 text-xs text-[#262626] sm:mb-3 line-clamp-1">Your journey to wellness starts here</p>
                      {/* CTA and Meta Info */}
                      <div className="flex items-center justify-between gap-2">
                        <button 
                          className="px-4 py-1 text-xs bg-[#4A6B48] text-[#FDFCFA] font-medium rounded-md hover:bg-[#5A7A5A] transition-colors sm:px-6 sm:py-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideo({ id: 'dQw4w9WgXcQ', title: 'Healing Journey Introduction', description: 'Your journey to wellness starts here', publishedAt: '2024-01-15' });
                          }}
                        >
                          {heroData.ctaLabel}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs sm:gap-2 text-[#262626]">
                          <div className="flex items-center gap-1">
                            <FaCalendar />
                            <span>{formatDate('2024-01-15')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator - Nudged closer to bottom */}
          <div className="absolute inset-x-0 z-30 flex justify-center pointer-events-none animate-bounce reduced-motion bottom-2 sm:bottom-4 md:bottom-6">
            <div className="flex flex-col items-center gap-1 text-[#383B26] sm:gap-2">
              <FaChevronDown className="text-lg sm:text-xl md:text-2xl" aria-hidden="true" />
            </div>
          </div>
        </HealingSectionWrapper>

        {/* Gut Healing Part 1 Section - Light Cream Background */}
        <HealingSectionWrapper
          bg="bg-[#c7d9cb]"
          topDivider="intersect-waves-split"
          topDividerColor="#E6F2E8"
          className="-mt-10 sm:-mt-12 md:-mt-16 lg:-mt-20"
          contentClassName="pt-24 sm:pt-32 md:pt-40 lg:pt-44 pb-4 sm:pb-6"
          topDividerClassName="h-[88px] sm:h-[120px] md:h-[152px] lg:h-[184px]"
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#383B26] mb-2">Gut Healing Part 1</h2>
            <p className="text-xl text-[#262626]">Candida Cleanse</p>
          </div>
          
          <div className="min-h-[400px]">
            <VideoCarousel 
              videos={gutHealingPart1Videos} 
              onVideoClick={handleVideoClick}
              carouselId="gut-healing-part-1"
              cardBgClass="bg-[#f8f3ec]"
              dotInactiveBgClass="bg-[#E6E0D9]"
              dotHoverBgClass="hover:bg-[#f8f3ec] hover:bg-opacity-50"
            />
          </div>
        </HealingSectionWrapper>

        {/* Gut Healing Part 2 Section - Muted Sage Green Background */}
        <HealingSectionWrapper
          bg="bg-[#C7D9CB]"
          topDivider="intersecting-curves"
          topDividerClassName="text-[#FDFCFA]"
          className="mt-0"
          contentClassName="pt-36 pb-12 sm:pt-40 sm:pb-14"
          bottomDivider="intersect-waves-split"
          bottomDividerClassName="scale-x-[-1]"
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#383B26] mb-2">Gut Healing Part 2</h2>
            <p className="text-xl text-[#262626]">Rebuild & Repair</p>
          </div>
          
          <div className="min-h-[400px]">
            <VideoCarousel 
              videos={gutHealingPart2Videos} 
              onVideoClick={handleVideoClick}
              carouselId="gut-healing-part-2"
              cardBgClass="bg-white"
              arrowBgClass="bg-white"
              arrowHoverBgClass="hover:bg-white"
              dotInactiveBgClass="bg-white"
              dotHoverBgClass="hover:bg-white"
            />
          </div>
        </HealingSectionWrapper>

        {/* Healing Products & Supplements Section - Light Cream Background */}
        <HealingSectionWrapper
          bg="bg-[#FDFCFA]"
          topDivider="intersect-waves-split"
          contentClassName="pt-44 pb-12 sm:pt-48 sm:pb-16"
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#383B26] mb-2">Healing Products & Supplements</h2>
            <p className="text-xl text-[#262626]">Essential products to support your healing journey</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {healingProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-[#E3D4C2] rounded-lg shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-200 transform"
              >
                {/* Product Image */}
                <div className="h-48 bg-[#B89178] flex items-center justify-center">
                  <span className="text-lg font-medium text-white">Product Image</span>
                </div>
                
                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#383B26] mb-4">{product.name}</h3>
                  
                  <div className="mb-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#8F907E] uppercase tracking-wide mb-1">Purpose</h4>
                      <p className="text-sm text-[#262626] leading-relaxed">{product.purpose}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-[#8F907E] uppercase tracking-wide mb-1">How to Use</h4>
                      <p className="text-sm text-[#262626] leading-relaxed">{product.howToUse}</p>
                    </div>
                  </div>
                  
                  {/* Amazon Button */}
                  <button
                    onClick={() => window.open(product.amazonUrl, '_blank')}
                    className="w-full bg-[#B89178] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#A67B62] hover:shadow-lg transform transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FaExternalLinkAlt className="text-sm" />
                    View on Amazon
                  </button>
                </div>
              </div>
            ))}
          </div>
        </HealingSectionWrapper>

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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-[#383B26] mb-2 text-left">{selectedVideo.title}</h3>
                    <p className="text-base text-[#262626] leading-relaxed text-left">{selectedVideo.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-base text-[#262626] ml-4">
                    <div className="flex items-center gap-1">
                      <FaCalendar />
                      <span>{formatDate(selectedVideo.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
        </div>
      </div>
    </SectionLayout>
  );
};

export default Healing; 