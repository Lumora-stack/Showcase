"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Code, RefreshCw } from "lucide-react";

interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  technologies: string[];
  category: string;
  status: string;
  published: boolean;
  sortOrder: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("published", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Project[] = [];
      const cats = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data() as Project;
        list.push({ ...data, id: doc.id });
        if (data.category) {
          cats.add(data.category);
        }
      });
      // Sort client-side to bypass Firestore Composite Index requirement
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      setProjects(list);
      setCategories(["All", ...Array.from(cats)]);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.technologies.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || project.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow flex flex-col gap-12">
      <div className="text-center sm:text-left flex flex-col gap-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Software & Showcase Projects
        </h1>
        <p className="text-zinc-400 max-w-2xl font-light text-base sm:text-lg">
          Explore tools, custom modules, client architectures, and experimental web builds.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects, technologies, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors"
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
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="border border-zinc-900 bg-zinc-900/20 rounded-xl h-96 animate-pulse"></div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl py-24 text-center flex-grow flex flex-col items-center justify-center gap-4">
          <Code className="w-12 h-12 text-zinc-700" />
          <p className="text-zinc-500 text-lg">No matching projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group border border-zinc-850 bg-zinc-900/40 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full w-full max-w-sm mx-auto md:max-w-none"
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
                {project.status && (
                  <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-900/90 text-indigo-400 border border-indigo-500/20">
                    {project.status}
                  </span>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
                  {project.category || "General"}
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mt-1.5">
                  {project.title}
                </h3>
                <p className="text-zinc-400 text-sm mt-2 line-clamp-2 font-light leading-relaxed flex-grow">
                  {project.shortDescription}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-zinc-850/50">
                  {project.technologies?.map((tech) => (
                    <span key={tech} className="text-[9px] uppercase font-semibold tracking-wider text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
