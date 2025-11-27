// src/components/AdminResources.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Search, Plus, UploadCloud, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResources, createResource } from '../../../features/Properties/PropertiesSlice';
// import API_BASE like in your announcements file so we can produce full URLs
import { API_BASE } from '../../../features/Auth/authSlice';

type APIResourceFile = { name: string; url: string; type: 'image' | 'pdf' | 'other' };
type UIResource = {
  id: string | number;
  title: string;
  description?: string;
  category?: string;
  fileType?: string;
  downloadUrl?: string | null;
  files?: APIResourceFile[];
  raw?: any;
};

// Fallback data
const fallbackResourceData: UIResource[] = [
  {
    id: 1,
    fileType: 'document',
    title: 'Brand Guidelines 2025',
    description:
      'Complete brand identity guidelines including logo usage, color palette, typography, and marketing templates.',
    category: 'templates',
    downloadUrl: '#',
  },
  {
    id: 2,
    fileType: 'document',
    title: 'Client Onboarding Form V3',
    description:
      'Official client onboarding and agreement form for new property management contracts.',
    category: 'legal_forms',
    downloadUrl: '#',
  },
];

const CATEGORIES_DISPLAY = ['All', 'Branding', 'Templates', 'Legal Forms', 'Training', 'Market Research', 'External Tools'] as const;
const CATEGORY_TO_API: Record<string, string> = {
  Branding: 'branding',
  Templates: 'templates',
  'Legal Forms': 'legal_forms',
  Training: 'training',
  'Market Research': 'market_research',
  'External Tools': 'external_tools',
  All: '',
};
const categories = CATEGORIES_DISPLAY as string[];

/* -----------------------
   Helper: build full URL from backend 'file' or relative path
------------------------*/
function getFileUrl(filePath?: string | null) {
  if (!filePath) return null;
  const s = String(filePath).trim();
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  try {
    const root = (API_BASE || '').replace(/\/api\/?$/, '');
    if (!root) return s;
    if (s.startsWith('/')) return `${root}${s}`;
    return `${root}/${s}`;
  } catch {
    return s;
  }
}

/* -----------------------
   normalize a category string (slug / display) to comparable form
   - returns slug form (lowercase with underscores)
------------------------*/
function normalizeCategoryForCompare(cat?: string | null) {
  if (!cat) return '';
  return String(cat).trim().toLowerCase().replace(/\s+/g, '_');
}

/* -----------------------
   Normalized card
------------------------*/
const ResourceCard = ({ resource, onDownload }: { resource: UIResource; onDownload: (r: UIResource) => void }) => {
  const fileCount = resource.files?.length ?? (resource.downloadUrl ? 1 : 0);
  const firstFile = resource.files && resource.files.length ? resource.files[0] : undefined;
  const showUrl = firstFile?.url ?? resource.downloadUrl ?? null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 flex flex-col hover:shadow-xl transition duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <span className="text-xs font-medium py-1 px-3 rounded-full bg-gray-100 text-gray-700">
          {resource.fileType ?? 'file'}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">{resource.title}</h3>
      <p className="text-sm text-gray-600 flex-grow mb-4">{resource.description}</p>

      <div className="flex justify-between items-center mb-3 border-t pt-4">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase">Category</p>
          <span className="text-sm font-medium text-gray-800">{resource.category ?? '—'}</span>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium uppercase">Files</p>
          <span className="text-sm font-medium text-gray-700">{fileCount} file(s)</span>
        </div>
      </div>

   

      <div className="flex gap-2">
        <button
          onClick={() => onDownload(resource)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-md"
          style={{ backgroundColor: '#00A597' }}
        >
          <Download className="w-4 h-4" />
          Download Files
        </button>
      </div>
    </div>
  );
};

/* -----------------------
   Main AdminResources component
------------------------*/
export default function AdminResources() {
  const dispatch = useDispatch();
  const apiState = useSelector((s: any) => s.propertyBooking ?? {});
  const apiResources = apiState.resources ?? [];
  const apiLoading = apiState.loading ?? false;

  const [resources, setResources] = useState<UIResource[]>(fallbackResourceData);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Templates');
  const [newDescription, setNewDescription] = useState('');

  // single image
  const [newImage, setNewImage] = useState<{ file: File; preview: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // fetch resources on mount via thunk
  useEffect(() => {
    (async () => {
      try {
        await dispatch(fetchResources() as any);
      } catch (err) {
        console.error('fetchResources failed', err);
      }
    })();
  }, [dispatch]);

  // normalization: accept both `files` array and `file` single-field from backend
  useEffect(() => {
    if (!Array.isArray(apiResources) || apiResources.length === 0) return;

    const normalized: UIResource[] = apiResources.map((r: any, idx: number) => {
      const singularFile = r.file ?? r.file_path ?? null;
      const filesArr: APIResourceFile[] =
        Array.isArray(r.files) && r.files.length
          ? r.files.map((f: any) => ({
              name: f.name ?? f.filename ?? String(f.file ?? '').split('/').pop() ?? 'file',
              url: getFileUrl(f.file ?? f.url ?? f.path ?? f),
              type: (String(f.content_type || f.type || '')).startsWith('image') ? 'image' : (String(f.content_type || '').includes('pdf') ? 'pdf' : 'other'),
            }))
          : singularFile
          ? [{ name: String(singularFile).split('/').pop() ?? 'file', url: getFileUrl(singularFile), type: 'image' }]
          : [];

      const downloadUrl = (r.download_url && String(r.download_url).trim()) ? getFileUrl(r.download_url) : (filesArr[0]?.url ?? null);

      return {
        id: r.id ?? r.pk ?? `api-${idx}`,
        title: r.title ?? r.name ?? 'Untitled',
        description: r.description ?? r.details ?? '',
        // keep backend value as-is (we'll compare using slug/normalized)
        category: r.category ?? r.type ?? '',
        fileType: r.file_type ?? (filesArr[0]?.type ?? 'document'),
        downloadUrl,
        files: filesArr,
        raw: r,
      };
    });

    // dedupe by id
    const map = new Map<string | number, UIResource>();
    for (const it of normalized) if (!map.has(it.id)) map.set(it.id, it);
    setResources(Array.from(map.values()));
  }, [apiResources]);

  // Helper: map friendly label -> backend choice key (fallback to slug)
  function mapCategoryToApi(label: string) {
    if (!label) return '';
    if (CATEGORY_TO_API[label] !== undefined && CATEGORY_TO_API[label] !== '') return CATEGORY_TO_API[label];
    return label.toLowerCase().replace(/\s+/g, '_');
  }

  // FILTER: use mapped backend key for comparison so UI categories filter actual API categories
  const filteredResources = resources.filter((resource) => {
    const search = searchTerm.toLowerCase();
    const searchMatch =
      (resource.title ?? '').toLowerCase().includes(search) ||
      (resource.description ?? '').toLowerCase().includes(search);

    // category handling: if 'All' selected, allow all; otherwise compare normalized slug forms
    if (activeCategory === 'All') {
      return searchMatch;
    }

    const expectedApiKey = mapCategoryToApi(activeCategory); // e.g. "Market Research" -> "market_research"
    const resourceCatNormalized = normalizeCategoryForCompare(resource.category);
    const expectedNormalized = normalizeCategoryForCompare(expectedApiKey);

    const categoryMatch = resourceCatNormalized === expectedNormalized;

    return categoryMatch && searchMatch;
  });

  function openModal() {
    setIsModalOpen(true);
    setNewTitle('');
    setNewCategory('Templates');
    setNewDescription('');
    if (newImage?.preview) {
      try { URL.revokeObjectURL(newImage.preview); } catch {}
    }
    setNewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    document.body.style.overflow = 'hidden';
    setErrorMessage(null);
  }

  function closeModal() {
    if (newImage?.preview) {
      try { URL.revokeObjectURL(newImage.preview); } catch {}
    }
    setNewImage(null);
    setIsModalOpen(false);
    document.body.style.overflow = '';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f) return;
    const lowered = (f.type || '').toLowerCase();
    const isImage = lowered.startsWith('image/');
    if (!isImage) {
      alert('Please select an image file.');
      return;
    }
    if (newImage?.preview) {
      try { URL.revokeObjectURL(newImage.preview); } catch {}
    }
    const preview = URL.createObjectURL(f);
    setNewImage({ file: f, preview, name: f.name });
  }

  function removeSelectedImage() {
    if (newImage?.preview) {
      try { URL.revokeObjectURL(newImage.preview); } catch {}
    }
    setNewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // create resource — use your thunk which already supports FormData when files passed
  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    if (!newTitle.trim()) {
      alert('Please provide a title.');
      return;
    }
    setIsSubmitting(true);
    try {
      const apiCategory = mapCategoryToApi(newCategory);
      const resourceData = { title: newTitle, description: newDescription || '', category: apiCategory };

      // pass array of files to thunk; thunk will send FormData when files provided
      const filesForApi = newImage ? [newImage.file] : undefined;

      const action: any = await dispatch(createResource({ resourceData, files: filesForApi }) as any);

      // check if rejected
      if (action.type && action.type.endsWith('/rejected')) {
        const payload = action.payload ?? action.error ?? {};
        console.error('createResource rejected:', payload);
        let msg = '';
        if (payload && typeof payload === 'object') {
          if (payload.status && payload.message) msg = `${payload.status}: ${payload.message}`;
          else msg = Object.entries(payload).map(([k, v]) => (Array.isArray(v) ? `${k}: ${v.join('; ')}` : `${k}: ${String(v)}`)).join('\n');
        } else msg = String(payload);
        setErrorMessage(msg || 'Failed to create resource (validation error).');
        alert(`Failed to create resource:\n${msg || 'Validation error (400).'}`);
        return;
      }

      const data = action.payload ?? action;

      // Construct UI resource mapping singular `file` or files returned by backend
      const returnedFiles: APIResourceFile[] =
        Array.isArray(data?.files) && data.files.length
          ? data.files.map((f: any) => ({ name: f.name ?? f.filename ?? String(f.file || '').split('/').pop(), url: getFileUrl(f.file ?? f.url ?? f.path ?? f), type: (String(f.content_type || f.type || '').startsWith('image')) ? 'image' : 'other' }))
          : (data?.file ? [{ name: String(data.file).split('/').pop() ?? 'file', url: getFileUrl(data.file), type: 'image' }] : (newImage ? [{ name: newImage.name, url: newImage.preview, type: 'image' }] : []));

      const created: UIResource = {
        id: data?.id ?? `r-${Date.now()}`,
        title: data?.title ?? newTitle,
        description: data?.description ?? newDescription ?? '',
        category: data?.category ?? mapCategoryToApi(newCategory),
        fileType: data?.file_type ?? (returnedFiles[0]?.type ?? 'image'),
        downloadUrl: (returnedFiles[0]?.url) ?? null,
        files: returnedFiles,
        raw: data,
      };

      // Insert created resource at the top; remove any existing with same id
      setResources(prev => {
        const filtered = prev.filter(p => String(p.id) !== String(created.id));
        return [created, ...filtered];
      });

      // cleanup
      setNewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsModalOpen(false);
      document.body.style.overflow = '';
    } catch (err) {
      console.error('Create resource failed:', err);
      setErrorMessage(String((err as any)?.message ?? err) || 'Failed to create resource');
      alert(`Failed to create resource: ${String((err as any)?.message ?? err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Download handler: ALWAYS try to fetch the resource as a blob and force download.
  // Fallback: open in new tab.
  async function handleDownload(resource: UIResource) {
    const candidateUrl =
      (resource.files && resource.files.length && resource.files[0].url) ||
      resource.downloadUrl ||
      (resource.raw && (resource.raw.file || resource.raw.file_path) && getFileUrl(resource.raw.file ?? resource.raw.file_path)) ||
      null;

    const finalUrl = candidateUrl ?? null;

    console.log('Resource clicked for download:', resource);
    console.log('Backend raw object:', resource.raw);
    console.log('Resolved download URL:', finalUrl);

    if (!finalUrl) {
      alert('No file URL available.');
      return;
    }

    let filename = resource.files && resource.files.length && resource.files[0].name
      ? resource.files[0].name
      : (() => {
          try {
            const p = new URL(finalUrl).pathname;
            return p.split('/').pop() || `${String(resource.title || 'file').replace(/\s+/g, '_')}.jpg`;
          } catch {
            return `${String(resource.title || 'file').replace(/\s+/g, '_')}.jpg`;
          }
        })();

    try {
      const resp = await fetch(finalUrl, { method: 'GET', mode: 'cors' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Fetch->blob download failed, falling back to opening the file:', err);
      try {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      } catch {
        alert('Unable to download file — check server CORS configuration or try opening the file in a new tab.');
      }
    }
  }

  return (
    <div className="bg-gray-50 font-sans p-4 md:p-8 min-h-screen">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Resources</h1>
            <p className="text-gray-600 text-sm">Access marketing materials, templates, images and PDFs</p>
            {/* <p className="text-xs text-gray-500 mt-1">API root: <span className="font-mono">{(API_BASE || '').replace(/\/api\/?$/, '')}</span></p> */}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={openModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium shadow-md" style={{ backgroundColor: '#00A597' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Resources</span>
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="relative mr-5 flex-grow lg:w-1/3">
            <input type="text" placeholder="Search Resources..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500 transition shadow-sm" />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          <div className="overflow-x-auto whitespace-nowrap">
            <div className="inline-flex space-x-2 p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
              {categories.map((category) => (
                <button key={category}
                  onClick={() => { setActiveCategory(category); setSearchTerm(''); }}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition duration-200 ${activeCategory === category ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {apiLoading && <div className="text-center text-sm text-gray-500 mb-4">Loading resources...</div>}
        {errorMessage && <div className="mb-4 text-sm text-red-600">{errorMessage}</div>}

        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, idx) => (
            <ResourceCard key={resource.id ?? `res-${idx}`} resource={resource} onDownload={handleDownload} />
          ))}

          {!apiLoading && filteredResources.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-10">No resources found matching your filter and search criteria.</p>
          )}
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6" role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === 'Escape') closeModal(); }}>
          <div className="fixed inset-0 bg-black/40" onClick={closeModal}></div>

          <div className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Add Resource</h2>
                <p className="text-sm text-gray-500">Upload a single image (the API will return `file` or `files`)</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none" aria-label="Close add resource modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 border rounded-md text-sm bg-gray-50" placeholder="Title" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 border rounded-md text-sm bg-gray-50">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-md text-sm bg-gray-50" placeholder="Short description" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (single image)</label>
                <label htmlFor="file-upload" className="relative cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50">
                  <UploadCloud className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Upload a single image</span>
                  <input id="file-upload" ref={fileInputRef} onChange={handleFileChange} type="file" accept="image/*" className="sr-only" />
                </label>

                {newImage && (
                  <div className="mt-3">
                    <div className="relative rounded-md overflow-hidden border">
                      <img src={newImage.preview} alt={newImage.name} className="w-full h-32 min-h-[6rem] max-h-36 object-cover" />
                      <button type="button" onClick={removeSelectedImage} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1" title="Remove">
                        <X className="w-3 h-3" />
                      </button>

                      <a href={newImage.preview} download={newImage.name} className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-white/90 px-2 py-1 rounded-md text-xs shadow" title={`Download ${newImage.name}`}>
                        <Download className="w-3 h-3" />
                        <span>DL</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="flex cursor-pointer items-center gap-2 px-4 justify-center py-3 rounded-md text-white font-medium w-full" style={{ backgroundColor: '#00A597', opacity: isSubmitting ? 0.7 : 1 }}>
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'Adding…' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
