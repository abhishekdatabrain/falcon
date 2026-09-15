'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useCart } from '../../src/contexts/CartContext';
import { fetchApi } from '../../src/services/api';
import { Search, Filter, ShoppingBag, Star, Leaf } from 'lucide-react';

export default function ProductsPage() {
  const { t, locale } = useLanguage();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [addingId, setAddingId] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = `/products?search=${encodeURIComponent(search)}`;
      if (selectedCategory) {
        query += `&categoryId=${selectedCategory}`;
      }
      const res = await fetchApi(query);
      if (res.success) {
        setProducts(res.data.products?.products || res.data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      const res = await fetchApi('/categories');
      if (res.success) setCategories(res.data.categories || []);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleAddToCart = async (productId, productObj) => {
    try {
      setAddingId(productId);
      await addToCart(productId, 1, productObj);
    } catch (err) {
      // Toast notification is automatically managed by CartContext
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">
      
      {/* Header & Search Bar */}
      <div className="bg-slate-950/80 rounded-3xl p-8 border border-emerald-500/20 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Leaf className="w-8 h-8 text-emerald-400" />
              <span>{t('nav.products')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">Explore our complete supermarket catalog with instant search & grocery department filtering</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fruits, milk, vegetables, SKU..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
          </form>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-2 border-t border-white/10">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === ''
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            All Grocery Departments
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {locale === 'ar' ? cat.name_ar : cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-slate-900/60 h-80 rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-slate-950/80 rounded-3xl p-16 text-center text-slate-400 border border-white/10">
          No grocery items found matching your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const primaryImg = prod.images && prod.images.length > 0 ? prod.images[0].image_url : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500';
            return (
              <div key={prod.id} className="bg-slate-900/70 hover:bg-slate-900 rounded-3xl p-5 flex flex-col justify-between group border border-white/10 hover:border-emerald-500/50 transition-all duration-300 shadow-xl">
                <div className="space-y-4">
                  <div className="w-full h-52 rounded-2xl overflow-hidden bg-slate-950 relative border border-white/5">
                    <img
                      src={primaryImg}
                      alt={locale === 'ar' ? prod.name_ar : prod.name_en}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 font-extrabold text-xs border border-emerald-500/30">
                      {parseFloat(prod.price).toFixed(2)} SAR
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 truncate">
                        SKU: {prod.sku}
                      </span>
                    </div>
                    <h3 className="font-bold text-base line-clamp-1 text-white group-hover:text-emerald-300 transition-colors">
                      {locale === 'ar' ? prod.name_ar : prod.name_en}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {locale === 'ar' ? prod.description_ar : prod.description_en}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-5">
                  <span className="text-xs font-semibold text-emerald-400">
                    {prod.stock_quantity > 0 ? `${prod.stock_quantity} in stock` : 'Out of Stock'}
                  </span>

                  <button
                    onClick={() => handleAddToCart(prod.id, prod)}
                    disabled={addingId === prod.id}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{addingId === prod.id ? 'Adding...' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
