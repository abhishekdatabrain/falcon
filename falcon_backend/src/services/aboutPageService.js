const { AboutPageSetting } = require('../models');

let seeded = false;
let seedPromise = null;

const DEFAULT_ABOUT_CONTENT = {
  hero_section: {
    badge_en: 'Our Story & Mission',
    badge_ar: 'قصتنا ومهمتنا',
    title_en: 'Rooted in Freshness,\nDelivered to Your\nDoorstep.',
    title_ar: 'جذور ممتدة في الطزاجة، تصل إلى باب منزلك.',
    paragraph1_en:
      "Empowering Saudi households with fresh, sustainable, farm-to-table groceries delivered in as little as 30 minutes. Founded in the heart of Riyadh, SaqrCart was born from a fundamental question: why should fresh food spend two weeks in static cold-storage depots before reaching your family's dinner table?",
    paragraph1_ar:
      'تمكين العائلات السعودية بمقاضي طازجة ومستدامة من المزرعة إلى المائدة مباشرة في غضون 30 دقيقة. انطلقت صقر كارت من قلب الرياض بناءً على سؤال جوهري: لماذا تقضي الأغذية الطازجة أسبوعين في مستودعات التبريد التقليدية قبل أن تصل لمائدة عائلتك؟',
    paragraph2_en:
      'We bridged the gap by partnering directly with local Saudi hydroponic cultivators, traditional date growers, and modern agricultural cooperatives across Al-Kharj to Al-Jouf — delivering produce harvested that very morning straight to your kitchen.',
    paragraph2_ar:
      'لقد جسّرنا الفجوة بالشراكة المباشرة مع مزارعي الهيدروبونيك المحليين في الرياض، ومزارعي التمور التقليديين، والتعاونيات الزراعية الحديثة من الخرج إلى الجوف — لنقدم لك منتجات حُصدت في ذات الصباح مباشرة إلى مطبخك.',
    primary_btn_en: 'Explore Farm Partners',
    primary_btn_ar: 'استكشف شركاء المزارع',
    primary_btn_url: '/products',
    secondary_btn_en: 'Our Quality Standard',
    secondary_btn_ar: 'معايير الجودة لدينا',
    secondary_btn_url: '#standards',
    image_url: '/images/about/greenhouse.jpg',
    top_badge_label_en: 'Verified Quality',
    top_badge_label_ar: 'جودة موثقة',
    top_badge_value_en: '100% Cold-Chain',
    top_badge_value_ar: 'سلسلة تبريد 100%',
    bottom_card_title_en: 'Dawn Harvest to Doorstep',
    bottom_card_title_ar: 'من الحصاد الفوري إلى بابك',
    bottom_card_subtitle_en: 'Under 12 hours guaranteed farm-to-hand time',
    bottom_card_subtitle_ar: 'أقل من 12 ساعة من المزرعة للمستهلك',
    bottom_card_badge_en: 'GUARANTEED',
    bottom_card_badge_ar: 'مضمون',
  },
  stats_section: [
    {
      icon: 'truck',
      value: '2M+',
      title_en: 'Fresh Orders Delivered',
      title_ar: 'طلبات طازجة تم توصيلها',
      description_en: 'Across Riyadh, Jeddah, Khobar, Dammam & 12 other urban hubs.',
      description_ar: 'عبر الرياض، جدة، الخبر، الدمام و12 مدينة أخرى.',
    },
    {
      icon: 'leaf',
      value: '250+',
      title_en: 'Local Farm Partners',
      title_ar: 'مزرعة شريكة محلية',
      description_en: 'Certified organic and hydroponic Saudi growers under direct contract.',
      description_ar: 'مزارع هيدروبونيك وعضوية سعودية معتمدة بعقود مباشرة.',
    },
    {
      icon: 'clock',
      value: '< 12h',
      title_en: 'Harvest-to-Door Speed',
      title_ar: 'سرعة التوصيل بعد الحصاد',
      description_en: 'Morning pick to afternoon delivery, keeping nutrients fully intact.',
      description_ar: 'من قطف الصباح إلى بابك بعد الظهر مع الحفاظ الكامل على المغذيات.',
    },
    {
      icon: 'star',
      value: '99.4%',
      title_en: 'Freshness Satisfaction',
      title_ar: 'نسبة رضا الطزاجة',
      description_en: 'Measured by verified Saudi customer reviews and freshness index.',
      description_ar: 'مقاسة بتقييمات العملاء الموثقة ومؤشر جودة المحصول اليومي.',
    },
  ],
  principles_section: {
    badge_en: 'GUIDING PRINCIPLES',
    badge_ar: 'مبادئنا الأساسية',
    title_en: 'The Principles That Guide Every Basket',
    title_ar: 'المبادئ التي تقود كل سلة مقاضي',
    subtitle_en: 'Every apple, bottle of milk, and head of crisp romaine is handled according to four non-negotiable operational standards.',
    subtitle_ar: 'كل تفاحة، علبة حليب، ورأس خس تخضع لأربعة معايير تشغيلية صارمة لا تقبل المساومة.',
    cards: [
      {
        icon: 'shield',
        step_label: '01. QUALITY PROTOCOL',
        title_en: 'Uncompromised Freshness',
        title_ar: 'طزاجة لا تقبل المساومة',
        description_en: "Every shipment passes a mandatory 17-point physical freshness inspection prior to dispatch. If a leaf isn't crisp or a fruit shows blemishes, it never enters your grocery bag.",
        description_ar: 'تخضع كل شحنة لفحص جودة يدوي وإلكتروني إلزامي يشمل 17 نقطة قبل الانطلاق. إذا وُجد أي عيب، لا يدخل المنتج سلتك أبداً.',
        link_label_en: '17-Point Visual Check',
        link_label_ar: 'بروتوكول فحص الـ 17 نقطة',
        link_url: '#standards',
      },
      {
        icon: 'users',
        step_label: '02. ECONOMIC IMPACT',
        title_en: 'Championing Local Growers',
        title_ar: 'دعم وتمكين المزارع المحلي',
        description_en: 'We sign direct, fair-value contracts that eliminate predatory commodity brokers. Our partners receive prompt settlements and predictable demand to invest back into their soil.',
        description_ar: 'نوقع عقوداً مباشرة بأسعار عادلة تتجاوز وسطاء التجارة التقليديين. يحصل شركاؤنا على تسويات مالية فورية وطلب مستدام لإعادة الاستثمار في أراضيهم.',
        link_label_en: 'Direct Fair Trade',
        link_label_ar: 'التجارة العادلة المباشرة',
        link_url: '#farmers',
      },
      {
        icon: 'recycle',
        step_label: '03. GREEN FLEET',
        title_en: 'Eco-Conscious Packaging',
        title_ar: 'تغليف صديق للبيئة',
        description_en: 'We use 100% recyclable cold-chain insulated totes and eliminated single-use polypropylene bags. Customer return program allows totes to be sanitized and reused.',
        description_ar: 'نستخدم حاويات عازلة للحرارة قابلة لإعادة التدوير بنسبة 100% وألغينا أكياس البلاستيك أحادية الاستخدام تماماً لتقليل البصمة الكربونية.',
        link_label_en: 'Zero Single-Use Plastic',
        link_label_ar: 'معيار صفر بلاستيك',
        link_url: '#sustainability',
      },
      {
        icon: 'zap',
        step_label: '04. MICRO-HUBS',
        title_en: 'Speed with Precision',
        title_ar: 'سرعة مقرونة بالدقة',
        description_en: 'Our 32 proprietary cold-storage micro-fulfillment pods across major Saudi neighborhoods guarantee low-cold delivery temperatures even during the hottest summer afternoons.',
        description_ar: 'شبكة من 32 مركز تبريد مصغر داخل أحياء المدن السعودية تضمن وصول طلبك مبرداً بأقل من 4 درجات مئوية حتى في أشد أيام الصيف حرارة.',
        link_label_en: 'Sub-4°C Guarantee',
        link_label_ar: 'ضمان التبريد تحت 4°م',
        link_url: '#micro-hubs',
      },
    ],
  },
  farmer_spotlight_section: {
    image_url: '/images/about/farmer.jpg',
    image_badge_en: 'Verified Local Grower • Al-Kharj Oasis',
    image_badge_ar: 'مزارع محلي معتمد • واحة الخرج',
    badge_en: '🇸🇦 KINGDOM FIRST • LOCAL AGRICULTURAL VENTURE',
    badge_ar: '🇸🇦 المملكة أولاً • شراكات زراعية محلية',
    title_en: 'Partnering Directly with Over 250+ Saudi Farms',
    title_ar: 'شراكة مباشرة مع أكثر من 250 مزرعة سعودية',
    description_en: "Saudi Arabia's domestic agriculture is going through an unprecedented sustainable renaissance. Through precision hydroponics, solar greenhouse arrays, and ancestral soil stewardship, local growers are yielding world-class vegetables, dates, cheeses, and citrus.",
    description_ar: 'تشهد الزراعة الوطنية نهضة مستدامة غير مسبوقة. عبر البيوت المحمية الذكية وتقنيات الهيدروبونيك، ينتج مزارعونا أجود أنواع الخضار الورقية، التمور، الأجبان، والحمضيات بمقاييس عالمية.',
    regions: [
      { name_en: 'Al-Qassim', name_ar: 'القصيم', produce_en: 'Sukkari Dates & Heirloom Herbs', produce_ar: 'تمور السكري وأعشاب برية' },
      { name_en: 'Al-Jouf', name_ar: 'الجوف', produce_en: 'Cold-Pressed Virgin Olive Oils', produce_ar: 'زيت زيتون بكر معصور على البارد' },
      { name_en: 'Al-Kharj', name_ar: 'الخرج', produce_en: 'Farm-Fresh Dairy & Hydro Greens', produce_ar: 'ألبان طازجة وخضار مائية' },
      { name_en: 'Tabuk & Taif', name_ar: 'تبوك والطائف', produce_en: 'Figs, Pomegranates & Apricots', produce_ar: 'تين، رمان، وفواكه جبلية' },
    ],
    quote_en: '"SaqrCart gave our family greenhouse farm direct access to thousands of homes in Riyadh every single morning. We harvest at dawn, and our produce is on family dining tables before lunchtime."',
    quote_ar: '"منحتنا منصة صقر كارت وصولاً مباشراً لآلاف العائلات في الرياض كل صباح. نحصد مع شروق الشمس، ومحصولنا يكون على مائدة الغداء قبل الظهر."',
    quote_author_en: 'Abu Fahad Al-Subaie • Master Grower, Al-Kharj Valley',
    quote_author_ar: '— أبو فهد السبيعي • مزارع رئيسي، وادي الخرج',
    link_label_en: 'Read more about our Kingdom Farming Partners',
    link_label_ar: 'اقرأ المزيد عن شركائنا الزراعيين في المملكة',
    link_url: '/products',
  },
  leadership_section: {
    badge_en: 'EXECUTIVE LEADERSHIP',
    badge_ar: 'القيادة التنفيذية',
    title_en: 'Driven by Passion for Good Food & Technology',
    title_ar: 'يقودنا شغف بالطعام الجيد والتكنولوجيا',
    subtitle_en: 'Meet the executive team bridging agronomy, artificial intelligence routing, cold-chain tech, and customer delight.',
    subtitle_ar: 'فريق تنفيذي يجمع بين الخبرة الزراعية، الذكاء الاصطناعي لسلاسل الإمداد، وتقنيات التبريد الذكية.',
    members: [
      {
        department: 'EXECUTIVE BOARD',
        name: 'Tariq Al-Mansoor',
        role_en: 'Co-Founder & Chief Executive Officer',
        role_ar: 'شريك مؤسس والرئيس التنفيذي',
        bio_en: 'Former logistics partner at Riyadh Air Freight. Led accelerated cold-chain consulting on Saudi Vision 2030 agricultural self-sufficiency initiatives.',
        bio_ar: 'شريك لوجستي سابق في الشحن الجوي. قاد مشاريع استشارية لسلاسل التبريد تماشياً مع مستهدفات الاكتفاء الذاتي الزراعي لرؤية 2030.',
        location_en: 'Riyadh, Saudi Arabia',
        location_ar: 'الرياض، المملكة العربية السعودية',
        image_url: '/images/about/tariq.jpg',
        profile_url: '#',
      },
      {
        department: 'OPERATIONS LEAD',
        name: 'Layla Al-Ghamdi',
        role_en: 'Co-Founder & Chief Operating Officer',
        role_ar: 'شريكة مؤسسة والرئيس التنفيذي للعمليات',
        bio_en: 'Logistics specialist with track innovation across 14+ years optimizing high-frequency distribution across GCC metropolitan hubs and temperature-monitored green fleets.',
        bio_ar: 'خبيرة لوجستية مع أكثر من 14 عاماً في تحسين شبكات التوزيع فائق السرعة بمراكز مدن الخليج وإدارة الأساطيل الخضراء المبردة.',
        location_en: 'Jeddah, Riyadh',
        location_ar: 'جدة، الرياض',
        image_url: '/images/about/layla.jpg',
        profile_url: '#',
      },
      {
        department: 'FOOD SCIENCE',
        name: 'Dr. Sarah Jenkins',
        role_en: 'Head of Quality & Food Science',
        role_ar: 'رئيسة قسم الجودة وعلوم الأغذية',
        bio_en: "Ph.D. in Post-Harvest Physiology and AgTech. Leads SaqrCart's rigorous 17-point quality protocol and oversees USDA-equivalent testing across all micro-hubs.",
        bio_ar: 'دكتوراه في فسيولوجيا ما بعد الحصاد والتقنيات الزراعية. تقود بروتوكول فحص الجودة المكون من 17 نقطة ومختبرات الفحص في المستودعات.',
        location_en: 'Riyadh Hub HQ',
        location_ar: 'مقر الرياض المركزي',
        image_url: '/images/about/sarah.jpg',
        profile_url: '#',
      },
    ],
  },
  sustainability_section: {
    badge_en: '🌿 Eco-Fleet Green Initiative 2030',
    badge_ar: '🌿 مبادرة الأسطول الأخضر 2030',
    title_en: 'Honoring Our Land, Nurturing Our Communities.',
    title_ar: 'نحترم أرضنا، ونرعى مجتمعاتنا.',
    description_en: 'SaqrCart foods not only serve the expanse of our environment. We are building the most environmentally responsible grocery infrastructure in the Middle East.',
    description_ar: 'لا ينبغي أن يأتي الطعام الطازج على حساب بيئتنا. نحن نبني البنية التحتية الأكثر مسؤولية واستدامة لتوصيل البقالة في الشرق الأوسط.',
    highlights: [
      { icon: 'leaf', title_en: 'Zero Emissions', title_ar: 'انبعاثات صفرية', description_en: '100% Electric delivery fleet in urban centers', description_ar: 'أسطول كهربائي 100% في المراكز الحضرية.' },
      { icon: 'sun', title_en: 'Solar Micro-Hubs', title_ar: 'مستودعات شمسية', description_en: '70% renewable energy powering cold storage', description_ar: '70% من غرف التبريد تعمل بالطاقة المتجددة.' },
      { icon: 'recycle', title_en: 'Tree Per 10-packs', title_ar: 'شجرة لكل 10 طلبات', description_en: 'Native trees planted across Asir & Al-Ula', description_ar: 'أشجار محلية مزروعة في عسير والعلا.' },
    ],
    savings_title_en: 'Annual Environmental Savings',
    savings_title_ar: 'الوفر البيئي السنوي',
    metrics: [
      { label_en: 'Plastic Bags Prevented', label_ar: 'أكياس بلاستيكية تم تفاديها', value_text: '1,420,000 bags', percentage: 95 },
      { label_en: 'Food Loss Under Delivery', label_ar: 'تقليل هدر الأغذية', value_text: '89,200 kg', percentage: 92 },
      { label_en: 'CO2 Emissions Averted', label_ar: 'انبعاثات كربونية موفرة', value_text: '380 metric tons', percentage: 88 },
    ],
    bottom_metric_label_en: 'Native Trees Planted',
    bottom_metric_label_ar: 'زراعة أشجار وطنية',
    bottom_metric_value: '42,000+ Trees',
  },
  timeline_section: {
    badge_en: 'OUR GROWTH STORY',
    badge_ar: 'قصة مسيرتنا',
    title_en: 'From a Single Green Van to Kingdom-Wide Delivery',
    title_ar: 'من مركبة توزيع واحدة إلى تغطية كافة أرجاء المملكة',
    steps: [
      {
        step_number: 1,
        year_tag: '2021 • FOUNDING',
        title_en: 'Riyadh Pilot',
        title_ar: 'إطلاق تجريبي بالرياض',
        description_en: 'Launched with 1 micro-hub and 5 farms in Riyadh, pioneering 30-min local farm delivery.',
        description_ar: 'الانطلاق بمركز تبريد واحد وشراكة مع 5 مزارع محلية بالرياض لتوصيل مباشر خلال 30 دقيقة.',
        is_highlighted: false,
      },
      {
        step_number: 2,
        year_tag: '2023 • EXPANSION',
        title_en: 'Hyper-Local Cold Hubs',
        title_ar: 'مراكز تبريد مصغرة',
        description_en: 'Expanded to 12 cold-chain hubs across Riyadh & Jeddah with 100+ partner farms.',
        description_ar: 'التوسع إلى 12 مركز تبريد متقدم في الرياض وجدة مع أكثر من 100 مزرعة شريكة.',
        is_highlighted: false,
      },
      {
        step_number: 3,
        year_tag: '2025 • TECH STACK',
        title_en: 'AI Demand Prediction',
        title_ar: 'تنبؤ الطلب بالذكاء الاصطناعي',
        description_en: 'Integrated machine learning demand models to eliminate farm food waste before harvest.',
        description_ar: 'دمج نماذج تعلم الآلة للتنبؤ الدقيق بالطلب والحد من هدر المحاصيل قبل الحصاد.',
        is_highlighted: false,
      },
      {
        step_number: 4,
        year_tag: 'TODAY • MARKET LEADER',
        title_en: '250+ Farms & 2M+ Delivery',
        title_ar: 'أكثر من 250 مزرعة وتوصيل مليوني',
        description_en: 'Operating express fulfillment across Saudi Arabia with 99.4% freshness guarantee.',
        description_ar: 'تشغيل خدمات التوصيل فائق السرعة عبر مدن المملكة مع ضمان جودة وطزاجة بنسبة 99.4%.',
        is_highlighted: true,
      },
    ],
  },
  cta_section: {
    emoji: '🌱',
    title_en: 'Taste the Difference That Real Freshness Makes',
    title_ar: 'تذوق الفرق الذي تصنعه الطزاجة الحقيقية',
    description_en: 'Experience groceries harvested locally this morning and delivered to your doorstep in under 30 minutes.',
    description_ar: 'جرب خضاراً وفواكه حُصدت من المزارع المحلية صباح اليوم وتصل إلى باب منزلك في أقل من 30 دقيقة.',
    primary_btn_en: 'Shop Fresh Groceries Now',
    primary_btn_ar: 'تسوق المقاضي الطازجة الآن',
    primary_btn_url: '/products',
    secondary_btn_en: 'View Farm Partners',
    secondary_btn_ar: 'تعرف على شركاء المزارع',
    secondary_btn_url: '/products',
  },
  section_visibility: {
    hero: true,
    stats: true,
    principles: true,
    farmers: true,
    leadership: true,
    sustainability: true,
    timeline: true,
    cta: true,
  },
};

class AboutPageService {
  async ensureSeeded() {
    if (seeded) return;
    if (seedPromise) return await seedPromise;

    seedPromise = (async () => {
      await AboutPageSetting.sync();
      const count = await AboutPageSetting.count();
      if (count === 0) {
        await AboutPageSetting.create(DEFAULT_ABOUT_CONTENT);
      }
      seeded = true;
    })();

    try {
      await seedPromise;
    } finally {
      seedPromise = null;
    }
  }

  async getAboutPageContent() {
    await this.ensureSeeded();
    const record = await AboutPageSetting.findOne({ order: [['updatedAt', 'DESC']] });
    return record || DEFAULT_ABOUT_CONTENT;
  }

  async updateAboutPageContent(data, adminId) {
    await this.ensureSeeded();
    let record = await AboutPageSetting.findOne({ order: [['updatedAt', 'DESC']] });
    if (!record) {
      record = await AboutPageSetting.create(DEFAULT_ABOUT_CONTENT);
    }

    const allowedKeys = [
      'hero_section',
      'stats_section',
      'principles_section',
      'farmer_spotlight_section',
      'leadership_section',
      'sustainability_section',
      'timeline_section',
      'cta_section',
      'section_visibility',
    ];

    const payload = { updated_by_admin_id: adminId };
    allowedKeys.forEach((key) => {
      if (data[key] !== undefined) {
        payload[key] = data[key];
      }
    });

    await record.update(payload);
    return record;
  }
}

module.exports = new AboutPageService();
module.exports.DEFAULT_ABOUT_CONTENT = DEFAULT_ABOUT_CONTENT;
