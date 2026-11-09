'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../src/services/api';

export default function CategoryRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirectFirstCategory() {
      try {
        const res = await fetchApi('/categories?all=true');
        const categories = res.success ? (res.data?.categories || []) : [];
        const rootCat = categories.find((c) => !c.parent_id) || categories[0];
        if (rootCat?.slug) {
          router.replace(`/category/${rootCat.slug}`);
          return;
        }
      } catch (e) {
        // fallback
      }
      router.replace('/category/frozen-items');
    }
    redirectFirstCategory();
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-pulse text-emerald-800 font-bold text-sm">
        Loading Categories...
      </div>
    </div>
  );
}
