"use client";

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExternalLink } from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
}

// Inline brand SVGs to replace lucide brand icons that are missing in newer v4 versions
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function Footer() {
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    const q = query(collection(db, "socialLinks"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const links: SocialLink[] = [];
      snapshot.forEach((doc) => {
        links.push({ id: doc.id, ...doc.data() } as SocialLink);
      });
      setSocials(links);
    }, (error) => {
      console.error("Error fetching social links in footer:", error);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "github":
        return <GithubIcon className="w-5 h-5" />;
      case "linkedin":
        return <LinkedinIcon className="w-5 h-5" />;
      case "instagram":
        return <InstagramIcon className="w-5 h-5" />;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };

  const defaultSocials = [
    { name: "GitHub", url: "https://github.com", icon: <GithubIcon className="w-5 h-5" /> },
    { name: "LinkedIn", url: "https://linkedin.com", icon: <LinkedinIcon className="w-5 h-5" /> },
  ];

  return (
    <footer className="mt-auto border-t border-zinc-900 bg-black/40 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-sm text-zinc-300">STEPHAN SALVATORE</span>
              <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
            </div>
            <p className="text-xs text-zinc-500">© {new Date().getFullYear()} All creative works and rights reserved.</p>
          </div>

          <div className="flex items-center gap-4">
            {socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-indigo-400 hover:scale-110 transition-all duration-300"
                title={social.platform}
              >
                {getIcon(social.platform)}
              </a>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
