"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, limit, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowRight, Code, BookOpen, ExternalLink, Tag } from "lucide-react";

interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  technologies: string[];
  featured: boolean;
  published: boolean;
}

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
  featured: boolean;
  published: boolean;
}

interface Profile {
  name: string;
  bio: string;
  avatarUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  email: string;
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Profile
    const profileRef = doc(db, "profile", "admin");
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as Profile);
      } else {
        // Sensible default/fallback
        setProfile({
          name: "Stephan Salvatore",
          bio: "I am a digital creator, software developer, and creative generalist. I design tools, build apps, and release assets to make the internet a more colorful and efficient place.",
          avatarUrl: "",
          heroTitle: "I build digital products, software and creative experiments.",
          heroSubtitle: "Welcome to my creative universe. Explore my latest tools, software releases, and curated resources.",
          email: "quantumvoyager2005@gmail.com",
        });
      }
    });

    // 2. Fetch Featured Projects
    const projectsQuery = query(
      collection(db, "projects"),
      where("published", "==", true)
    );
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsList: Project[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Project;
        projectsList.push({ ...data, id: doc.id });
      });
      // Filter featured status and limit client-side to avoid Firestore composite index requirement
      setFeaturedProjects(projectsList.filter((p) => p.featured).slice(0, 3));
    });

    // 3. Fetch Featured Products
    const productsQuery = query(
      collection(db, "products"),
      where("published", "==", true)
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsList: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Product;
        productsList.push({ ...data, id: doc.id });
      });
      // Filter featured status and limit client-side to avoid Firestore composite index requirement
      setFeaturedProducts(productsList.filter((p) => p.featured).slice(0, 3));
      setLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeProjects();
      unsubscribeProducts();
    };
  }, []);

  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 border-b border-zinc-900 bg-radial-gradient">
        {/* Subtle decorative glowing backdrops */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center z-10 flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wider uppercase animate-pulse">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
            Creative Portfolio & Shop
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15] max-w-3xl">
            Hi, I&apos;m <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">{profile?.name || "Praveenkumar"}</span>.
            <br />
            <span className="text-zinc-200 text-3xl sm:text-5xl font-bold mt-4 block">
              {profile?.heroTitle || "I build digital products, software and creative experiments."}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-light leading-relaxed">
            {profile?.heroSubtitle || "Explore projects ranging from installable web apps to interactive coloring assets, built for high performance and premium experiences."}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
            <Link
              href="/projects"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3.5 rounded-lg transition-all duration-300 w-full sm:w-auto hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              Explore Projects
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/products"
              className="flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium px-8 py-3.5 rounded-lg transition-all duration-300 w-full sm:w-auto"
            >
              View Products
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Code className="text-indigo-400 w-6 h-6" /> Featured Projects
            </h2>
            <p className="text-zinc-400 text-sm mt-2">A handpicked selection of production-grade software projects.</p>
          </div>
          <Link href="/projects" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group">
            All Projects <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-zinc-900 bg-zinc-900/20 rounded-xl h-96 animate-pulse"></div>
            ))}
          </div>
        ) : featuredProjects.length === 0 ? (
          <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl p-12 text-center">
            <p className="text-zinc-500">No featured projects found. Check back soon or visit Admin Panel to create them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group border border-zinc-850 bg-zinc-900/40 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                  {project.thumbnailUrl ? (
                    <Image
                      src={project.thumbnailUrl}
                      alt={project.title}
                      fill
                      sizes="(max-w-768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Code className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-2 line-clamp-2 font-light leading-relaxed flex-grow">
                    {project.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {project.technologies?.slice(0, 3).map((tech) => (
                      <span key={tech} className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BookOpen className="text-purple-400 w-6 h-6" /> Premium Digital Products
            </h2>
            <p className="text-zinc-400 text-sm mt-2">Asset packs, books, templates and creative downloads.</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 group">
            All Products <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-zinc-900 bg-zinc-900/20 rounded-xl h-96 animate-pulse"></div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl p-12 text-center">
            <p className="text-zinc-500">No featured products found. Visit the Admin Panel to configure digital items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group border border-zinc-850 bg-zinc-900/40 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 flex flex-col"
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
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest bg-purple-500/5 border border-purple-500/10 px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                    <span className="text-base font-bold text-white">
                      {product.currency === "INR" ? "₹" : "$"}{product.price.toFixed(2)}
                    </span>
                  </div>
                  <Link href={`/products/${product.slug}`} className="block mt-3 flex-grow">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-2 line-clamp-2 font-light leading-relaxed">
                      {product.shortDescription}
                    </p>
                  </Link>
                  <div className="mt-5 pt-4 border-t border-zinc-850/60 flex items-center gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-xs font-semibold text-zinc-300 hover:text-white px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors flex-1 text-center"
                    >
                      View Details
                    </Link>
                    <a
                      href={product.gumroadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex-1 text-center flex items-center justify-center gap-1"
                    >
                      Get it on Gumroad
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-zinc-900 pt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          <div className="md:col-span-1 flex justify-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-indigo-500/30 p-1 bg-zinc-900">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={192}
                  height={192}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-4xl font-black">
                  {profile?.name?.charAt(0) || "P"}
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-4 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">About Me</h2>
            <p className="text-zinc-400 font-light leading-relaxed">
              {profile?.bio}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 justify-center md:justify-start">
              <span className="text-zinc-500 text-sm">Get in touch:</span>
              <a
                href={`mailto:${profile?.email}`}
                className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm underline"
              >
                {profile?.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
