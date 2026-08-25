"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, BookOpen, ExternalLink } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  price: number;
  currency: string;
  category: string;
  gumroadUrl: string;
  published: boolean;
  sortOrder: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("published", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Product[] = [];
      const cats = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data() as Product;
        list.push({ ...data, id: doc.id });
        if (data.category) {
          cats.add(data.category);
        }
      });
      // Sort client-side to bypass Firestore Composite Index requirement
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      setProducts(list);
      setCategories(["All", ...Array.from(cats)]);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow flex flex-col gap-12">
      <div className="text-center sm:text-left flex flex-col gap-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight animate-fade-in">
          Premium Digital Storefront
        </h1>
        <p className="text-zinc-400 max-w-2xl font-light text-base sm:text-lg">
          Purchase ebooks, graphic asset bundles, UI assets, and creative design tools directly on Gumroad.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search digital products, items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors"
          />
        </div>

        {/* Categories list */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-zinc-900 bg-zinc-900/20 rounded-xl h-96 animate-pulse"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl py-24 text-center flex-grow flex flex-col items-center justify-center gap-4">
          <BookOpen className="w-12 h-12 text-zinc-700" />
          <p className="text-zinc-500 text-lg">No digital products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group border border-zinc-850 bg-zinc-900/40 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full w-full max-w-sm mx-auto md:max-w-none"
            >
              <Link href={`/products/${product.slug}`} className="relative aspect-square w-full bg-zinc-950 overflow-hidden block">
                {product.thumbnailUrl ? (
                  <Image
                    src={product.thumbnailUrl}
                    alt={product.title}
                    fill
                    sizes="(max-w-768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
              </Link>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest bg-purple-500/5 border border-purple-500/10 px-2.5 py-0.5 rounded">
                    {product.category || "Assets"}
                  </span>
                  <span className="text-base font-bold text-white">
                    {product.currency === "INR" ? "₹" : "$"}{product.price.toFixed(2)}
                  </span>
                </div>
                <Link href={`/products/${product.slug}`} className="block mt-3.5 flex-grow">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-2 line-clamp-2 font-light leading-relaxed">
                    {product.shortDescription}
                  </p>
                </Link>
                <div className="mt-6 pt-4 border-t border-zinc-850/50 flex items-center gap-2">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-xs font-semibold text-zinc-350 hover:text-white px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 rounded-md transition-colors flex-1 text-center"
                  >
                    View Details
                  </Link>
                  <a
                    href={product.gumroadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-white px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex-1 text-center flex items-center justify-center gap-1 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  >
                    Get on Gumroad
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
