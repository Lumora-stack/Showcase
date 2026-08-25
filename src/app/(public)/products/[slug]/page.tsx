"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, ExternalLink, Sparkles, ShieldCheck, Download, Award } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  gallery?: string[];
  price: number;
  currency: string;
  category: string;
  gumroadUrl: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("slug", "==", slug),
      where("published", "==", true),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data() as Product;
        setProduct({ ...data, id: docSnap.id });
        setActiveImage(data.thumbnailUrl || "");
      } else {
        setProduct(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching product details:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Product Not Found</h1>
        <p className="text-zinc-400 mb-8">The digital product you are looking for does not exist or has been unpublished.</p>
        <Link href="/products" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>
    );
  }

  const allImages = [product.thumbnailUrl, ...(product.gallery || [])].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow flex flex-col gap-10">
      <div>
        <Link href="/products" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Gallery / Image Section (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative aspect-square w-full bg-zinc-900 border border-zinc-850 rounded-xl overflow-hidden">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.title}
                fill
                sizes="(max-w-1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                <Sparkles className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === img ? "border-purple-500" : "border-zinc-850 hover:border-zinc-750"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Preview ${index}`}
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/5 border border-purple-500/10 px-2.5 py-1 rounded">
                {product.category}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 bg-zinc-850 px-2.5 py-1 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" /> Gumroad Verified
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{product.currency === "INR" ? "₹" : "$"}{product.price.toFixed(2)}</span>
              <span className="text-zinc-500 text-sm font-semibold uppercase">{product.currency || "USD"}</span>
            </div>

            <p className="text-zinc-400 font-light text-base leading-relaxed">
              {product.shortDescription}
            </p>

            <div className="border-y border-zinc-900 py-4 my-2 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                <Download className="w-4 h-4 text-indigo-400" />
                Instant Digital Delivery (PDF, ZIP, or assets)
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                <Award className="w-4 h-4 text-indigo-400" />
                Secure Checkout & Payment processing via Gumroad
              </div>
            </div>
          </div>

          <div className="mt-8">
            <a
              href={product.gumroadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-lg transition-colors text-center w-full hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
            >
              Get it on Gumroad
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-[10px] text-zinc-500 text-center mt-3">
              Clicking this button will redirect you to Gumroad for checkout and payment processing.
            </p>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-8 border-t border-zinc-900 pt-10">
        <h2 className="text-xl font-bold text-white mb-4">Product Details</h2>
        <div className="prose prose-invert max-w-none text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
          {product.description}
        </div>
      </div>
    </div>
  );
}
