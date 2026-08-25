"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Code, BookOpen, User, PlusCircle, Settings2, Sparkles } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    publishedProjects: 0,
    totalProducts: 0,
    publishedProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // Listen to projects
    const unsubscribeProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
      let total = 0;
      let published = 0;
      snapshot.forEach((doc) => {
        total++;
        if (doc.data().published === true) {
          published++;
        }
      });
      setStats((prev) => ({
        ...prev,
        totalProjects: total,
        publishedProjects: published,
      }));
    });

    // Listen to products
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      let total = 0;
      let published = 0;
      snapshot.forEach((doc) => {
        total++;
        if (doc.data().published === true) {
          published++;
        }
      });
      setStats((prev) => ({
        ...prev,
        totalProducts: total,
        publishedProducts: published,
      }));
      setLoading(false);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeProducts();
    };
  }, []);

  const seedDatabase = async () => {
    setSeeding(true);
    try {
      const { doc: firestoreDoc, setDoc, addDoc, collection } = await import("firebase/firestore");
      
      // 1. Seed Profile
      await setDoc(firestoreDoc(db, "profile", "admin"), {
        name: "Stephan Salvatore",
        bio: "I am a digital creator, software developer, and creative generalist. I design tools, build apps, and release assets to make the internet a more colorful and efficient place.",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60", // Unsplash premium avatar placeholder
        heroTitle: "I build digital products, software and creative experiments.",
        heroSubtitle: "Welcome to my creative universe. Explore my latest tools, software releases, and curated resources.",
        email: "quantumvoyager2005@gmail.com",
        updatedAt: Date.now(),
      });

      // 2. Seed Orvion Project
      await addDoc(collection(db, "projects"), {
        title: "Orvion",
        slug: "orvion",
        shortDescription: "Premium Personal Life Operating System (Life OS) built with a glassmorphic UI.",
        description: "Orvion is a centralized, high-fidelity Personal Life Operating System designed as an installable Progressive Web App (PWA). It provides a cohesive dashboard to organize, track, analyze, and visualize daily journals, tasks, habits, finances, entertainment tracking, and personal wellness metrics from a single secure and modern application.\n\nBuilt with a stunning glassmorphic UI, fluid GSAP layout transitions, and interactive Three.js 3D backdrop animations, Orvion balances rich aesthetics with performance-first code.",
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
        gallery: [
          "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=60"
        ],
        technologies: ["React", "Vite", "GSAP", "Three.js", "Firebase", "Chart.js"],
        category: "Productivity",
        status: "Active",
        githubUrl: "https://github.com/praveen-4942/Orvion.git",
        liveUrl: "http://localhost:3000",
        featured: true,
        published: true,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 3. Seed Digital Product
      await addDoc(collection(db, "products"), {
        title: "30 Cute Animal Coloring Pages for Kids",
        slug: "30-cute-animal-coloring-pages",
        shortDescription: "30 cute animal coloring pages with 30 colored reference examples.",
        description: "30 cute animal coloring pages with 30 colored reference examples, designed for kids to enjoy at home, during travel, or during quiet time. Easily printable templates formatted in high-resolution PDF blocks. Ready to import directly into digital apps or color on paper.",
        thumbnailUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=60",
        gallery: [
          "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=60"
        ],
        price: 2.99,
        currency: "USD",
        category: "Kids Activities",
        gumroadUrl: "https://gumroad.com", // Configurable sales page
        featured: true,
        published: true,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 4. Seed Social Links
      await addDoc(collection(db, "socialLinks"), {
        platform: "GitHub",
        url: "https://github.com",
        sortOrder: 1,
      });

      await addDoc(collection(db, "socialLinks"), {
        platform: "LinkedIn",
        url: "https://linkedin.com",
        sortOrder: 2,
      });

      alert("Showcase database successfully seeded with initial mock content!");
    } catch (err) {
      console.error("Seeding failed: ", err);
      alert("Failed to seed database.");
    } finally {
      setSeeding(false);
    }
  };

  const statCards = [
    {
      title: "Projects",
      total: stats.totalProjects,
      published: stats.publishedProjects,
      icon: <Code className="w-5 h-5 text-indigo-400" />,
      color: "border-indigo-500/10 bg-indigo-500/5",
    },
    {
      title: "Digital Products",
      total: stats.totalProducts,
      published: stats.publishedProducts,
      icon: <BookOpen className="w-5 h-5 text-purple-400" />,
      color: "border-purple-500/10 bg-purple-500/5",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Dashboard Overview <Sparkles className="w-5 h-5 text-indigo-400" />
        </h1>
        <p className="text-zinc-500 text-sm font-light">Monitor showcase metrics and manage external integrations.</p>
      </div>

      {stats.totalProjects === 0 && stats.totalProducts === 0 && (
        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Showcase Database is Empty</h3>
            <p className="text-zinc-400 text-xs mt-1">Populate your Firestore with sample collections (Orvion project, coloring book product, social links, biography).</p>
          </div>
          <button
            onClick={seedDatabase}
            disabled={seeding}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {seeding ? "Seeding Database..." : "Seed Mock Data"}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className={`border ${card.color} rounded-2xl p-6 flex flex-col justify-between gap-6`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{card.title}</span>
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">{card.icon}</div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-white">{card.total}</span>
              <span className="text-xs text-zinc-500">
                ({card.published} published live)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Quick Operations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/projects?action=new"
            className="flex items-center gap-3 p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-colors text-sm font-medium text-zinc-200"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            Add Project
          </Link>
          <Link
            href="/admin/products?action=new"
            className="flex items-center gap-3 p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-colors text-sm font-medium text-zinc-200"
          >
            <PlusCircle className="w-4 h-4 text-purple-400" />
            Add Digital Product
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-colors text-sm font-medium text-zinc-200"
          >
            <Settings2 className="w-4 h-4 text-emerald-400" />
            Edit Profile Config
          </Link>
        </div>
      </div>
    </div>
  );
}
