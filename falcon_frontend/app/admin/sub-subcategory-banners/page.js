import CategoryBannerManager from '../../../src/components/CategoryBannerManager';

export const metadata = {
  title: 'Sub-Sub-Category Banners (Level 3) | Falcon Admin',
  description: 'Manage banners for 3rd-level sub-subcategories',
};

export default function SubSubCategoryBannersPage() {
  return <CategoryBannerManager activeLevel={3} />;
}
