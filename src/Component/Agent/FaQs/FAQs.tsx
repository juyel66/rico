// File: FAQs.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

// ---- CONFIG ----
const API_BASE = 'https://api.eastmondvillas.com';
const FAQ_ENDPOINT = `${API_BASE}/api/faqs/`;

// Category options exactly like backend expects (value = API string, label = nice text)
const CATEGORY_OPTIONS = [
  { value: 'marketing_materials', label: 'Marketing Materials' },
  { value: 'property_viewings', label: 'Property Viewings' },
  { value: 'property_management', label: 'Property Management' },
  { value: 'commissions', label: 'Commissions' },
  { value: 'technical_support', label: 'Technical Support' },
];

// Small helper: read auth token if needed
function authHeaders(): Record<string, string> {
  try {
    const token =
      localStorage.getItem('auth_access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token');

    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // ignore
  }
  return {};
}

// Resolve category label from value
function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return '';
  const opt = CATEGORY_OPTIONS.find((o) => o.value === value);
  if (opt) return opt.label;

  // fallback – just format string
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase());
}

// ---- FAQ ITEM COMPONENT ----
type FAQItemProps = {
  faq: any;
  onDelete: (id: number) => void;
};

const FAQItem: React.FC<FAQItemProps> = ({ faq, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md mb-4 border border-gray-100 transition-all duration-300">
      {/* Question Header */}
      <div
        className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-base font-medium text-gray-800 flex-grow pr-4">
          {faq.question}
        </span>

        <div className="flex items-center gap-3">
          {/* Small delete button */}


         <div >
           <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(faq.id);
            }}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
         </div>

         

          {/* Toggle Icon with border and rounded full */}
          <div className="border border-gray-300 rounded-full p-1 flex items-center justify-center">
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </div>
      </div>

      {/* Answer Body (Collapsible) */}
      <div
        className={`transition-max-height duration-500 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ transitionProperty: 'max-height, opacity' }}
      >
        <div className="p-5 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
          {faq.category && (
            <p className="mt-3 text-xs text-gray-500">
              Category: {getCategoryLabel(faq.category)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- MAIN COMPONENT ----
const FAQs: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ALL = '__ALL__';
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState<string>(
    CATEGORY_OPTIONS[0]?.value || ''
  );
  const [submitting, setSubmitting] = useState(false);

  // ----- FETCH FAQ LIST (GET /api/faqs/) -----
  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FAQ_ENDPOINT, {
        headers: {
          ...authHeaders(),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load FAQs (${res.status})`);
      }

      const json = await res.json();
      // support both list + paginated
      const list = Array.isArray(json.results) ? json.results : json;
      setFaqs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load FAQs');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // ----- CREATE FAQ (POST /api/faqs/ with form-data) -----
  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim() || !formCategory.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Please fill in question, answer and category.',
        confirmButtonColor: '#009689',
      });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('question', formQuestion.trim());
      fd.append('answer', formAnswer.trim());
      fd.append('category', formCategory.trim()); // backend expects like "marketing_materials"

      const res = await fetch(FAQ_ENDPOINT, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          // no Content-Type, browser sets boundary
        },
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = `Failed to create FAQ (${res.status})`;
        try {
          const data = JSON.parse(text);
          msg = JSON.stringify(data);
        } catch {
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      // success alert
      Swal.fire({
        icon: 'success',
        title: 'FAQ added successfully',
        showConfirmButton: false,
        timer: 1500,
      });

      // Clear & close modal
      setFormQuestion('');
      setFormAnswer('');
      setFormCategory(CATEGORY_OPTIONS[0]?.value || '');
      setIsModalOpen(false);

      // Refresh list
      await fetchFaqs();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to add FAQ',
        text: err?.message || 'Something went wrong.',
        confirmButtonColor: '#009689',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ----- DELETE FAQ (DELETE /api/faqs/:id/) -----
  const handleDeleteFaq = async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete FAQ?',
      text: 'Are you sure you want to delete this FAQ?',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e02424',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${FAQ_ENDPOINT}${id}/`, {
        method: 'DELETE',
        headers: {
          ...authHeaders(),
        },
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete FAQ (${res.status})`);
      }

      setFaqs((prev) => prev.filter((f) => f.id !== id));

      Swal.fire({
        icon: 'success',
        title: 'FAQ deleted',
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to delete FAQ',
        text: err?.message || 'Something went wrong.',
        confirmButtonColor: '#009689',
      });
    }
  };

  // ----- CATEGORY LIST (TABS) -----
  const categories = useMemo(() => {
    return [ALL, ...CATEGORY_OPTIONS.map((c) => c.value)];
  }, []);

  // ----- FILTERED LIST -----
  const filteredFAQs = faqs.filter((faq) => {
    const categoryMatch =
      activeCategory === ALL || faq.category === activeCategory;

    const lower = searchTerm.toLowerCase();
    const searchMatch =
      faq.question.toLowerCase().includes(lower) ||
      faq.answer.toLowerCase().includes(lower);

    return categoryMatch && searchMatch;
  });

  return (
    <div className="font-sans p-4 md:p-8">
      <div className=" mx-auto">
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-600 text-sm">
              Find answers to common questions about the agent portal
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#009689] cursor-pointer text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors duration-150"
          >
            Add FAQs
          </button>
        </header>

        {/* Search and Category Filter Bar */}
        <div className="flex flex-col mb-8 space-y-4">
          <div className="flex items-center border-2 p-2 rounded-xl gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-gray-900 focus:border-gray-900 transition shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Category Tabs */}
            <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="inline-flex space-x-2 p-1 rounded-xl shadow-sm">
                {categories.map((category) => {
                  const isAll = category === ALL;
                  const label = isAll
                    ? 'All Categories'
                    : getCategoryLabel(category);

                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        setSearchTerm('');
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                        activeCategory === category
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ List */}
        <main>
          {loading && (
            <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center text-gray-500">
              <span className="loading loading-spinner loading-xl" />
            </div>
          </div>
          )}

          {error && (
            <p className="text-center text-red-500 py-4 text-sm">{error}</p>
          )}

          {!loading &&
            !error &&
            filteredFAQs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} onDelete={handleDeleteFaq} />
            ))}

          {!loading && !error && filteredFAQs.length === 0 && (
              <div className="flex justify-center py-10">
    <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-8 max-w-md text-center shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-2">
        No FAQs available
      </h3>
      <p className="text-sm text-gray-500">
        There are no FAQs matching your current search or category filter.
      </p>
    </div>
  </div>
          )}
        </main>
      </div>

      {/* ADD FAQ MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New FAQ
            </h2>

            <form onSubmit={handleCreateFaq} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <textarea
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                  placeholder="How do I download marketing materials for a property?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Answer
                </label>
                <textarea
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                  placeholder="Marketing materials, such as high-resolution images and descriptive PDFs, can be downloaded from..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 bg-white"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  This value is sent as <code>category</code> in form-data, e.g.{' '}
                  <code>marketing_materials</code>.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) setIsModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm rounded-lg bg-[#009689] text-white font-medium shadow-sm hover:bg-[#018477] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving…' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQs;
