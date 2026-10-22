import CategoryBannerManager from '../../../src/components/CategoryBannerManager';

export const metadata = {
  title: 'Main Category Banners (Level 1) | Falcon Admin',
  description: 'Manage hero banners for top-level root categories',
};

export default function MainCategoryBannersPage() {
  return <CategoryBannerManager activeLevel={1} />;
}
