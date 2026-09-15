'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { CheckCircle2, AlertCircle, Info, X, LogIn, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const { locale } = useLanguage();
  const [toast, setToast] = useState(null); // { message, type, linkUrl, productDetails }

  const showToast = useCallback((message, type = 'success', linkUrl = null, productDetails = null) => {
    setToast({ message, type, linkUrl, productDetails, id: Date.now() });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toast }}>
      {children}

      {/* Global Floating Toast Overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
          <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center justify-between gap-3 text-white ${
            toast.type === 'error' || toast.type === 'auth'
              ? 'bg-slate-900/95 border-rose-500/40'
              : toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40'
              : 'bg-slate-900/95 border-slate-700/80'
          }`}>
            <div className="flex items-center gap-3">
              {toast.productDetails?.image ? (
                <div className="w-11 h-11 rounded-xl bg-white p-1 border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={toast.productDetails.image}
                    alt={toast.productDetails.name || 'Product'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : toast.type === 'success' ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : toast.type === 'error' || toast.type === 'auth' ? (
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                  <Info className="w-5 h-5" />
                </div>
              )}

              <div className="space-y-0.5">
                {toast.productDetails?.name && (
                  <p className="text-xs font-extrabold text-emerald-300 line-clamp-1">
                    {toast.productDetails.name}
                  </p>
                )}
                <p className="text-xs font-bold text-slate-100 leading-snug">{toast.message}</p>
                {toast.linkUrl && (
                  <Link
                    href={toast.linkUrl}
                    onClick={hideToast}
                    className="text-[11px] font-extrabold text-lime-400 hover:text-lime-300 underline inline-flex items-center gap-1 mt-0.5"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>{locale === 'ar' ? 'تسجيل الدخول' : 'Log In'}</span>
                  </Link>
                )}
              </div>
            </div>

            <button
              onClick={hideToast}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg) => console.log('Toast:', msg),
      hideToast: () => {},
      toast: null,
    };
  }
  return context;
}

