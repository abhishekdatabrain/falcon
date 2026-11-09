import CategoryBannerManager from '../../../src/components/CategoryBannerManager';

export const metadata = {
  title: 'Category Hierarchy Banners | Falcon Admin',
  description: 'Manage banners across all category hierarchy levels',
};

export default function CategoryHierarchyBannersAdminPage() {
  return <CategoryBannerManager activeLevel={1} />;
}
