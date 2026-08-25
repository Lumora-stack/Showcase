"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc, collection, doc as firestoreDoc, addDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Settings, Save, Upload, Link2, Trash2, Plus, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

interface Profile {
  name: string;
  bio: string;
  avatarUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  email: string;
  instagramUrl?: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400; // Optimize profile avatars to be smaller
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    avatarUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    email: "",
    instagramUrl: "",
  });

  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSocials, setLoadingSocials] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // New Social Link Form Fields
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [addingSocial, setAddingSocial] = useState(false);

  // Fetch Profile settings
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, "profile", "admin"));
        if (docSnap.exists()) {
          setProfile(docSnap.data() as Profile);
        }
      } catch (err) {
        console.error("Error fetching profile settings:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();

    // Listen to Social Links live
    const q = query(collection(db, "socialLinks"), orderBy("sortOrder", "asc"));
    const unsubscribeSocials = onSnapshot(q, (snapshot) => {
      const links: SocialLink[] = [];
      snapshot.forEach((doc) => {
        links.push({ id: doc.id, ...doc.data() } as SocialLink);
      });
      setSocials(links);
      setLoadingSocials(false);
    });

    return () => unsubscribeSocials();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      let finalAvatarUrl = profile.avatarUrl;

      // 1. Process Avatar to Base64
      if (avatarFile) {
        finalAvatarUrl = await compressImage(avatarFile);
      }

      const updatedProfile = {
        name: profile.name || "",
        bio: profile.bio || "",
        avatarUrl: finalAvatarUrl || "",
        heroTitle: profile.heroTitle || "",
        heroSubtitle: profile.heroSubtitle || "",
        email: profile.email || "",
        instagramUrl: profile.instagramUrl || "",
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, "profile", "admin"), updatedProfile);
      setProfile(updatedProfile);
      setAvatarFile(null);
      alert("Admin profile updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to update profile settings.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatform || !newUrl) return;
    setAddingSocial(true);

    try {
      await addDoc(collection(db, "socialLinks"), {
        platform: newPlatform,
        url: newUrl,
        sortOrder: Number(newSortOrder),
      });
      setNewPlatform("");
      setNewUrl("");
      setNewSortOrder(socials.length + 1);
    } catch (err) {
      console.error("Error adding social link:", err);
    } finally {
      setAddingSocial(false);
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this social link?")) return;
    try {
      await deleteDoc(firestoreDoc(db, "socialLinks", id));
    } catch (err) {
      console.error("Error deleting social link:", err);
    }
  };

  if (loadingProfile || loadingSocials) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="text-indigo-400 w-8 h-8" /> Console Configuration
        </h1>
        <p className="text-zinc-500 text-sm font-light">Configure homepage biography, hero banners, email, and social networks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Form (7 cols) */}
        <form onSubmit={handleProfileSave} className="lg:col-span-7 glass border border-zinc-850 p-6 md:p-8 rounded-2xl flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Profile Details <Sparkles className="w-4 h-4 text-indigo-400" />
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-zinc-850">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex-shrink-0 flex items-center justify-center">
              {avatarFile ? (
                <Image
                  src={URL.createObjectURL(avatarFile)}
                  alt="Avatar Preview"
                  fill
                  className="object-cover"
                />
              ) : profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-zinc-600 text-2xl font-bold">P</span>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Avatar / Profile Picture URL</span>
              <input
                type="text"
                value={profile.avatarUrl}
                onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                placeholder="https://i.imgur.com/... or upload file below"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-2 border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-semibold text-zinc-300">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  Or Upload File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Praveenkumar"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Contact Email</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="praveenkumar@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Instagram Profile URL</label>
              <input
                type="url"
                value={profile.instagramUrl || ""}
                onChange={(e) => setProfile({ ...profile, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/username"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Hero Main Title</label>
            <input
              type="text"
              required
              value={profile.heroTitle}
              onChange={(e) => setProfile({ ...profile, heroTitle: e.target.value })}
              placeholder="I build digital products, software and creative experiments."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Hero Subtitle / Tagline</label>
            <input
              type="text"
              required
              value={profile.heroSubtitle}
              onChange={(e) => setProfile({ ...profile, heroSubtitle: e.target.value })}
              placeholder="Welcome to my creative universe. Explore my latest tools..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Biography (Short introduction)</label>
            <textarea
              rows={5}
              required
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell visitors about your background, experience, design philosophies..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-850">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Info
                </>
              )}
            </button>
          </div>
        </form>

        {/* Social Links Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Add social link form */}
          <form onSubmit={handleAddSocial} className="glass border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" /> Add Network Link
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wide">Platform</label>
                <input
                  type="text"
                  required
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  placeholder="e.g. GitHub, LinkedIn"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-1.5 px-3 text-xs text-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wide">Sort Order</label>
                <input
                  type="number"
                  required
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-1.5 px-3 text-xs text-white transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wide">Sales or Profile URL</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-1.5 px-3 text-xs text-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={addingSocial}
              className="mt-2 w-full bg-zinc-850 hover:bg-zinc-800 text-white font-bold py-2 rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {addingSocial ? "Adding Link..." : "Insert Link"}
            </button>
          </form>

          {/* Social Links List */}
          <div className="glass border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Configured Links</h2>

            {socials.length === 0 ? (
              <p className="text-zinc-600 text-xs py-4 text-center">No social links configured yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {socials.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-850 bg-zinc-900/30">
                    <div className="flex flex-col gap-0.5 truncate max-w-[70%]">
                      <span className="text-xs font-bold text-white">{link.platform}</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-indigo-400 truncate">
                        {link.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-zinc-600">O: {link.sortOrder}</span>
                      <button
                        onClick={() => handleDeleteSocial(link.id)}
                        className="p-1 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors text-zinc-550"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
