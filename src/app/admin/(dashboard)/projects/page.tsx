"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Code, Plus, Trash2, Edit2, CheckCircle, XCircle, Upload, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  gallery: string[];
  technologies: string[];
  category: string;
  status: string;
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Active");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Read Action from search params (e.g. ?action=new)
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      resetForm();
      setShowForm(true);
      // Clean up URL
      router.replace("/admin/projects");
    }
  }, [searchParams, router]);

  // Fetch projects
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Slug with Title when writing new titles
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingProject) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  const resetForm = () => {
    setEditingProject(null);
    setTitle("");
    setSlug("");
    setShortDescription("");
    setDescription("");
    setThumbnailFile(null);
    setThumbnailUrl("");
    setGalleryFiles(null);
    setGalleryUrls([]);
    setTechInput("");
    setCategory("");
    setStatus("Active");
    setGithubUrl("");
    setLiveUrl("");
    setFeatured(false);
    setPublished(true);
    setSortOrder(projects.length);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setTitle(project.title || "");
    setSlug(project.slug || "");
    setShortDescription(project.shortDescription || "");
    setDescription(project.description || "");
    setThumbnailUrl(project.thumbnailUrl || "");
    setGalleryUrls(project.gallery || []);
    setTechInput(project.technologies ? project.technologies.join(", ") : "");
    setCategory(project.category || "");
    setStatus(project.status || "Active");
    setGithubUrl(project.githubUrl || "");
    setLiveUrl(project.liveUrl || "");
    setFeatured(project.featured || false);
    setPublished(project.published !== false);
    setSortOrder(project.sortOrder || 0);
    setShowForm(true);
  };

  const handleDelete = async (id: string, thumbUrl: string, gallery: string[]) => {
    if (!confirm("Are you sure you want to delete this project? This will permanently remove all storage references.")) return;

    try {
      // 1. Delete document
      await deleteDoc(doc(db, "projects", id));
      
      // 2. Try deleting thumbnail in Storage
      if (thumbUrl && thumbUrl.includes("firebasestorage")) {
        try {
          const imageRef = ref(storage, thumbUrl);
          await deleteObject(imageRef);
        } catch (e) {
          console.warn("Storage deletion warning for thumbnail:", e);
        }
      }
      
      // 3. Try deleting gallery images in Storage
      if (gallery && gallery.length > 0) {
        for (const url of gallery) {
          if (url.includes("firebasestorage")) {
            try {
              const fileRef = ref(storage, url);
              await deleteObject(fileRef);
            } catch (e) {
              console.warn("Storage deletion warning for gallery item:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalThumbnailUrl = thumbnailUrl;
      const finalGalleryUrls = [...galleryUrls];

      // 1. Upload Thumbnail
      if (thumbnailFile) {
        const timeStamp = Date.now();
        const thumbRef = ref(storage, `projects/thumbnails/${timeStamp}_${thumbnailFile.name}`);
        const snap = await uploadBytes(thumbRef, thumbnailFile);
        finalThumbnailUrl = await getDownloadURL(snap.ref);
      }

      // 2. Upload Gallery Images
      if (galleryFiles && galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const file = galleryFiles[i];
          const timeStamp = Date.now();
          const galleryItemRef = ref(storage, `projects/gallery/${timeStamp}_${file.name}`);
          const snap = await uploadBytes(galleryItemRef, file);
          const url = await getDownloadURL(snap.ref);
          finalGalleryUrls.push(url);
        }
      }

      const techArray = techInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const projectData = {
        title,
        slug,
        shortDescription,
        description,
        thumbnailUrl: finalThumbnailUrl,
        gallery: finalGalleryUrls,
        technologies: techArray,
        category,
        status,
        githubUrl,
        liveUrl,
        featured,
        published,
        sortOrder: Number(sortOrder),
        updatedAt: Date.now(),
      };

      if (editingProject) {
        await updateDoc(doc(db, "projects", editingProject.id), projectData);
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: Date.now(),
        });
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project metadata. Review console log.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Code className="text-indigo-400 w-8 h-8" /> Projects Workspace
          </h1>
          <p className="text-zinc-500 text-sm font-light">Add, update, or unpublish your custom software works.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="glass border border-zinc-850 p-6 md:p-8 rounded-2xl flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white">
            {editingProject ? `Edit: ${editingProject.title}` : "Create New Project"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Project Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Orvion PWA"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Slug (URL Route)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. orvion-pwa"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Short Summary</label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief single-sentence summary of the project."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Full Details (Markdown or Text)</label>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the application features, challenges solved, architecture structure..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Web App, Mobile"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Development Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              >
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Experimental">Experimental</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">GitHub Repository Link</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Live Demo Link</label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Technologies / Stack (comma-separated)</label>
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="React, TypeScript, Tailwind, Firebase"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          {/* Image Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-850 pt-6">
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Project Image / Thumbnail URL</label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://i.imgur.com/... or upload file below"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-semibold text-zinc-300">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  Or Upload File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                </label>
                {thumbnailFile && (
                  <span className="text-xs text-zinc-500 truncate max-w-xs">
                    {thumbnailFile.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Gallery Images</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 px-4 py-3 rounded-lg cursor-pointer transition-colors text-xs font-semibold text-zinc-300">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  Select File(s)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setGalleryFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
                {galleryFiles && (
                  <span className="text-xs text-zinc-500">
                    {galleryFiles.length} files selected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 border-zinc-800"
              />
              <span className="text-xs font-semibold text-zinc-300">Feature on Home page</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 border-zinc-800"
              />
              <span className="text-xs font-semibold text-zinc-300">Publish immediately</span>
            </label>
          </div>

          <div className="flex items-center gap-3 justify-end mt-4 pt-6 border-t border-zinc-850">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Assets...
                </>
              ) : (
                "Save Project"
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Projects Table list */
        <div className="border border-zinc-850 bg-zinc-900/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              No projects added to the showcase database yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase font-bold text-zinc-500 tracking-wider bg-zinc-900 border-b border-zinc-850">
                  <tr>
                    <th scope="col" className="px-6 py-4">Thumbnail</th>
                    <th scope="col" className="px-6 py-4">Title</th>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Featured</th>
                    <th scope="col" className="px-6 py-4">Published</th>
                    <th scope="col" className="px-6 py-4">Order</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60">
                  {projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-zinc-900/35 transition-colors">
                      <td className="px-6 py-3">
                        <div className="relative w-16 aspect-video bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                          {proj.thumbnailUrl ? (
                            <Image
                              src={proj.thumbnailUrl}
                              alt={proj.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <Code className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-white truncate max-w-[180px]">
                        {proj.title}
                      </td>
                      <td className="px-6 py-3 text-xs">{proj.category}</td>
                      <td className="px-6 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-zinc-850 text-indigo-400 border border-indigo-500/10">
                          {proj.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {proj.featured ? (
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4.5 h-4.5 text-zinc-650" />
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {proj.published ? (
                          <Eye className="w-4.5 h-4.5 text-indigo-400" />
                        ) : (
                          <EyeOff className="w-4.5 h-4.5 text-zinc-650" />
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs font-mono">{proj.sortOrder}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleEdit(proj)}
                            className="p-1.5 hover:text-indigo-400 transition-colors bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-850 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(proj.id, proj.thumbnailUrl, proj.gallery)}
                            className="p-1.5 hover:text-red-400 transition-colors bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-850 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProjectsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
