/**
 * Storefront Product Data (Human-editable)
 *
 * - To add a product: add to the correct category's `products` array.
 * - `featured: true` will show in the featured section on the Storefront homepage.
 * - `tagline` is optional, shown under price in italics.
 * - `tags` is an array of filter keywords (e.g. ["dailyuse", "under20"])
 * - `testimonials` is an array of short testimonial strings (optional).
 * - All fields except `name`, `image`, `link`, and `price` are optional.
 */

export interface Product {
  name: string;
  image: string;
  link: string;
  price: string;
  alt: string;
  featured?: boolean;
  tagline?: string;
  tags?: string[];
  testimonials?: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  tileImage: string;
  products: Product[];
}

export const storefrontCategories: Category[] = [
  {
    id: "food",
    name: "Food",
    description: "Nourishing staples for your kitchen",
    tileImage: "/tiles/foodTile.jpg",
    products: [
      {
        name: "Yellowbird Organic Sriracha Hot Sauce",
        image: "/products/food_1.jpeg",
        link: "https://www.amazon.com/dp/B09JB56QSX?linkCode=ssc&tag=onamzalexigri-20&creativeASIN=B09JB56QSX&asc_item-id=amzn1.shoppablemedia.v1.3e6eb678-bee3-4f99-9c08-391e354b1037&ref_=aip_sf_cur_spv_ofs_d_asin",
        price: "$13.99",
        alt: "Bottle of Yellowbird Organic Sriracha Hot Sauce",
        featured: true,
        tagline: "This is my favorite go-to sauce for tacos or any Mexican-style dish!",
        tags: ["dailyuse", "under20"],
        testimonials: [
          "Adds the perfect kick to my breakfast burritos!",
          "I love that it's organic and not too sweet."
        ]
      },
    ],
  },
  {
    id: "healing",
    name: "Healing",
    description: "Mindful tools and natural remedies",
    tileImage: "/tiles/healingTile.jpg",
    products: [
      {
        name: "Castor Oil",
        image: "/products/healing_1.jpg",
        link: "https://www.amazon.com/dp/B0734849YK?linkCode=ssc&tag=onamzalexigri-20&creativeASIN=B0734849YK&asc_item-id=amzn1.shoppablemedia.v1.fb441202-e9aa-4f6a-8bc7-62cbff05e742&ref_=aip_sf_cur_spv_ofs_d_asin",
        price: "$9.99",
        alt: "Glass bottle of organic castor oil",
        featured: true,
        tagline: "A staple in my natural healing toolkit.",
        tags: ["favorites"],
        testimonials: []
      },
    ],
  },
  {
    id: "home",
    name: "Home",
    description: "Items to create a mindful space",
    tileImage: "/tiles/homeTile.jpg",
    products: [
      {
        name: "Emergency Stain Rescue Stain Remover Spray",
        image: "/products/home_1.jpg",
        link: "https://www.amazon.com/dp/B01LX1RIEV?linkCode=ssc&tag=onamzalexigri-20&creativeASIN=B01LX1RIEV&asc_item-id=amzn1.ideas.1DK4SOJAYDSVH&ref_=aip_sf_cur_spv_ofs_d_asin&th=1",
        price: "$13.99",
        alt: "White spray bottle of Emergency Stain Rescue",
        featured: false,
        tagline: "Works wonders on tough stains!",
        tags: ["under20"],
        testimonials: []
      },
    ],
  },
  {
    id: "personal-care",
    name: "Personal Care",
    description: "Daily essentials for skin and body",
    tileImage: "/tiles/personalTile.jpg",
    products: [
      {
        name: "By Rosie Jane Eau De Parfum (Missy)",
        image: "/products/personal_1.jpg",
        link: "https://www.amazon.com/dp/B0CXQ7148C?linkCode=ssc&tag=onamzalexigri-20&creativeASIN=B0CXQ7148C&asc_item-id=amzn1.shoppablemedia.v1.9887b823-7534-4ca6-a4f7-b0f6900d3417&ref_=aip_sf_cur_spv_ofs_d_asin&th=1",
        price: "$80.00",
        alt: "Glass bottle of By Rosie Jane Missy perfume",
        featured: true,
        tagline: "My signature scent for everyday wear.",
        tags: ["favorites"],
        testimonials: [
          "I get compliments every time I wear this!"
        ]
      },
    ],
  },
]; 