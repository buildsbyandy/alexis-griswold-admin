import React, { useState } from 'react';
import { FaSearch, FaChevronDown, FaChevronRight, FaFolder, FaFolderOpen } from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight as FaChevronRightIcon } from 'react-icons/fa';
import Modal from '../components/Modal';
import recipes from '../data/recipesData';
import RecipeCard from '../components/RecipeCard';
import RecipeCarousel from '../components/RecipeCarousel';
import SectionLayout from '../components/SectionLayout';
import SectionWrapper from '../components/SectionWrapper';
import { recipesPageData } from '../data/cmsData';

// Removed hardcoded inspiringMessage - now using recipesPageData.hero

// Define the new folder categories
const folderCategories = [
  { id: 'breakfast', name: 'Breakfast', icon: '🥞' },
  { id: 'meals', name: 'Meals', icon: '🍽️' },
  { id: 'smoothies', name: 'Smoothies', icon: '🥤' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'sauces', name: 'Sauces', icon: '🥄' },
  { id: 'raw', name: 'Raw', icon: '🥗' },
  { id: 'juices', name: 'Juices', icon: '🧃' },
  { id: 'drink', name: 'Drink', icon: '🍹' },
];

// Beginner-friendly recipes (simple, introductory recipes)
const beginnerRecipes = [
  'GardenSalad',
  'SimpleTahiniDressing',
  'FiberFruitBowl',
  'MangoChiaPudding',
  'MapleTrailMix',
  'QuinoaPorridge'
];

// Using recipesPageData.heroCarousel instead of hardcoded shortsVideos

// Get indices for left, center, right (only 3 visible)
const getThreeVisibleIndices = (activeIndex: number, length: number) => [
  (activeIndex + length - 1) % length, // left
  activeIndex,                        // center
  (activeIndex + 1) % length          // right
];

// Helper function to categorize recipes into folders
const categorizeRecipes = (recipes: typeof import('../data/recipesData').default) => {
  const categorized = {
    breakfast: [] as typeof recipes,
    meals: [] as typeof recipes,
    smoothies: [] as typeof recipes,
    desserts: [] as typeof recipes,
    sauces: [] as typeof recipes,
    raw: [] as typeof recipes,
    juices: [] as typeof recipes,
    drink: [] as typeof recipes,
    beginners: [] as typeof recipes,
  };

  recipes.forEach(recipe => {
    // Check if it's a beginner recipe
    const isBeginner = beginnerRecipes.some(beginner => 
      recipe.title.toLowerCase().includes(beginner.toLowerCase().replace(/([A-Z])/g, ' $1').toLowerCase())
    );
    
    if (isBeginner) {
      categorized.beginners.push(recipe);
    }

    // Categorize based on category and label
    if (recipe.category === 'Shakes') {
      // Drinks that are shakes may be juices or smoothies
      if (recipe.title.toLowerCase().includes('juice')) {
        categorized.juices.push(recipe);
      } else {
        categorized.smoothies.push(recipe);
      }
      // All shakes are drinks
      categorized.drink.push(recipe);
    } else if (recipe.category === 'Breakfast' || recipe.category === 'Lunch' || recipe.category === 'Dinner') {
      // Breakfast specific folder plus Meals
      if (recipe.category === 'Breakfast') {
        categorized.breakfast.push(recipe);
      }
      categorized.meals.push(recipe);
    } else if (recipe.label === 'Raw') {
      categorized.raw.push(recipe);
    } else if (recipe.title.toLowerCase().includes('dressing') || recipe.title.toLowerCase().includes('sauce') || recipe.title.toLowerCase().includes('mustard')) {
      categorized.sauces.push(recipe);
    } else if (recipe.title.toLowerCase().includes('brownie') || recipe.title.toLowerCase().includes('pudding') || recipe.title.toLowerCase().includes('cup') || recipe.title.toLowerCase().includes('bar')) {
      categorized.desserts.push(recipe);
    } else if (recipe.title.toLowerCase().includes('juice')) {
      categorized.juices.push(recipe);
      categorized.drink.push(recipe);
    } else {
      // Default to meals for uncategorized
      categorized.meals.push(recipe);
    }
  });

  return categorized;
};

// Placeholder beginner recipes for the "Just Starting Out" section
const placeholderBeginnerRecipes = [
  {
    slug: 'simple-garden-salad',
    title: 'Simple Garden Salad',
    category: 'Meals',
    label: 'Beginner',
    description: 'Fresh greens with a light dressing - perfect for beginners',
    images: ['/public/images/GardenSalad/1.WEBP'],
    ingredients: ['Mixed greens', 'Cherry tomatoes', 'Cucumber', 'Olive oil', 'Lemon juice', 'Salt & pepper'],
    instructions: ['Wash and prepare all vegetables', 'Combine in a large bowl', 'Drizzle with olive oil and lemon juice', 'Season with salt and pepper', 'Toss gently and serve']
  },
  {
    slug: 'berry-blast-smoothie',
    title: 'Berry Blast Smoothie',
    category: 'Smoothies',
    label: 'Beginner',
    description: 'Easy 3-ingredient smoothie that\'s both delicious and nutritious',
    images: ['/public/images/PapayaStrawberrySmoothie/1.WEBP'],
    ingredients: ['Mixed berries', 'Banana', 'Almond milk'],
    instructions: ['Add all ingredients to blender', 'Blend until smooth', 'Pour into glass and enjoy']
  },
  {
    slug: 'chocolate-energy-balls',
    title: 'Chocolate Energy Balls',
    category: 'Desserts',
    label: 'Beginner',
    description: 'No-bake treats that are healthy and satisfying',
    images: ['/public/images/Rawveganreesesbar/1.WEBP'],
    ingredients: ['Dates', 'Cocoa powder', 'Nuts', 'Coconut flakes'],
    instructions: ['Soak dates in warm water', 'Blend with other ingredients', 'Roll into balls', 'Coat with coconut flakes']
  },
  {
    slug: 'green-detox-juice',
    title: 'Green Detox Juice',
    category: 'Juices',
    label: 'Beginner',
    description: 'Simple juice recipe to kickstart your healthy journey',
    images: ['/public/images/supergreensjuice/1.WEBP'],
    ingredients: ['Spinach', 'Cucumber', 'Apple', 'Lemon', 'Ginger'],
    instructions: ['Wash all ingredients', 'Juice in order: spinach, cucumber, apple, lemon, ginger', 'Stir and serve immediately']
  }
];

const Recipes: React.FC = () => {
  const [search, setSearch] = useState('');
  const [modalCarousel, setModalCarousel] = useState<typeof recipesPageData.heroCarousel[0] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<null | typeof recipes[0] | typeof placeholderBeginnerRecipes[0]>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set()); // Start with all folders collapsed
  const [folderSearches, setFolderSearches] = useState<Record<string, string>>({});

  const categorizedRecipes = categorizeRecipes(recipes);

  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + recipesPageData.heroCarousel.length) % recipesPageData.heroCarousel.length);
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % recipesPageData.heroCarousel.length);

  const visibleIndices = getThreeVisibleIndices(activeIndex, recipesPageData.heroCarousel.length);

  // Carousel scroll ref
  const carouselRef = React.useRef<HTMLDivElement>(null);

  // Scroll to the active card
  React.useEffect(() => {
    if (carouselRef.current) {
      const card = carouselRef.current.querySelectorAll('[data-carousel-card]')[activeIndex];
      if (card && 'scrollIntoView' in card) {
        (card as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // When a new recipe is selected, reset the selected image index
  React.useEffect(() => {
    setSelectedImageIdx(0);
  }, [selectedRecipe]);

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const updateFolderSearch = (folderId: string, searchTerm: string) => {
    setFolderSearches(prev => ({
      ...prev,
      [folderId]: searchTerm
    }));
  };

  const filterRecipesInFolder = (folderRecipes: typeof recipes, folderId: string) => {
    const folderSearch = folderSearches[folderId] || '';
    if (!folderSearch) return folderRecipes;
    
    return folderRecipes.filter(recipe =>
      recipe.title.toLowerCase().includes(folderSearch.toLowerCase())
    );
  };

  console.log('Recipe categories:', recipes.map(r => r.category));
  console.log('Loaded recipes:', recipes);

  return (
    <SectionLayout bgHero="#FDFCFA">
      <div className="w-full text-[#383B26] font-serif flex flex-col bg-[#cbb6a6] overflow-x-hidden">
        <div className="font-brand-body">
        {/* Hero Section */}
        <SectionWrapper
          bg="bg-gradient-to-b from-[#FDFCFA] to-[#E3D4C2]"
          className="-mt-4"
          contentClassName="min-h-[85vh] py-12 sm:py-16"
        >
          {/* Main Hero Content */}
          <div className="relative flex flex-col items-center justify-center w-full gap-6 sm:gap-8">
            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full gap-8 mx-auto sm:gap-12 max-w-7xl lg:flex-row lg:gap-16">
              
              {/* Text Content - Left Side */}
              <div className="flex flex-col items-center justify-center w-full px-4 sm:px-0 lg:w-1/2 lg:items-start lg:pr-4">
                <h1 className="mb-6 text-2xl font-bold tracking-wide text-center text-black sm:mb-8 sm:text-3xl lg:text-4xl xl:text-5xl lg:text-left">
                  {recipesPageData.hero.title}
                </h1>
                <div className="space-y-4 text-sm leading-relaxed text-center sm:text-base lg:text-base xl:text-lg lg:text-left lg:space-y-6 max-w-none lg:max-w-full">
                  <p className="font-semibold text-text-1100">
                    {recipesPageData.hero.subtitle}
                  </p>
                  <p className="text-black">
                    {recipesPageData.hero.bodyParagraph}
                  </p>
                </div>
              </div>
              
              {/* Recipe Carousel - Right Side */}
              <div className="flex flex-col items-center justify-start w-full px-4 sm:px-0 lg:w-1/2 lg:pl-2">
                <div className="relative flex flex-col w-full h-full max-w-md mx-auto overflow-visible lg:max-w-lg lg:ml-auto lg:mr-0">
                  <div
                    className="flex flex-row items-center justify-center flex-1 w-full gap-2 px-4 overflow-visible sm:gap-4"
                    style={{ 
                      minHeight: '525px', 
                      maxHeight: '625px'
                    }}
                    role="region"
                    aria-label="Recipe video carousel"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft') handlePrev();
                      if (e.key === 'ArrowRight') handleNext();
                    }}
                  >
                {visibleIndices.map((idx, pos) => {
                  const item = recipesPageData.heroCarousel[idx];
                  const isActive = pos === 1;
                  const isSide = pos !== 1;
                  const videoId = item.youtubeUrl.split('v=')[1]?.split('&')[0] || item.id;
                  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                  const thumbFallback = `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
                  
                  return (
                    <div
                      key={item.id}
                      className={`snap-center flex-shrink-0 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center h-full
                        ${isActive ? 'z-10 scale-110 opacity-100' : 'z-5 scale-95 opacity-60'}
                      `}
                      style={{ 
                        width: '200px', 
                        maxWidth: 'calc(100vw - 4rem)', 
                        marginLeft: isSide ? '-15px' : '0', 
                        marginRight: isSide ? '-15px' : '0' 
                      }}
                      onClick={() => { setActiveIndex(idx); setModalCarousel(item); }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open video: ${item.title}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setActiveIndex(idx); setModalCarousel(item); } }}
                    >
                      <div className="relative flex flex-col items-center justify-center">
                        <img
                          src={thumb}
                          alt={item.title}
                          className="aspect-[9/16] w-full rounded-xl shadow-lg object-cover"
                          style={{ 
                            minHeight: isActive ? '400px' : '340px',
                            maxHeight: isActive ? '450px' : '380px'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== thumbFallback) {
                              target.src = thumbFallback;
                            }
                          }}
                        />
                        {isActive && (
                          <div className="flex justify-center mt-3" style={{ marginBottom: '16px' }}>
                            <span className="px-3 py-1.5 text-xs font-medium rounded-full shadow-lg whitespace-nowrap" style={{ backgroundColor: '#A27D4C', color: '#FDFCFA' }}>
                              YouTube Reel
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                  </div>
                  {/* Arrows below carousel */}
                  <div className="relative z-20 flex justify-between w-full max-w-md px-8 lg:max-w-lg" style={{ marginTop: '28px' }}>
                    <button
                      className="bg-[#E3D4C2] shadow hover:bg-[#A27D4C] transition-colors flex items-center justify-center"
                      style={{ width: '48px', height: '48px', borderRadius: '50%', pointerEvents: 'auto' }}
                      onClick={handlePrev}
                      aria-label="Previous video"
                    >
                      <FaChevronLeft size={20} className="text-[#654C37]" />
                    </button>
                    <button
                      className="bg-[#E3D4C2] shadow hover:bg-[#A27D4C] transition-colors flex items-center justify-center"
                      style={{ width: '48px', height: '48px', borderRadius: '50%', pointerEvents: 'auto' }}
                      onClick={handleNext}
                      aria-label="Next video"
                    >
                      <FaChevronRightIcon size={20} className="text-[#654C37]" />
                    </button>
                  </div>
                  <span className="sr-only">Recipe video carousel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator - Consistent absolute positioning at bottom of hero */}
          <div className="absolute inset-x-0 z-30 flex justify-center pointer-events-none animate-bounce reduced-motion bottom-2 sm:bottom-4 md:bottom-6">
            <div className="flex flex-col items-center gap-1 text-black sm:gap-2">
              <FaChevronDown className="text-lg sm:text-xl md:text-2xl" aria-hidden="true" />
            </div>
          </div>
        </SectionWrapper>

      {/* First Section: Just Starting Out + Beginner Carousel */}
      <SectionWrapper
        bg="bg-[#d3c1b0]"
        topDivider="slope"
        contentClassName="pt-16 pb-4 sm:pt-20 sm:pb-6"
      >

        {/* Beginners Section */}
        <div className="mb-8">
          <div className="flex flex-col items-center gap-3 mb-6 text-center">
            <h3 className="text-2xl font-bold text-[#654C37]">Just Starting Out</h3>
            <span className="text-sm text-black">• Simple recipes for beginners</span>
          </div>
          {/* Beginner Recipe Carousel */}
          <div className="mb-8" role="region" aria-label="Beginner recipes carousel">
            <RecipeCarousel 
              recipes={placeholderBeginnerRecipes}
              onRecipeClick={setSelectedRecipe}
              carouselId="beginner-recipes"
            />
          </div>

          {/* Additional beginner recipes from data (if any) - in grid format */}
          {categorizedRecipes.beginners.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categorizedRecipes.beginners
                .filter(recipe => recipe.title.toLowerCase().includes(search.toLowerCase()))
                .map(recipe => (
                  <RecipeCard
                    key={recipe.slug}
                    title={recipe.title}
                    previewImage={recipe.images[0]}
                    category={recipe.category}
                    label={recipe.label}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Second Section: Search + Categories */}
      <SectionWrapper
        bg="bg-[#cbb6a6]"
        topDivider="waves"
        dividerColor="text-[#d3c1b0]"
        contentClassName="pt-32 pb-10 sm:pt-36 sm:pb-12"
      >

        {/* Main Search Bar */}
        <div className="w-full flex items-center bg-[#E3D4C2] rounded-lg shadow px-4 py-2 mb-6 sticky top-0 z-10">
          <FaSearch className="text-[#654C37] mr-2" />
          <input
            type="text"
            placeholder="Search all recipes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-lg text-black placeholder-[#8F907E]"
            aria-label="Search all recipes"
          />
        </div>

        {/* Folder Categories */}
        <div className="space-y-6">
          {folderCategories.map(folder => {
            const folderRecipes = categorizedRecipes[folder.id as keyof typeof categorizedRecipes] || [];
            const filteredRecipes = filterRecipesInFolder(folderRecipes, folder.id);
            const isOpen = openFolders.has(folder.id);
            const folderSearch = folderSearches[folder.id] || '';

            return (
              <div key={folder.id} className="bg-[#E3D4C2] rounded-lg shadow-lg overflow-hidden">
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#A27D4C] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{folder.icon}</span>
                    <span className="text-xl font-semibold text-[#654C37]">{folder.name}</span>
                    <span className="text-sm text-black">({filteredRecipes.length} recipes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOpen ? <FaFolderOpen className="text-[#654C37]" /> : <FaFolder className="text-[#654C37]" />}
                    {isOpen ? <FaChevronDown className="text-[#654C37]" /> : <FaChevronRight className="text-[#654C37]" />}
                  </div>
                </button>

                {/* Folder Content */}
                {isOpen && (
                  <div className="p-4 bg-white">
                    {/* Mini Search Bar */}
                    <div className="flex items-center bg-[#F5F5F5] rounded-lg px-3 py-2 mb-4">
                      <FaSearch className="text-[#654C37] mr-2" />
                      <input
                        type="text"
                        placeholder={`Search in ${folder.name}...`}
                        value={folderSearch}
                        onChange={e => updateFolderSearch(folder.id, e.target.value)}
                        className="w-full bg-transparent outline-none text-black placeholder-[#8F907E]"
                        aria-label={`Search in ${folder.name}`}
                      />
                    </div>

                    {/* Recipe Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {filteredRecipes.length === 0 ? (
                        <div className="py-8 text-center text-black col-span-full">
                          {folderSearch ? 'No recipes found matching your search.' : 'No recipes in this category yet.'}
                        </div>
                      ) : (
                        filteredRecipes
                          .filter(recipe => recipe.title.toLowerCase().includes(search.toLowerCase()))
                          .map(recipe => (
                            <RecipeCard
                              key={recipe.slug}
                              title={recipe.title}
                              previewImage={recipe.images[0]}
                              category={recipe.category}
                              label={recipe.label}
                              onClick={() => setSelectedRecipe(recipe)}
                            />
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionWrapper>

      {/* Carousel Modal */}
      <Modal isOpen={!!modalCarousel} onClose={() => setModalCarousel(null)}>
        {modalCarousel && (
          <div className="relative flex flex-col items-center w-full h-full">
            <h3 className="text-2xl font-bold mb-4 text-[#654C37]">{modalCarousel.title}</h3>
            <div className="w-full max-w-xs aspect-[9/16] flex items-center justify-center">
              <iframe
                width="270"
                height="480"
                src={`https://www.youtube.com/embed/${modalCarousel.youtubeUrl.split('v=')[1]?.split('&')[0] || modalCarousel.id}`}
                title={modalCarousel.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
          </div>
        )}
      </Modal>

      {/* Recipe Modal */}
      <Modal isOpen={!!selectedRecipe} onClose={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <RecipeModalContent recipe={selectedRecipe} selectedImageIdx={selectedImageIdx} setSelectedImageIdx={setSelectedImageIdx} onClose={() => setSelectedRecipe(null)} />
        )}
      </Modal>

        </div>
      </div>
    </SectionLayout>
  );
};

// RecipeModalContent component
const RecipeModalContent: React.FC<{
  recipe: typeof recipes[0] | typeof placeholderBeginnerRecipes[0];
  selectedImageIdx: number;
  setSelectedImageIdx: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}> = ({ recipe, selectedImageIdx, setSelectedImageIdx, onClose }) => {
  // Check if this is a placeholder recipe (has ingredients and instructions)
  const isPlaceholderRecipe = 'ingredients' in recipe && 'instructions' in recipe;
  
  // Track which images have loaded successfully
  const [loadedImages, setLoadedImages] = useState<string[]>([]);

  // Helper function to get category color
  const getCategoryColor = (cat: string) => {
    const category = cat.toLowerCase();
    if (category.includes('meal') || category.includes('breakfast') || category.includes('lunch') || category.includes('dinner')) {
      return '#A27D4C'; // Meals
    } else if (category.includes('smoothie') || category.includes('shake')) {
      return '#B89178'; // Smoothies
    } else if (category.includes('dessert') || category.includes('sweet') || category.includes('treat')) {
      return '#E3D4C2'; // Desserts
    } else {
      return '#B89178'; // Default
    }
  };

  React.useEffect(() => {
    // Reset loaded images when recipe changes
    setLoadedImages([]);
  }, [recipe]);

  // Only show images that have loaded
  const handleImageLoad = (src: string) => {
    setLoadedImages(prev => prev.includes(src) ? prev : [...prev, src]);
  };
  const handleImageError = (src: string) => {
    setLoadedImages(prev => prev.filter(s => s !== src));
  };

  // Filtered images
  const images = recipe.images.filter(img => loadedImages.includes(img));
  const hasImages = images.length > 0;
  const currentIdx = hasImages ? Math.min(selectedImageIdx, images.length - 1) : 0;

  // Keyboard navigation: Left/Right to change image, Escape to close
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!hasImages) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedImageIdx(prev => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedImageIdx(prev => (prev + 1) % images.length);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasImages, images.length, onClose, setSelectedImageIdx]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-3xl font-bold text-[#654C37]">{recipe.title}</h2>
      </div>
      <div className="flex gap-4 mb-4">
        <span 
          className="inline-block px-2 py-1 text-xs font-medium rounded" 
          style={{ backgroundColor: getCategoryColor(recipe.category), color: '#FDFCFA' }}
        >
          {recipe.category}
        </span>
        <span className="px-3 py-1 bg-[#E3D4C2] text-[#654C37] text-sm rounded-full">{recipe.label}</span>
      </div>
      
      {isPlaceholderRecipe ? (
        // Placeholder recipe content
        <div className="w-full space-y-6">
          <div className="bg-[#E3D4C2] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#654C37] mb-4">Description</h3>
            <p className="text-[#383B26]">{recipe.description}</p>
          </div>
          
          <div className="bg-[#E3D4C2] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#654C37] mb-4">Ingredients</h3>
            <ul className="list-disc list-inside space-y-2 text-[#383B26]">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx}>{ingredient}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-[#E3D4C2] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#654C37] mb-4">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-[#383B26]">
              {recipe.instructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ol>
          </div>
          
          <div className="text-center text-[#654C37] mt-6">
            <p className="text-lg">Full recipe tutorial with images coming soon!</p>
          </div>
        </div>
      ) : (
        // Regular recipe content (existing code)
        <>
          {/* Large selected image */}
          {hasImages ? (
            <div className="flex justify-center w-full mb-4">
              <img
                src={images[currentIdx]}
                alt={`${recipe.title} step ${currentIdx + 1}`}
                className="rounded-xl max-h-[50vh] object-contain shadow-lg"
                style={{ maxWidth: '100%' }}
              />
            </div>
          ) : (
            <div className="w-full flex justify-center mb-4 text-[#654C37]">No images found for this recipe.</div>
          )}
          {/* Thumbnails */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {recipe.images.map((img, idx) => (
              <img
                key={img}
                src={img}
                alt={`Step ${idx + 1}`}
                className={`rounded-md h-20 w-20 object-cover cursor-pointer border-2 ${currentIdx === images.indexOf(img) ? 'border-[#B89178] scale-110 z-10' : 'border-transparent opacity-70 hover:opacity-100'}`}
                style={{ display: loadedImages.includes(img) ? 'block' : 'none' }}
                onClick={() => setSelectedImageIdx(images.indexOf(img))}
                onLoad={() => handleImageLoad(img)}
                onError={() => handleImageError(img)}
              />
            ))}
          </div>
          <div className="mt-6 text-center text-[#654C37]">
            <p className="text-lg">Step-by-step recipe tutorial coming soon!</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Recipes; 