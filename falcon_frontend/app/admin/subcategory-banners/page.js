import CategoryBannerManager from '../../../src/components/CategoryBannerManager';

export const metadata = {
  title: 'Sub-Category Banners (Level 2) | Falcon Admin',
  description: 'Manage banners for 2nd-level subcategories',
};

export default function SubCategoryBannersPage() {
  return <CategoryBannerManager activeLevel={2} />;
}
