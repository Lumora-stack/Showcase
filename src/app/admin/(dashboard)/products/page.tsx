"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { BookOpen, Plus, Trash2, Edit2, CheckCircle, XCircle, Upload, Eye, EyeOff, Loader2, DollarSign } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  gallery: string[];
  price: number;
  currency: string;
  category: string;
  gumroadUrl: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
}
// Helper function to compress and convert images to Base64 (saving in Firestore, bypassing Storage Blaze plan)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600; // Optimize width for fast database loads
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
        
        // Output compressed JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("");
  const [gumroadUrl, setGumroadUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Read Action from search params (e.g. ?action=new)
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      resetForm();
      setShowForm(true);
      router.replace("/admin/products");
    }
  }, [searchParams, router]);

  // Fetch products
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Slug with Title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingProduct) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setTitle("");
    setSlug("");
    setShortDescription("");
    setDescription("");
    setThumbnailFile(null);
    setThumbnailUrl("");
    setGalleryFiles(null);
    setGalleryUrls([]);
    setPrice(0);
    setCurrency("USD");
    setCategory("");
    setGumroadUrl("");
    setFeatured(false);
    setPublished(true);
    setSortOrder(products.length);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title || "");
    setSlug(product.slug || "");
    setShortDescription(product.shortDescription || "");
    setDescription(product.description || "");
    setThumbnailUrl(product.thumbnailUrl || "");
    setGalleryUrls(product.gallery || []);
    setPrice(product.price || 0);
    setCurrency(product.currency || "USD");
    setCategory(product.category || "");
    setGumroadUrl(product.gumroadUrl || "");
    setFeatured(product.featured || false);
    setPublished(product.published !== false);
    setSortOrder(product.sortOrder || 0);
    setShowForm(true);
  };

  const handleDelete = async (id: string, thumbUrl: string, gallery: string[]) => {
    if (!confirm("Are you sure you want to delete this digital product? This will permanently remove all storage references.")) return;

    try {
      // 1. Delete document
      await deleteDoc(doc(db, "products", id));
      
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
      console.error("Error deleting product:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalThumbnailUrl = thumbnailUrl;
      const finalGalleryUrls = [...galleryUrls];

      // 1. Process Thumbnail to Base64
      if (thumbnailFile) {
        finalThumbnailUrl = await compressImage(thumbnailFile);
      }

      // 2. Process Gallery Images to Base64
      if (galleryFiles && galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const file = galleryFiles[i];
          const base64Url = await compressImage(file);
          finalGalleryUrls.push(base64Url);
        }
      }

      const productData = {
        title,
        slug,
        shortDescription,
        description,
        thumbnailUrl: finalThumbnailUrl,
        gallery: finalGalleryUrls,
        price: Number(price),
        currency,
        category,
        gumroadUrl,
        featured,
        published,
        sortOrder: Number(sortOrder),
        updatedAt: Date.now(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: Date.now(),
        });
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save digital product. Review console log.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="text-purple-400 w-8 h-8" /> Digital Products
          </h1>
          <p className="text-zinc-500 text-sm font-light">Manage Gumroad products, prices, categories, and storefront details.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="glass border border-zinc-850 p-6 md:p-8 rounded-2xl flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white">
            {editingProduct ? `Edit: ${editingProduct.title}` : "Create New Product"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Product Name / Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Coloring Book for Kids"
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
                placeholder="e.g. coloring-book-for-kids"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Short Description</label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief single-sentence summary of the product."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Full Description (Markdown or Text)</label>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify what is included in the download package, files format, usage guidelines..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Price</label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="2.99"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 pl-8 pr-3 text-sm text-white transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Currency</label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Kids Activities, eBooks"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
              />
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Gumroad Sales Page URL</label>
            <input
              type="url"
              required
              value={gumroadUrl}
              onChange={(e) => setGumroadUrl(e.target.value)}
              placeholder="https://gumroad.com/l/..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-2 px-3 text-sm text-white transition-colors"
            />
          </div>

          {/* Image Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-850 pt-6">
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Product Image / Cover URL</label>
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
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Additional Preview Images</label>
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
                "Save Product"
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Products Table list */
        <div className="border border-zinc-850 bg-zinc-900/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              No digital products found in Firestore.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase font-bold text-zinc-500 tracking-wider bg-zinc-900 border-b border-zinc-850">
                  <tr>
                    <th scope="col" className="px-6 py-4">Cover</th>
                    <th scope="col" className="px-6 py-4">Title</th>
                    <th scope="col" className="px-6 py-4">Price</th>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="px-6 py-4">Featured</th>
                    <th scope="col" className="px-6 py-4">Published</th>
                    <th scope="col" className="px-6 py-4">Order</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-900/35 transition-colors">
                      <td className="px-6 py-3">
                        <div className="relative w-10 aspect-square bg-zinc-950 border border-zinc-850 rounded overflow-hidden">
                          {prod.thumbnailUrl ? (
                            <Image
                              src={prod.thumbnailUrl}
                              alt={prod.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-white truncate max-w-[200px]">
                        {prod.title}
                      </td>
                      <td className="px-6 py-3 font-mono font-semibold text-white">
                        ${prod.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-xs">{prod.category}</td>
                      <td className="px-6 py-3">
                        {prod.featured ? (
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4.5 h-4.5 text-zinc-650" />
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {prod.published ? (
                          <Eye className="w-4.5 h-4.5 text-indigo-400" />
                        ) : (
                          <EyeOff className="w-4.5 h-4.5 text-zinc-650" />
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs font-mono">{prod.sortOrder}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleEdit(prod)}
                            className="p-1.5 hover:text-indigo-400 transition-colors bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-850 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.thumbnailUrl, prod.gallery)}
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

export default function AdminProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
