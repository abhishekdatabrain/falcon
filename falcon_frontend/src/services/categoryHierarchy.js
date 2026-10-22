/**
 * Falcon Dynamic 4-Level Category Hierarchy & Resolver Service
 * 
 * Hierarchy:
 * Level 1: Main Category (e.g., Grocery)
 * Level 2: Subcategory (e.g., Food & Staples)
 * Level 3: Sub-subcategory (e.g., Rice)
 * Level 4: Sub-sub-subcategory (e.g., Basmati Rice)
 */

export const FALCON_CATEGORIES_HIERARCHY = [
  {
    id: 'cat-l1-grocery',
    slug: 'grocery',
    level: 1,
    name_en: 'Grocery',
    name_ar: 'البقالة',
    image_url: '/categories/cat_groceries.jpg',
    banner: {
      desktop_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80',
      mobile_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
      tag_en: '100% FARM FRESH',
      tag_ar: 'طازج 100% من المزرعة',
      badge_en: 'BEST PRICE GUARANTEED',
      badge_ar: 'أفضل سعر مضمون',
      heading_en: 'Daily Grocery & Supermarket Essentials',
      heading_ar: 'البقالة اليومية ومستلزمات السوبرماركت',
      description_en: 'Explore our complete selection of fresh grocery essentials, pantry staples, organic goods, and daily household needs delivered to your doorstep in 30 minutes.',
      description_ar: 'استكشف تشكيلتنا الشاملة من البقالة الطازجة، المؤن الأساسية، والمنتجات العضوية التي تصل إلى باب منزلك في غضون 30 دقيقة.',
    },
    content: {
      short_desc_en: 'High quality daily grocery essentials directly from local farms and certified suppliers.',
      short_desc_ar: 'مستلزمات البقالة اليومية عالية الجودة مباشرة من المزارع المحلية والموردين المعتمدين.',
      features: [
        { label_en: 'Direct Farm Sourcing', label_ar: 'توريد مباشر من المزرعة' },
        { label_en: 'Cold-Chain Delivery', label_ar: 'توصيل مبرد ومضمون' },
        { label_en: 'Express 30-Min Delivery', label_ar: 'توصيل سريع خلال 30 دقيقة' },
        { label_en: '100% Quality Guarantee', label_ar: 'ضمان الجودة 100%' },
      ],
    },
    mock_products: [
      {
        id: 'g-prod-1',
        name_en: 'Extra Virgin Pure Olive Oil (1 Liter)',
        name_ar: 'زيت زيتون بكر ممتاز نقي (1 لتر)',
        brand: 'Falcon Reserve',
        price: 36.50,
        discount_price: 29.95,
        rating: 4.9,
        reviews_count: 342,
        stock_quantity: 45,
        is_best_seller: true,
        unit: '1 Liter Glass Bottle',
        img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop',
      },
      {
        id: 'g-prod-2',
        name_en: 'Farm Fresh Brown Eggs (30 Pack)',
        name_ar: 'بيض مزارع طازج بني (طبق 30 بيضة)',
        brand: 'Al-Watania Farms',
        price: 24.00,
        discount_price: 19.50,
        rating: 4.8,
        reviews_count: 512,
        stock_quantity: 60,
        is_best_seller: true,
        unit: '30 Fresh Eggs',
        img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop',
      },
      {
        id: 'g-prod-3',
        name_en: 'Pure Mountain Natural Honey (500g)',
        name_ar: 'عسل جبلي طبيعي نقي (500 جم)',
        brand: 'Al-Shifa',
        price: 52.00,
        discount_price: 42.00,
        rating: 4.9,
        reviews_count: 215,
        stock_quantity: 28,
        is_best_seller: false,
        unit: '500g Jar',
        img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop',
      },
      {
        id: 'g-prod-4',
        name_en: 'Organic Whole Milk Full Cream (2 Liters)',
        name_ar: 'حليب كامل الدسم عضوي (2 لتر)',
        brand: 'Almarai',
        price: 13.50,
        discount_price: 11.50,
        rating: 4.7,
        reviews_count: 420,
        stock_quantity: 110,
        is_best_seller: true,
        unit: '2 Liters',
        img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop',
      },
    ],
    children: [
      {
        id: 'cat-l2-food-staples',
        slug: 'food-staples',
        level: 2,
        name_en: 'Food & Staples',
        name_ar: 'الأغذية والمواد الأساسية',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
        banner: {
          desktop_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&auto=format&fit=crop&q=80',
          mobile_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
          tag_en: 'PANTRY ESSENTIALS',
          tag_ar: 'أساسيات المطبخ والمؤن',
          badge_en: 'PURITY & TASTE',
          badge_ar: 'نقاء وجودة لا تضاهى',
          heading_en: 'Food & Cooking Staples',
          heading_ar: 'الأغذية والمواد التموينية الأساسية',
          description_en: 'Stock your kitchen with high-grade daily grains, rice varieties, flours, lentils, and pulses selected from world-renowned producers.',
          description_ar: 'زوّد مطبخك بأجود أنواع الحبوب اليومية، الأرز الفاخر، الدقيق، والبقوليات المختارة بعناية من أفضل المزارع العالمية.',
        },
        content: {
          short_desc_en: 'Nutritious everyday staples, grains, and wholesome pantry ingredients.',
          short_desc_ar: 'مؤن ومكونات غذائية أساسية عالية القيمة الغذائية للاستخدام اليومي.',
          features: [
            { label_en: 'Rigorous Purity Tests', label_ar: 'فحوصات نقاء صارمة' },
            { label_en: 'Hygienically Packed', label_ar: 'تغليف صحي محكم' },
            { label_en: 'Family Value Sizes', label_ar: 'أحجام عائلية موفرة' },
            { label_en: 'Aged & Fresh Grain Stock', label_ar: 'حبوب معتقة وطازجة' },
          ],
        },
        mock_products: [
          {
            id: 'fs-prod-1',
            name_en: 'Chakki Fresh Whole Wheat Atta Flour (10 kg)',
            name_ar: 'طحين قمح كامل تشاكي طازج (10 كجم)',
            brand: 'Falcon Gold',
            price: 34.00,
            discount_price: 27.50,
            rating: 4.8,
            reviews_count: 219,
            stock_quantity: 80,
            is_best_seller: true,
            unit: '10 kg Sack',
            img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
          },
          {
            id: 'fs-prod-2',
            name_en: 'Organic Red Split Lentils (1 kg)',
            name_ar: 'عدس أحمر مجروش عضوي (1 كجم)',
            brand: 'Nature Choice',
            price: 9.50,
            discount_price: 7.95,
            rating: 4.7,
            reviews_count: 140,
            stock_quantity: 50,
            is_best_seller: false,
            unit: '1 kg Pouch',
            img: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop',
          },
          {
            id: 'fs-prod-3',
            name_en: 'Premium Golden Corn Oil (1.8 Liters)',
            name_ar: 'زيت ذرة نقي ذهبي ممتاز (1.8 لتر)',
            brand: 'Afia',
            price: 22.00,
            discount_price: 18.00,
            rating: 4.8,
            reviews_count: 310,
            stock_quantity: 75,
            is_best_seller: true,
            unit: '1.8 Liters',
            img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop',
          },
        ],
        children: [
          {
            id: 'cat-l3-rice',
            slug: 'rice',
            level: 3,
            name_en: 'Rice',
            name_ar: 'الأرز',
            image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
            banner: {
              desktop_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&auto=format&fit=crop&q=80',
              mobile_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
              tag_en: 'FINEST HARVEST',
              tag_ar: 'محصول استثنائي فاخر',
              badge_en: 'AROMATIC & AGED',
              badge_ar: 'معتق وعطري النكهة',
              heading_en: 'Rice & Specialty Grains',
              heading_ar: 'تشكيلة الأرز والحبوب المتخصصة',
              description_en: 'Discover premium aged Basmati, delicate Jasmine, everyday Sona Masoori, and nutrient-dense brown rice varieties for unforgettable meals.',
              description_ar: 'اكتشف أنواع الأرز البسمتي المعتق، أرز الياسمين الفاخر، سونا مسوري، والأرز الأسمر الغني بالألياف لتحضير أشهى المأكولات.',
            },
            content: {
              short_desc_en: 'Carefully sorted and aged grains with slender elongation and non-sticky texture.',
              short_desc_ar: 'حبوب منتقاة بعناية ومعتقة تمنحك حبات طويلة غير متلاصقة ونكهة غنية.',
              features: [
                { label_en: 'Extra Slender Grain', label_ar: 'حبات طويلة ورفيعة' },
                { label_en: 'Naturally Aged Grains', label_ar: 'معتق طبيعياً' },
                { label_en: 'Non-Sticky Fluffiness', label_ar: 'قوام نثري غير متلاصق' },
                { label_en: 'Flawless Aroma & Taste', label_ar: 'رائحة ونكهة زكية' },
              ],
            },
            mock_products: [
              {
                id: 'rice-prod-1',
                name_en: 'Al Walimah Style Sella Basmati Rice (5 kg)',
                name_ar: 'أرز الوليمة ستايل سيلا بسمتي (5 كجم)',
                brand: 'Al Walimah',
                price: 49.50,
                discount_price: 39.95,
                rating: 4.9,
                reviews_count: 580,
                stock_quantity: 65,
                is_best_seller: true,
                unit: '5 kg Bag',
                img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
              },
              {
                id: 'rice-prod-2',
                name_en: 'Abu Kass Indian Mazza Basmati Rice (10 kg)',
                name_ar: 'أرز أبو كاس بسمتي مزة هندي (10 كجم)',
                brand: 'Abu Kass',
                price: 88.00,
                discount_price: 74.50,
                rating: 4.9,
                reviews_count: 820,
                stock_quantity: 40,
                is_best_seller: true,
                unit: '10 kg Sack',
                img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
              },
              {
                id: 'rice-prod-3',
                name_en: 'Royal Thai Fragrant Jasmine Rice (5 kg)',
                name_ar: 'أرز ياسمين تايلاندي معطر رويال (5 كجم)',
                brand: 'Royal Umbrella',
                price: 42.00,
                discount_price: 35.00,
                rating: 4.8,
                reviews_count: 240,
                stock_quantity: 35,
                is_best_seller: false,
                unit: '5 kg Bag',
                img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
              },
            ],
            children: [
              {
                id: 'cat-l4-basmati-rice',
                slug: 'basmati-rice',
                level: 4,
                name_en: 'Basmati Rice',
                name_ar: 'أرز بسمتي',
                image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'ROYAL BASMATI SELECTION',
                  tag_ar: 'تشكيلة الأرز البسمتي الملكي',
                  badge_en: 'AGED 2+ YEARS',
                  badge_ar: 'معتق لأكثر من سنتين',
                  heading_en: 'Royal Basmati Rice Collection',
                  heading_ar: 'تشكيلة أرز بسمتي الملكي الفاخر',
                  description_en: 'The crown jewel of long-grain rice: authentic Himalayan and Punjab Basmati, aged over 24 months for maximum elongation, delicate sweetness, and signature fragrance.',
                  description_ar: 'درة تاج الأرز طويل الحبة: أرز بسمتي هيمالاي أصيل معتق لأكثر من سنتين ليمنحك حبة فائقة الطول ونكهة عطرية مثالية للكبسة والبرياني.',
                },
                content: {
                  short_desc_en: 'World-class extra long grain aged Basmati rice, ideal for Saudi Kabsa, Mandi, and Biryani banquets.',
                  short_desc_ar: 'أرز بسمتي فاخر وطويل الحبة مثالي لولائم الكبسة السعودية، المندي، والبرياني.',
                  features: [
                    { label_en: '2+ Years Naturally Aged', label_ar: 'معتق طبيعياً لأكثر من سنتين' },
                    { label_en: '2.5x Cooked Elongation', label_ar: 'يتضاعف طول الحبة 2.5 مرة' },
                    { label_en: 'Authentic Sweet Aroma', label_ar: 'نكهة عطرية أصيلة' },
                    { label_en: 'Zero Broken Grains', label_ar: 'خالٍ من الحبات المكسورة' },
                  ],
                },
                mock_products: [
                  {
                    id: 'bas-1',
                    name_en: 'Falcon Royal Reserve Aged Basmati Rice (5 kg)',
                    name_ar: 'أرز بسمتي ملكي فالكون ريزيرف معتق (5 كجم)',
                    brand: 'Falcon Reserve',
                    price: 54.00,
                    discount_price: 44.95,
                    purchase_price: 60.00,
                    rating: 4.9,
                    reviews_count: 672,
                    stock_quantity: 48,
                    is_best_seller: true,
                    unit: '5 kg Zipper Sack',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                    has_variants: true,
                    variants: [
                      { id: 'bas-1-1kg', name_en: '1 kg Pack', name_ar: 'عبوة 1 كجم', price: 12.00, discount_price: 9.95, stock_quantity: 30 },
                      { id: 'bas-1-5kg', name_en: '5 kg Bag', name_ar: 'كيس 5 كجم', price: 54.00, discount_price: 44.95, stock_quantity: 48 },
                      { id: 'bas-1-10kg', name_en: '10 kg Sack', name_ar: 'شوال 10 كجم', price: 98.00, discount_price: 84.50, stock_quantity: 20 },
                    ],
                  },
                  {
                    id: 'bas-2',
                    name_en: 'Al Shalan Mazza Long Grain Indian Basmati (10 kg)',
                    name_ar: 'أرز الشعلان بسمتي هندي مزة حبة طويلة (10 كجم)',
                    brand: 'Al Shalan',
                    price: 92.00,
                    discount_price: 79.50,
                    purchase_price: 99.00,
                    rating: 4.9,
                    reviews_count: 910,
                    stock_quantity: 32,
                    is_best_seller: true,
                    unit: '10 kg Hessian Sack',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                  },
                  {
                    id: 'bas-3',
                    name_en: 'Tilda Pure Original Basmati Rice (5 kg)',
                    name_ar: 'أرز تيلدا نقي أصلي بسمتي (5 كجم)',
                    brand: 'Tilda',
                    price: 68.00,
                    discount_price: 58.00,
                    purchase_price: 75.00,
                    rating: 4.8,
                    reviews_count: 320,
                    stock_quantity: 25,
                    is_best_seller: false,
                    unit: '5 kg Bag',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                  },
                  {
                    id: 'bas-4',
                    name_en: 'India Gate Classic Aged Basmati Rice (5 kg)',
                    name_ar: 'أرز بوابة الهند كلاسيك بسمتي معتق (5 كجم)',
                    brand: 'India Gate',
                    price: 62.00,
                    discount_price: 52.50,
                    purchase_price: 68.00,
                    rating: 4.8,
                    reviews_count: 480,
                    stock_quantity: 18,
                    is_best_seller: false,
                    unit: '5 kg Poly Bag',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                  },
                  {
                    id: 'bas-5',
                    name_en: 'Dawaat Extra Long Traditional Basmati (5 kg)',
                    name_ar: 'أرز دعوة تقليدي حبة طويلة إكسترا (5 كجم)',
                    brand: 'Daawat',
                    price: 58.00,
                    discount_price: 49.00,
                    purchase_price: 64.00,
                    rating: 4.7,
                    reviews_count: 195,
                    stock_quantity: 12,
                    is_best_seller: false,
                    unit: '5 kg Cloth Bag',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                  },
                ],
                children: [], // Level 4 has NO children
              },
              {
                id: 'cat-l4-jasmine-rice',
                slug: 'jasmine-rice',
                level: 4,
                name_en: 'Jasmine Rice',
                name_ar: 'أرز ياسمين',
                image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'THAI FRAGRANT RICE',
                  tag_ar: 'أرز تايلاندي معطر',
                  badge_en: 'NEW HARVEST AROMA',
                  badge_ar: 'محصول جديد زكي النكهة',
                  heading_en: 'Fragrant Jasmine Rice',
                  heading_ar: 'أرز الياسمين التايلاندي العطري',
                  description_en: 'Naturally aromatic, tender, and soft long-grain Jasmine rice grown in the fertile soils of Thailand.',
                  description_ar: 'أرز ياسمين تايلاندي ناعم وطري معطر طبيعياً لجميع الوصفات الآسيوية والأطباق اليومية.',
                },
                content: {
                  short_desc_en: 'Soft-textured fragrant rice with floral pandan undertones.',
                  short_desc_ar: 'أرز طري القوام بنكهة عطرية طبيعية فريدة.',
                  features: [
                    { label_en: 'Hom Mali Certified', label_ar: 'معتمد هوم مالي' },
                    { label_en: 'Tender Fluffy Texture', label_ar: 'قوام طري وخفيف' },
                  ],
                },
                mock_products: [
                  {
                    id: 'jas-1',
                    name_en: 'Royal Umbrella Premium Thai Jasmine Rice (5 kg)',
                    name_ar: 'أرز رويال أمبريلا ياسمين تايلاندي فاخر (5 كجم)',
                    brand: 'Royal Umbrella',
                    price: 44.00,
                    discount_price: 36.95,
                    rating: 4.8,
                    reviews_count: 210,
                    stock_quantity: 40,
                    is_best_seller: true,
                    unit: '5 kg Bag',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                  },
                ],
                children: [],
              },
              {
                id: 'cat-l4-sona-masoori',
                slug: 'sona-masoori',
                level: 4,
                name_en: 'Sona Masoori Rice',
                name_ar: 'أرز سونا مسوري',
                image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'MEDIUM GRAIN VALUE',
                  tag_ar: 'أرز متوسط الحبة اقتصادي',
                  badge_en: 'EASY TO DIGEST',
                  badge_ar: 'خفيف وسهل الهضم',
                  heading_en: 'Sona Masoori Everyday Rice',
                  heading_ar: 'أرز سونا مسوري للاستخدام اليومي',
                  description_en: 'Lightweight, low-starch medium-grain rice perfect for everyday wholesome lunches.',
                  description_ar: 'أرز خفيف وقليل النشا متوسط الحبة مثالي للوجبات العائلية اليومية.',
                },
                content: {
                  short_desc_en: 'Aromatic medium grain with delicate texture and low starch content.',
                  short_desc_ar: 'حبة متوسطة خفيفة ومناسبة للحميات الغذائية اليومية.',
                  features: [
                    { label_en: 'Low Calorie & Starch', label_ar: 'قليل النشا والسعرات' },
                    { label_en: 'Daily Healthy Staple', label_ar: 'وجبة يومية صحية' },
                  ],
                },
                mock_products: [
                  {
                    id: 'sona-1',
                    name_en: 'Punarvasu Premium Sona Masoori Rice (10 kg)',
                    name_ar: 'أرز بونارفاسو سونا مسوري فاخر (10 كجم)',
                    brand: 'Punarvasu',
                    price: 49.00,
                    discount_price: 41.50,
                    rating: 4.7,
                    reviews_count: 140,
                    stock_quantity: 35,
                    is_best_seller: false,
                    unit: '10 kg Bag',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                  },
                ],
                children: [],
              },
              {
                id: 'cat-l4-brown-rice',
                slug: 'brown-rice',
                level: 4,
                name_en: 'Brown & Organic Rice',
                name_ar: 'الأرز الأسمر والعضوي',
                image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'WHOLE GRAIN HEALTH',
                  tag_ar: 'حبوب كاملة صحية',
                  badge_en: 'HIGH FIBER & PROTEIN',
                  badge_ar: 'غني بالألياف والبروتين',
                  heading_en: 'Organic Brown Rice',
                  heading_ar: 'الأرز الأسمر العضوي عالي الألياف',
                  description_en: 'Nutrient-rich, unpolished whole grain rice packed with natural minerals and dietary fiber.',
                  description_ar: 'أرز أسمر غير مقشور يحتفظ بكامل قيمته الغذائية الطبيعية والألياف المفيدة لصحتك.',
                },
                content: {
                  short_desc_en: 'Nutty flavor with 100% whole grain bran intact.',
                  short_desc_ar: 'نكهة جوزية لذيذة مع قشرة الحبة الكاملة 100%.',
                  features: [
                    { label_en: '100% Whole Grain', label_ar: 'حبوب كاملة 100%' },
                    { label_en: 'Low Glycemic Index', label_ar: 'مؤشر جلايسيمي منخفض' },
                  ],
                },
                mock_products: [
                  {
                    id: 'br-1',
                    name_en: 'Falcon Organic Brown Basmati Rice (2 kg)',
                    name_ar: 'أرز أسمر بسمتي عضوي فالكون (2 كجم)',
                    brand: 'Falcon Organic',
                    price: 28.00,
                    discount_price: 23.50,
                    rating: 4.9,
                    reviews_count: 175,
                    stock_quantity: 24,
                    is_best_seller: false,
                    unit: '2 kg Pouch',
                    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop',
                  },
                ],
                children: [],
              },
            ],
          },
          {
            id: 'cat-l3-flours-grains',
            slug: 'flours-grains',
            level: 3,
            name_en: 'Flours & Grains',
            name_ar: 'الدقيق والحبوب',
            image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
            banner: {
              desktop_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&auto=format&fit=crop&q=80',
              mobile_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
              tag_en: 'STONE GROUND FLOURS',
              tag_ar: 'طحين مطحون بالحجر',
              badge_en: '100% PURE WHOLE WHEAT',
              badge_ar: 'قمح كامل نقي 100%',
              heading_en: 'Flours & Milling Grains',
              heading_ar: 'الدقيق وحبوب الخبز والمخبوزات',
              description_en: 'Finely milled whole wheat atta, all-purpose flour, semolina, and specialized baking grains for traditional breads and pastries.',
              description_ar: 'طحين قمح كامل فاخر، دقيق متعدد الاستخدامات، سميد، وحبوب خبز متخصصة لمخبوزات منزلية هشة وشهية.',
            },
            content: {
              short_desc_en: 'Premium flours with rich gluten structure and natural wheat aroma.',
              short_desc_ar: 'دقيق فاخر بنسبة بروتين ممتازة ورائحة القمح الطبيعي الطازج.',
              features: [
                { label_en: 'Chakki Fresh Ground', label_ar: 'طحن مطحنة تقليدية طازج' },
                { label_en: 'Zero Added Bleach', label_ar: 'خالٍ من المبيضات الكيميائية' },
              ],
            },
            mock_products: [
              {
                id: 'flour-1',
                name_en: 'Falcon All Purpose Premium Flour (5 kg)',
                name_ar: 'طحين فاخر لجميع الاستعمالات فالكون (5 كجم)',
                brand: 'Falcon Bake',
                price: 18.00,
                discount_price: 14.50,
                rating: 4.8,
                reviews_count: 154,
                stock_quantity: 60,
                is_best_seller: true,
                unit: '5 kg Bag',
                img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
              },
            ],
            children: [
              {
                id: 'cat-l4-whole-wheat-flour',
                slug: 'whole-wheat-flour',
                level: 4,
                name_en: 'Whole Wheat Atta',
                name_ar: 'طحين بر قمح كامل',
                image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'NATURAL WHOLE GRAIN',
                  tag_ar: 'قمح كامل طبيعي',
                  badge_en: 'HIGH FIBER & BRAN',
                  badge_ar: 'غني بالنخالة والألياف',
                  heading_en: 'Whole Wheat Atta Flour',
                  heading_ar: 'طحين البر والقمح الكامل الصحي',
                  description_en: 'Traditional stone-ground whole wheat atta flour retaining the natural germ and bran.',
                  description_ar: 'طحين بر تقليدي مطحون على الحجر مع الاحتفاظ بجنين القمح والنخالة المفيدة.',
                },
                content: {
                  short_desc_en: 'Soft rotis and healthy traditional breads.',
                  short_desc_ar: 'للخبز الصحي والروتي الطري.',
                  features: [],
                },
                mock_products: [],
                children: [],
              },
            ],
          },
          {
            id: 'cat-l3-lentils-pulses',
            slug: 'lentils-pulses',
            level: 3,
            name_en: 'Lentils & Pulses',
            name_ar: 'البقوليات والعدس',
            image_url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop',
            banner: {
              desktop_image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=1600&auto=format&fit=crop&q=80',
              mobile_image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80',
              tag_en: 'PROTEIN POWER',
              tag_ar: 'طاقة وبروتين نباتي',
              badge_en: 'UNPOLISHED & RAW',
              badge_ar: 'خام غير مصقول طبيعي',
              heading_en: 'Lentils, Beans & Pulses',
              heading_ar: 'تشكيلة العدس، الفول، والحبوب البقولية',
              description_en: 'Nutrient-rich red lentils, chickpeas, yellow moong, and hearty kidney beans for wholesome soups and stews.',
              description_ar: 'عدس أحمر، حمص، فول، وفاصولياء حمراء مغذية غنية بالبروتين النباتي لتحضير ألذ الشوربات والأطباق الشعبية.',
            },
            content: {
              short_desc_en: 'Clean, stone-free pulses rich in plant protein and dietary iron.',
              short_desc_ar: 'بقوليات نظيفة منتقاة خالية من الشوائب وغنية بالبروتين والحديد.',
              features: [],
            },
            mock_products: [],
            children: [
              {
                id: 'cat-l4-chickpeas-beans',
                slug: 'chickpeas-beans',
                level: 4,
                name_en: 'Chickpeas & Beans',
                name_ar: 'الحمص والفول',
                image_url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'MEDITERRANEAN STAPLES',
                  tag_ar: 'أساسيات المطبخ العربي',
                  badge_en: 'JUMBO SIZE CHICKPEAS',
                  badge_ar: 'حبات حمص جامبو كبيرة',
                  heading_en: 'Chickpeas & Fava Beans',
                  heading_ar: 'حمص حب وفول عريض فاخر',
                  description_en: 'Extra large premium chickpeas and fava beans for authentic hummus and foul mudammas.',
                  description_ar: 'حمص حب كبير وفول عريض ممتاز لتحضير أشهى أطباق الحمص والفول المدمس.',
                },
                content: {
                  short_desc_en: 'Plump and creamy texture when cooked.',
                  short_desc_ar: 'قوام كريمي وطعم لذيذ عند الطهي.',
                  features: [],
                },
                mock_products: [],
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'cat-l2-cooking-essentials',
        slug: 'cooking-essentials',
        level: 2,
        name_en: 'Cooking Essentials & Spices',
        name_ar: 'بهارات وتوابل الطبخ',
        image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop',
        banner: {
          desktop_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&auto=format&fit=crop&q=80',
          mobile_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
          tag_en: 'AROMATIC SPICES',
          tag_ar: 'توابل شرقية زكية',
          badge_en: 'AUTHENTIC SAUDI BLENDS',
          badge_ar: 'خلطات سعودية أصلية',
          heading_en: 'Herbs, Spices & Seasonings',
          heading_ar: 'الأعشاب، التوابل والبهارات العطرية',
          description_en: 'Cardamom, saffron, cinnamon, black pepper, and authentic Kabsa spice mixes to elevate your culinary creations.',
          description_ar: 'هيل، زعفران نقي، قرفة، فلفل أسود، وبهارات الكبسة الأصلية لإضفاء نكهة لا تقاوم على أطباقك.',
        },
        content: {
          short_desc_en: 'Freshly ground spices and fragrant whole aromatics.',
          short_desc_ar: 'بهارات وتوابل مطحونة طازجة وأعشاب عطرية كاملة.',
          features: [],
        },
        mock_products: [],
        children: [
          {
            id: 'cat-l3-whole-spices',
            slug: 'whole-spices',
            level: 3,
            name_en: 'Whole Spices & Herbs',
            name_ar: 'بهارات وتوابل كاملة',
            image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop',
            banner: {
              desktop_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&auto=format&fit=crop&q=80',
              mobile_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
              tag_en: 'PURE WHOLE SPICES',
              tag_ar: 'بهارات حب كاملة',
              badge_en: 'UNGROUND AROMA',
              badge_ar: 'تحتفظ بكامل الزيوت العطرية',
              heading_en: 'Whole Spices Collection',
              heading_ar: 'مجموعة التوابل الحب الكاملة',
              description_en: 'Green cardamom, cloves, star anise, and whole cumin seeds.',
              description_ar: 'هيل أخضر أمريكي، قرنفل، نجمة يانسون، وحبوب كمون بلدي كاملة.',
            },
            content: { short_desc_en: 'Preserved essential oils for intense bursts of flavor.', short_desc_ar: 'تحتفظ بزيوتها العطرية لرائحة قوية وطعم أصيل.', features: [] },
            mock_products: [],
            children: [
              {
                id: 'cat-l4-cardamom-saffron',
                slug: 'cardamom-saffron',
                level: 4,
                name_en: 'Cardamom & Saffron',
                name_ar: 'الهيل والزعفران الفاخر',
                image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'ROYAL COFFEE & DISHES',
                  tag_ar: 'للقهوة السعودية والولائم',
                  badge_en: 'GRADE A EXTRA GREEN',
                  badge_ar: 'هيل أخضر فاخر نخب أول',
                  heading_en: 'Premium Cardamom & Pure Saffron',
                  heading_ar: 'هيل أخضر فاخر وزعفران نقيل ممتاز',
                  description_en: 'Jumbo extra green cardamom pods and Super Negin pure saffron threads.',
                  description_ar: 'حبوب هيل أخضر جامبو فاخر وخيوط زعفران نقيل أصلي للقهوة السعودية والضيافة الراقية.',
                },
                content: { short_desc_en: 'Supreme aroma for authentic Arabic coffee and celebratory feasts.', short_desc_ar: 'رائحة استثنائية للقهوة العربية والولائم الفاخرة.', features: [] },
                mock_products: [],
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'cat-l2-canned-goods',
        slug: 'canned-goods',
        level: 2,
        name_en: 'Canned Goods & Preserves',
        name_ar: 'المعلبات والأغذية المحفوظة',
        image_url: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&auto=format&fit=crop',
        banner: {
          desktop_image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=1600&auto=format&fit=crop&q=80',
          mobile_image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=800&auto=format&fit=crop&q=80',
          tag_en: 'PANTRY RESERVES',
          tag_ar: 'مؤن معلبة طويلة الأجل',
          badge_en: 'READY TO SERVE',
          badge_ar: 'جاهز للتقديم الفوري',
          heading_en: 'Canned Goods & Ready Pantry',
          heading_ar: 'المعلبات، التونة والخضار المحفوظ',
          description_en: 'Canned tuna, sweet corn, Italian crushed tomatoes, mushrooms, and olives.',
          description_ar: 'تونة خفيفة بزيت الزيتون، ذرة حلوة، طماطم إيطالية مقشرة، وفطر محفوظ عالي الجودة.',
        },
        content: { short_desc_en: 'Convenient canned essentials locked in freshness.', short_desc_ar: 'أطعمة معلبة عملية محفوظة بأعلى معايير الجودة والسلامة.', features: [] },
        mock_products: [],
        children: [],
      },
    ],
  },
  {
    id: 'cat-l1-fresh-produce',
    slug: 'fresh-produce',
    level: 1,
    name_en: 'Fresh Produce',
    name_ar: 'الخضار والفواكه الطازجة',
    image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop',
    banner: {
      desktop_image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1600&auto=format&fit=crop&q=80',
      mobile_image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
      tag_en: 'HARVESTED TODAY',
      tag_ar: 'حصاد اليوم الطازج',
      badge_en: '100% ORGANIC & CRISP',
      badge_ar: 'عضوي ومقرمش 100%',
      heading_en: 'Crisp Organic Vegetables & Seasonal Fruits',
      heading_ar: 'خضروات وفواكه موسمية طازجة من المزرعة',
      description_en: 'Freshly plucked tomatoes, leafy greens, berries, citrus fruits, and crunchy root vegetables with zero preservatives.',
      description_ar: 'طماطم طازجة، خضار ورقية، توتيات، حمضيات منعشة، وجذور مقرمشة خالية تماماً من المواد الحافظة.',
    },
    content: {
      short_desc_en: 'Daily farm pickups delivered with zero damage in climate-controlled trucks.',
      short_desc_ar: 'تصلكم يومياً بسيارات مبردة بدرجة حرارة محكمة لحفظ النضارة.',
      features: [
        { label_en: 'Daily Sunrise Farm Pick', label_ar: 'قطاف صباحي يومي من المزرعة' },
        { label_en: 'No Artificial Wax', label_ar: 'خالٍ من الشمع والمواد الكيميائية' },
      ],
    },
    mock_products: [],
    children: [],
  },
  {
    id: '17bac459-37d2-4c6d-a755-612734b98537',
    slug: 'frozen-items',
    level: 1,
    name_en: 'Frozen Items',
    name_ar: 'مجمدات',
    image_url: '/uploads/file-1791369100673-629022616.jpg',
    banner: {
      desktop_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=1600&auto=format&fit=crop&q=80',
      mobile_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&auto=format&fit=crop&q=80',
      tag_en: 'ICE COLD FRESHNESS',
      tag_ar: 'تجميد سريع يحفظ النكهة',
      badge_en: 'IQF INDIVIDUAL FREEZING',
      badge_ar: 'تقنية التجميد الفردي السريع',
      heading_en: 'Frozen Items & Quick Meals',
      heading_ar: 'الأطعمة والمجمدات الغذائية',
      description_en: 'Wholesome frozen vegetables, green peas, ready mixes, and specialty frozen items locked in at peak freshness.',
      description_ar: 'خضار مجمدة طازجة، بازلاء خضراء، خضار مشكل عالي الجودة ومجمد بأحدث تقنيات الحفظ.',
    },
    content: {
      short_desc_en: 'Individual Quick Frozen produce locked in at peak harvest ripeness.',
      short_desc_ar: 'منتجات مجمدة فردياً بتقنية سريعة لحفظ كامل الفيتامينات والنكهة الطازجة.',
      features: [
        { label_en: 'IQF Freshness Locked', label_ar: 'تقنية تجميد سريع' },
        { label_en: '100% Preservative Free', label_ar: 'خالٍ من المواد الحافظة' },
        { label_en: 'Ready to Cook', label_ar: 'جاهز للطهي الفوري' },
      ],
    },
    mock_products: [
      {
        id: 'froz-prod-1',
        name_en: 'Hayat Mix Frozen Vegetables (400g)',
        name_ar: 'خضار مشكل حياة مجمد (400 جم)',
        brand: 'Hayat',
        price: 8.50,
        discount_price: 6.95,
        rating: 4.8,
        reviews_count: 145,
        stock_quantity: 40,
        is_best_seller: true,
        unit: '400g Pack',
        img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop',
      },
      {
        id: 'froz-prod-2',
        name_en: 'Farm Green Garden Peas (450g)',
        name_ar: 'بازلاء خضراء حدائق كاليفورنيا (450 جم)',
        brand: 'California Garden',
        price: 9.00,
        discount_price: 7.50,
        rating: 4.9,
        reviews_count: 210,
        stock_quantity: 65,
        is_best_seller: true,
        unit: '450g Pouch',
        img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop',
      },
    ],
    children: [
      {
        id: '94aa8237-fe97-4748-812a-15a165438815',
        slug: 'frozen-vegetable',
        level: 2,
        name_en: 'Frozen Vegetable',
        name_ar: 'خضار مجمد',
        image_url: '/uploads/file-1791369277027-584898228.jpg',
        banner: {
          desktop_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=1600&auto=format&fit=crop&q=80',
          mobile_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&auto=format&fit=crop&q=80',
          tag_en: 'FARM FROZEN VEGGIES',
          tag_ar: 'خضار مزارع مجمدة',
          badge_en: 'NUTRIENT RICH',
          badge_ar: 'غنية بالعناصر الغذائية',
          heading_en: 'Farm Fresh Frozen Vegetables',
          heading_ar: 'تشكيلة الخضار المجمدة الطازجة',
          description_en: 'Selection of fresh cut carrots, corn, mixed veggies, and garden greens.',
          description_ar: 'مجموعة مختارة من الجزر، الذرة، الخضار المشكل والورقيات المجمدة بعناية.',
        },
        content: {
          short_desc_en: 'Steam, saute, or boil directly from frozen.',
          short_desc_ar: 'جاهزة للطهي والتبخير مباشرة دون الحاجة للإذابة.',
          features: [
            { label_en: 'Zero Food Waste', label_ar: 'بدون هدر غذائي' },
            { label_en: 'Nutrient Dense', label_ar: 'عالية القيمة الغذائية' },
          ],
        },
        mock_products: [
          {
            id: 'froz-veg-1',
            name_en: 'Hayat Mix Vegetable Selected (450g)',
            name_ar: 'خضار مشكل حياة منتقى (450 جم)',
            brand: 'Hayat',
            price: 8.50,
            discount_price: 6.95,
            rating: 4.8,
            reviews_count: 145,
            stock_quantity: 40,
            is_best_seller: true,
            unit: '450g Pack',
            img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop',
          },
        ],
        children: [
          {
            id: 'd5a51c03-893c-4afe-9afe-a0e42d1a3a7d',
            slug: 'mix-vegetable',
            level: 3,
            name_en: 'Mix Vegetable',
            name_ar: 'خضار مشكل',
            image_url: '/uploads/file-1791369404592-71637410.jpg',
            banner: {
              desktop_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=1600&auto=format&fit=crop&q=80',
              mobile_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&auto=format&fit=crop&q=80',
              tag_en: 'COLORFUL MEDLEY',
              tag_ar: 'مزيج خضار متوازن',
              badge_en: 'CHOPPED & READY',
              badge_ar: 'مقطع وجاهز للطهي',
              heading_en: 'Mix Vegetable Medley',
              heading_ar: 'تشكيلة خضار مشكل متكاملة',
              description_en: 'Perfect mix of peas, carrots, sweet corn, and green beans for fried rice, curries, and soups.',
              description_ar: 'مزيج متناسق من البازلاء، الجزر، الذرة والفاصولياء الخضراء لجميع الأطباق.',
            },
            content: {
              short_desc_en: 'Pre-washed, chopped and steam-ready.',
              short_desc_ar: 'مغسول ومقطع وجاهز للطهي بالبخار أو الإضافة المباشرة للطبخ.',
              features: [],
            },
            mock_products: [
              {
                id: 'mix-veg-1',
                name_en: 'Hayat Mix Vegetable Family Size (900g)',
                name_ar: 'خضار مشكل حياة حجم عائلي (900 جم)',
                brand: 'Hayat',
                price: 15.00,
                discount_price: 12.50,
                rating: 4.9,
                reviews_count: 88,
                stock_quantity: 35,
                is_best_seller: true,
                unit: '900g Pack',
                img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop',
              },
            ],
            children: [
              {
                id: '44977349-e219-480f-b4a7-ca5561481ede',
                slug: 'hayat-mix-vegetable',
                level: 4,
                name_en: 'Hayat Mix Vegetable',
                name_ar: 'خضار مشكل حياة',
                image_url: '/uploads/file-1791369550909-527992368.jpg',
                banner: {
                  desktop_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=1600&auto=format&fit=crop&q=80',
                  mobile_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&auto=format&fit=crop&q=80',
                  tag_en: 'PREMIUM BRAND SELECTION',
                  tag_ar: 'اختيار حياة الممتاز',
                  badge_en: 'TOP RATED QUALITY',
                  badge_ar: 'الأعلى تقييماً وجودة',
                  heading_en: 'Hayat Mix Vegetable Collection',
                  heading_ar: 'تشكيلة خضار مشكل حياة الفاخرة',
                  description_en: 'Signature blend of tender green peas, baby carrots, and sweet kernels from Hayat.',
                  description_ar: 'خلطة حياة المميزة من البازلاء الطرية، الجزر الصغير، وحبات الذرة الحلوة عالية الجودة.',
                },
                content: {
                  short_desc_en: 'Tender and sweet whole vegetable pieces.',
                  short_desc_ar: 'قطع خضار كاملة ومقرمشة ومحفوظة بعناية فائقة.',
                  features: [
                    { label_en: 'Hayat Gold Quality', label_ar: 'جودة حياة الذهبية' },
                    { label_en: '100% Natural Harvest', label_ar: 'حصاد طبيعي 100%' },
                  ],
                },
                mock_products: [
                  {
                    id: 'hayat-1',
                    name_en: 'Hayat Mixed Vegetables (400g Pouch)',
                    name_ar: 'خضار مشكل حياة كيس (400 جم)',
                    brand: 'Hayat',
                    price: 8.50,
                    discount_price: 6.95,
                    rating: 4.9,
                    reviews_count: 140,
                    stock_quantity: 50,
                    is_best_seller: true,
                    unit: '400g Pouch',
                    img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop',
                  },
                ],
                children: [], // Level 4 has NO children
              },
            ],
          },
        ],
      },
      {
        id: '601a3344-8418-408b-8488-3c3008423b25',
        slug: 'pea',
        level: 2,
        name_en: 'Pea',
        name_ar: 'بزالية',
        image_url: '/uploads/file-1791369649920-296947700.jpg',
        banner: {
          desktop_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=1600&auto=format&fit=crop&q=80',
          mobile_image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&auto=format&fit=crop&q=80',
          tag_en: 'SWEET GREEN PEAS',
          tag_ar: 'بازلاء خضراء حلوة',
          badge_en: 'GARDEN FRESH',
          badge_ar: 'طازجة من الحقل',
          heading_en: 'Tender Sweet Green Peas',
          heading_ar: 'بازلاء خضراء طرية وحلوة المذاق',
          description_en: 'Naturally sweet and tender green peas, flash frozen within hours of picking.',
          description_ar: 'بازلاء خضراء حلوة المذاق ومجمدة سريعاً خلال ساعات قليلة من القطاف.',
        },
        content: {
          short_desc_en: 'Sweet petite garden peas rich in vitamins.',
          short_desc_ar: 'بازلاء خضراء غنية بالفيتامينات والمعادن الطبيعية.',
          features: [],
        },
        mock_products: [
          {
            id: 'pea-prod-1',
            name_en: 'Green Giant Sweet Garden Peas (450g)',
            name_ar: 'بازلاء خضراء حلوة العملاق الأخضر (450 جم)',
            brand: 'Green Giant',
            price: 9.50,
            discount_price: 7.95,
            rating: 4.8,
            reviews_count: 95,
            stock_quantity: 30,
            is_best_seller: true,
            unit: '450g Pack',
            img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop',
          },
        ],
        children: [],
      },
    ],
  },
];

/**
 * Resolves a category node from path segments:
 * e.g., ['grocery', 'food-staples', 'rice', 'basmati-rice']
 * Also handles single slugs e.g., ['basmati-rice'] or ['rice'].
 * Returns { category, breadcrumbTrail, level, parentCategory, childCategories, cumulativePath }
 */
export function resolveCategoryFromHierarchy(slugSegments = []) {
  if (!slugSegments || slugSegments.length === 0) {
    const defaultCat = FALCON_CATEGORIES_HIERARCHY[0];
    return {
      category: defaultCat,
      level: 1,
      breadcrumbTrail: [{ name_en: defaultCat.name_en, name_ar: defaultCat.name_ar, slug: defaultCat.slug, path: `/category/${defaultCat.slug}`, level: 1 }],
      parentCategory: null,
      childCategories: defaultCat.children || [],
      cumulativePath: `/category/${defaultCat.slug}`,
    };
  }

  // 1. First attempt: Walk sequentially through the segments
  let currentLevelList = FALCON_CATEGORIES_HIERARCHY;
  const trail = [];
  let currentCat = null;
  let parentCat = null;
  let builtPath = '/category';
  let matchedAll = true;

  for (let i = 0; i < slugSegments.length; i++) {
    const seg = slugSegments[i].toLowerCase();
    const found = currentLevelList.find((c) => c.slug.toLowerCase() === seg || c.id === seg);
    if (found) {
      builtPath += `/${found.slug}`;
      trail.push({
        name_en: found.name_en,
        name_ar: found.name_ar,
        slug: found.slug,
        path: builtPath,
        level: found.level,
      });
      parentCat = currentCat;
      currentCat = found;
      currentLevelList = found.children || [];
    } else {
      matchedAll = false;
      break;
    }
  }

  if (matchedAll && currentCat) {
    return {
      category: currentCat,
      level: currentCat.level,
      breadcrumbTrail: trail,
      parentCategory: parentCat,
      childCategories: currentCat.children || [],
      cumulativePath: builtPath,
    };
  }

  // 2. Second attempt: Deep search by target slug (e.g. if single slug or partial URL given)
  const targetSlug = slugSegments[slugSegments.length - 1].toLowerCase();
  const searchResult = findCategoryDeep(FALCON_CATEGORIES_HIERARCHY, targetSlug);

  if (searchResult) {
    return searchResult;
  }

  // 3. Third attempt: Return null (category not found)
  return null;
}

/**
 * Recursive deep search through hierarchy tree
 */
function findCategoryDeep(categories, targetSlug, parentTrail = []) {
  for (const cat of categories) {
    const isMatch = cat.slug.toLowerCase() === targetSlug || cat.id === targetSlug;
    const currentPath = parentTrail.length > 0
      ? `${parentTrail[parentTrail.length - 1].path}/${cat.slug}`
      : `/category/${cat.slug}`;

    const trailItem = {
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      slug: cat.slug,
      path: currentPath,
      level: cat.level,
    };

    const currentTrail = [...parentTrail, trailItem];

    if (isMatch) {
      return {
        category: cat,
        level: cat.level,
        breadcrumbTrail: currentTrail,
        parentCategory: parentTrail.length > 0 ? parentTrail[parentTrail.length - 1] : null,
        childCategories: cat.children || [],
        cumulativePath: currentPath,
      };
    }

    if (Array.isArray(cat.children) && cat.children.length > 0) {
      const deepRes = findCategoryDeep(cat.children, targetSlug, currentTrail);
      if (deepRes) return deepRes;
    }
  }
  return null;
}

/**
 * Merge an API category from backend DB with mock hierarchy node
 * Ensures zero disruption to real API data while filling rich banners & mock hierarchy
 */
export function mergeCategoryData(apiCategory, hierarchyCategory) {
  if (!apiCategory && !hierarchyCategory) return null;
  if (!apiCategory) return hierarchyCategory;

  const hasDbBanner = apiCategory.banner && typeof apiCategory.banner === 'object' && Object.keys(apiCategory.banner).length > 0;
  const hasDbContent = apiCategory.content && typeof apiCategory.content === 'object' && Object.keys(apiCategory.content).length > 0;

  const baseBanner = hasDbBanner
    ? {
      ...apiCategory.banner,
      heading_en: apiCategory.banner.heading_en || apiCategory.name_en,
      heading_ar: apiCategory.banner.heading_ar || apiCategory.name_ar || apiCategory.name_en,
      desktop_image: apiCategory.banner.desktop_image || apiCategory.image_url,
    }
    : (hierarchyCategory?.banner || {
      desktop_image: apiCategory.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600',
      mobile_image: apiCategory.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      tag_en: 'FEATURED CATEGORY',
      tag_ar: 'تصنيف مميز',
      badge_en: 'FARM FRESH GUARANTEE',
      badge_ar: 'ضمان طازج من المزرعة',
      heading_en: apiCategory.name_en,
      heading_ar: apiCategory.name_ar || apiCategory.name_en,
      description_en: apiCategory.description_en || apiCategory.description || 'Explore our selection of premium quality items delivered directly to your door.',
      description_ar: apiCategory.description_ar || apiCategory.description || 'استكشف تشكيلتنا المختارة بعناية بأعلى معايير الجودة وتوصيل مباشر إلى باب منزلك.',
    });

  const baseContent = hasDbContent
    ? apiCategory.content
    : (hierarchyCategory?.content || {
      short_desc_en: apiCategory.description_en || apiCategory.description || '',
      short_desc_ar: apiCategory.description_ar || apiCategory.description || '',
      features: [
        { label_en: '100% Quality Guaranteed', label_ar: 'ضمان الجودة 100%' },
        { label_en: 'Fast Doorstep Delivery', label_ar: 'توصيل سريع لباب المنزل' },
      ],
    });

  if (!hierarchyCategory) {
    return {
      id: apiCategory.id,
      slug: apiCategory.slug,
      level: 1,
      name_en: apiCategory.name_en,
      name_ar: apiCategory.name_ar || apiCategory.name_en,
      image_url: apiCategory.image_url,
      banner: baseBanner,
      content: baseContent,
      children: Array.isArray(apiCategory.subcategories) ? apiCategory.subcategories : [],
      mock_products: [],
    };
  }

  // Merge: Prioritize real DB fields (names, id, real subcategories if present)
  // Fill banners, descriptions, and mock products from hierarchy
  const mergedChildren = (Array.isArray(apiCategory.subcategories) && apiCategory.subcategories.length > 0)
    ? apiCategory.subcategories.map((apiSub) => {
      const matchInMock = (hierarchyCategory.children || []).find((c) => c.slug === apiSub.slug);
      return mergeCategoryData(apiSub, matchInMock);
    })
    : hierarchyCategory.children || [];

  return {
    ...hierarchyCategory,
    ...apiCategory,
    id: apiCategory.id || hierarchyCategory.id,
    slug: apiCategory.slug || hierarchyCategory.slug,
    name_en: apiCategory.name_en || hierarchyCategory.name_en,
    name_ar: apiCategory.name_ar || hierarchyCategory.name_ar,
    image_url: apiCategory.image_url || hierarchyCategory.image_url,
    level: hierarchyCategory.level || 1,
    banner: baseBanner,
    content: baseContent,
    children: mergedChildren,
    mock_products: hierarchyCategory.mock_products || [],
  };
}

/**
 * Extracts dynamic breadcrumbs and category level by walking up parentCategory relationships from API response
 */
export function extractBreadcrumbTrailFromApiCategory(apiCategory) {
  if (!apiCategory) return null;

  const chain = [];
  let curr = apiCategory.parentCategory;
  while (curr) {
    chain.unshift({
      name_en: curr.name_en,
      name_ar: curr.name_ar,
      slug: curr.slug,
      id: curr.id,
    });
    curr = curr.parentCategory;
  }

  chain.push({
    name_en: apiCategory.name_en,
    name_ar: apiCategory.name_ar,
    slug: apiCategory.slug,
    id: apiCategory.id,
  });

  let runningPath = '/category';
  const trail = chain.map((item, idx) => {
    runningPath += `/${item.slug}`;
    return {
      name_en: item.name_en,
      name_ar: item.name_ar,
      slug: item.slug,
      path: runningPath,
      level: idx + 1,
    };
  });

  return {
    trail,
    level: chain.length,
    cumulativePath: runningPath,
  };
}

