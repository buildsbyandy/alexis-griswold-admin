import type { FC } from 'react';
import { useState, useEffect } from 'react';
import NavButton from '../components/NavButton';
import AdminDashboardLink from '../components/AdminDashboardLink';
import { homePageData } from '../data/cmsData';
import { SupabaseHomeContentService } from '../lib/database/supabaseService';
import type { HomeContent, NavigationButton } from '../types/database';

const Home: FC = () => {
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [navigationButtons, setNavigationButtons] = useState<NavigationButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHomeContent = async () => {
      try {
        const homeService = new SupabaseHomeContentService();
        const { content, navigationButtons: navButtons } = await homeService.getHomeContent();
        
        setHomeContent(content);
        setNavigationButtons(navButtons);
      } catch (err) {
        console.error('Error loading home content:', err);
        setError('Failed to load content');
        // Fallback to static data
        setHomeContent({
          id: 'fallback',
          hero_main_title: homePageData.hero.mainTitle,
          hero_subtitle: homePageData.hero.subtitle,
          copyright_text: homePageData.copyright,
          background_video_path: homePageData.backgroundVideo.desktopVideoUrl,
          background_image_path: homePageData.backgroundVideo.fallbackImageUrl,
          is_published: true,
          created_at: '',
          updated_at: '',
        });
        setNavigationButtons([]);
      } finally {
        setLoading(false);
      }
    };

    loadHomeContent();
  }, []);

  if (loading) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg text-white">Loading...</div>
        </div>
      </main>
    );
  }

  if (error && !homeContent) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg text-white">Error loading content</div>
        </div>
      </main>
    );
  }

  const displayContent = homeContent || {
    hero_main_title: homePageData.hero.mainTitle,
    hero_subtitle: homePageData.hero.subtitle,
    copyright_text: homePageData.copyright,
    background_video_path: homePageData.backgroundVideo.desktopVideoUrl,
    background_image_path: homePageData.backgroundVideo.fallbackImageUrl,
  };

  // Use navigation buttons from database if available, otherwise use static ones
  const displayButtons = navigationButtons.length > 0 
    ? navigationButtons.map(btn => ({ text: btn.button_text, href: btn.button_href }))
    : homePageData.navigation.buttons;

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Admin dashboard link - positioned at top for home page */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <AdminDashboardLink />
      </div>
      
      {/* Full-screen Background: Video (desktop) + Image (fallback/mobile) */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {/* Image fallback - always visible, behind video on desktop */}
        <img
          src={displayContent.background_image_path || homePageData.backgroundVideo.fallbackImageUrl}
          alt=""
          className="object-cover w-full h-full"
          aria-hidden="true"
        />
        
        {/* Video background - only visible on desktop (md+) with 80% opacity */}
        <video
          src={displayContent.background_video_path || homePageData.backgroundVideo.desktopVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 hidden object-cover w-full h-full opacity-80 md:block"
          aria-label="Video behind the scenes of Alexis Griswold at a photoshoot."
          aria-hidden="true"
          tabIndex={-1}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-screen p-4 text-center sm:p-6 md:p-8">
        <h1 className="mb-4 font-serif text-3xl text-white sm:text-4xl md:text-6xl">
          {displayContent.hero_main_title}
        </h1>
        <p className="mb-8 text-lg text-white sm:mb-12 sm:text-xl md:text-2xl">
          {displayContent.hero_subtitle}
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center justify-center w-full max-w-4xl gap-4 sm:gap-6">
          <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {displayButtons.map((button, index) => (
              <NavButton
                key={index}
                text={button.text}
                href={button.href}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Copyright */}
      <div className="absolute z-20 transform -translate-x-1/2 bottom-4 left-1/2">
        <p className="text-sm font-medium text-white/80">
          {displayContent.copyright_text}
        </p>
      </div>
    </main>
  );
};

export default Home; 