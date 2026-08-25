"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, ExternalLink, Globe, Award, Sparkles } from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  gallery?: string[];
  technologies: string[];
  category: string;
  status: string;
  githubUrl?: string;
  liveUrl?: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("slug", "==", slug),
      where("published", "==", true),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data() as Project;
        setProject({ ...data, id: docSnap.id });
        setActiveImage(data.thumbnailUrl || "");
      } else {
        setProject(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching project details:", error);
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

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Project Not Found</h1>
        <p className="text-zinc-400 mb-8">The project you are looking for does not exist or has been unpublished.</p>
        <Link href="/projects" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  const allImages = [project.thumbnailUrl, ...(project.gallery || [])].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow flex flex-col gap-10">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Gallery / Image Section (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-video w-full bg-zinc-900 border border-zinc-850 rounded-xl overflow-hidden">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={project.title}
                fill
                sizes="(max-w-1024px) 100vw, 60vw"
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
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === img ? "border-indigo-500" : "border-zinc-800 hover:border-zinc-650"
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

        {/* Details Section (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded">
                {project.category}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded">
                {project.status}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {project.title}
            </h1>

            <p className="text-zinc-400 font-light text-base leading-relaxed">
              {project.shortDescription}
            </p>

            <div className="flex flex-wrap gap-1.5 py-2">
              {project.technologies.map((tech) => (
                <span key={tech} className="text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-zinc-900">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
              >
                <Globe className="w-4 h-4" />
                Visit Live Demo
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-200 hover:text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
                View Code on GitHub
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Full Description & Features Section */}
      <div className="mt-8 border-t border-zinc-900 pt-10">
        <h2 className="text-xl font-bold text-white mb-4">About the Project</h2>
        <div className="prose prose-invert max-w-none text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
          {project.description}
        </div>
      </div>
    </div>
  );
}
