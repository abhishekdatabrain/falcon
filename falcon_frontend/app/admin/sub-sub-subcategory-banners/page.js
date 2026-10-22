import CategoryBannerManager from '../../../src/components/CategoryBannerManager';

export const metadata = {
  title: 'Sub-Sub-Sub-Category Banners (Level 4) | Falcon Admin',
  description: 'Manage banners for 4th-level micro sub-sub-subcategories',
};

export default function SubSubSubCategoryBannersPage() {
  return <CategoryBannerManager activeLevel={4} />;
}
