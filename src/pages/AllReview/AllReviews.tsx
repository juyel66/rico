// src/pages/AllReview.tsx
import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAccessToken,
  selectIsAuthenticated,
  selectCurrentUser,
  refreshToken,
} from '@/features/Auth/authSlice';

type ReviewImage = { id: number; image: string };

type ReviewItem = {
  id: number;
  property: number | string;
  property_title?: string;
  user: number | string | { id?: number; [k: string]: any };
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
  images?: ReviewImage[];
  address?: string | null;
  status?: string;
};

type ReviewsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReviewItem[];
};

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://api.eastmondvillas.com/api';
const REVIEWS_URL = `${API_BASE}/villas/reviews/`;

/* ---------------- Helpers ---------------- */
const formatDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const truncateTable = (s = '', n = 20) => (s.length > n ? s.slice(0, n) + '…' : s);

const StarRow = ({ rating }: { rating: number }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <svg
          key={s}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={s <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          className={`w-4 h-4 ${s <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 4.298c.139.28.423.447.72.447h4.722a.562.562 0 01.385.91l-3.844 3.692a.563.563 0 01-.183.568l1.173 4.887a.563.563 0 01-.84.622l-4.302-2.583a.563.563 0 01-.588 0L6.96 19.427a.562.562 0 01-.84-.622l1.173-4.887a.563.563 0 01-.183-.568L3.05 9.154a.562.562 0 01.385-.91h4.722c.297 0 .581-.167.72-.447l2.125-4.298z"
          />
        </svg>
      ))}
    </div>
  );
};

/* ---------------- Spinner (reusable) ---------------- */
const SpinnerInline = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const classes = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  const textClass = size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-xs';
  return (
    <div className="flex items-center justify-center gap-2">
      <svg className={`animate-spin ${classes} text-teal-600`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className={`${textClass} text-gray-700`}>Loading...</span>
    </div>
  );
};

/* ---------------- Component ---------------- */
const AllReview: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const [resp, setResp] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // modal state
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  const doFetchWithRefresh = useCallback(
    async (input: RequestInfo, init: RequestInit = {}, allowRetry = true): Promise<Response> => {
      const token = getAccessToken();
      const baseHeaders: Record<string, string> = {
        Accept: 'application/json',
        ...(init.headers ? (init.headers as Record<string, string>) : {}),
      };
      if (token) baseHeaders.Authorization = `Bearer ${token}`;

      const res = await fetch(input, { ...init, headers: baseHeaders });

      if (res.status !== 401) return res;

      if (!allowRetry) return res;

      try {
        // @ts-ignore
        const refreshResult = await dispatch(refreshToken());
        if (refreshToken.fulfilled.match(refreshResult)) {
          const newToken = getAccessToken();
          const retryHeaders = { ...baseHeaders, Authorization: newToken ? `Bearer ${newToken}` : undefined };
          const retryRes = await fetch(input, { ...init, headers: retryHeaders });
          return retryRes;
        }
        return res;
      } catch (e) {
        return res;
      }
    },
    [dispatch]
  );

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doFetchWithRefresh(REVIEWS_URL, { method: 'GET' });

      if (res.status === 401) {
        await Swal.fire({
          icon: 'warning',
          title: 'Login required',
          text: 'You must be logged in to view reviews (or session expired).',
        });
        setResp(null);
        setLoading(false);
        return;
      }

      const rawText = await res.text();
      let parsed: any = null;
      try {
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsed = rawText;
      }

      if (!res.ok) {
        const msg = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed || `status ${res.status}`);
        console.error('Fetch reviews failed:', res.status, parsed);
        await Swal.fire({ icon: 'error', title: 'Error', text: `Failed to fetch reviews — ${msg}` });
        setResp(null);
        setLoading(false);
        return;
      }

      console.log('RAW reviews response:', parsed);
      if (parsed && Array.isArray(parsed.results)) {
        try {
          console.table(parsed.results);
        } catch {}
        setResp(parsed as ReviewsResponse);
      } else if (Array.isArray(parsed)) {
        setResp({ count: parsed.length, next: null, previous: null, results: parsed });
      } else {
        console.warn('Unexpected reviews response shape:', parsed);
        setResp(null);
      }
    } catch (err) {
      console.error('Network error fetching reviews:', err);
      await Swal.fire({ icon: 'error', title: 'Network error', text: 'Could not fetch reviews. See console.' });
      setResp(null);
    } finally {
      setLoading(false);
    }
  }, [doFetchWithRefresh]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (id: number) => {
    const confirmed = await Swal.fire({
      title: 'Delete review?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#e11d48',
    });
    if (!confirmed.isConfirmed) return;

    setDeletingId(id);
    try {
      const res = await doFetchWithRefresh(`${REVIEWS_URL}${id}/`, { method: 'DELETE' });

      if (res.status === 401) {
        await Swal.fire({ icon: 'error', title: 'Unauthorized', text: 'Authentication failed. Please login again.' });
        window.location.href = '/login';
        return;
      }

      const rawText = await res.text();
      let parsed;
      try {
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsed = rawText;
      }

      if (res.status === 204 || res.ok) {
        setResp((prev) =>
          prev ? { ...prev, results: prev.results.filter((r) => r.id !== id), count: Math.max(0, prev.count - 1) } : prev
        );

        await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Review deleted successfully.', timer: 1400, showConfirmButton: false });
        return;
      }

      const msg = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed || `status ${res.status}`);
      console.error('Delete failed:', res.status, parsed);
      await Swal.fire({ icon: 'error', title: 'Delete failed', text: msg });
    } catch (err) {
      console.error('Network error deleting review:', err);
      await Swal.fire({ icon: 'error', title: 'Network error', text: 'Could not delete review. See console.' });
    } finally {
      setDeletingId(null);
    }
  };

  // NEW: change status (PATCH) — send as FormData (no Content-Type header)
  const handleChangeStatus = async (id: number, newStatus: string) => {
    const review = resp?.results.find((r) => r.id === id);
    if (!review) return;

    if (String(review.status || '').toLowerCase() === String(newStatus).toLowerCase()) {
      // no change
      return;
    }

    const confirm = await Swal.fire({
      title: `Change status to "${newStatus}"?`,
      text: `This will set the review status to "${newStatus}". Proceed?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) {
      return;
    }

    setUpdatingStatusId(id);
    try {
      // Use FormData to avoid sending application/json
      const form = new FormData();
      form.append('status', newStatus);

      const res = await doFetchWithRefresh(`${REVIEWS_URL}${id}/`, {
        method: 'PATCH',
        body: form, // do NOT set headers.Content-Type — browser will set multipart boundary
      });

      const rawText = await res.text();
      let parsed: any = null;
      try {
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsed = rawText;
      }

      if (res.status === 401) {
        await Swal.fire({ icon: 'error', title: 'Unauthorized', text: 'Authentication failed. Please login again.' });
        window.location.href = '/login';
        return;
      }

      if (!res.ok) {
        const msg = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed || `status ${res.status}`);
        console.error('Status update failed', res.status, parsed);
        await Swal.fire({ icon: 'error', title: 'Update failed', text: msg });
        return;
      }

      // Update local state: replace the review item
      setResp((prev) => {
        if (!prev) return prev;
        const updatedResults = prev.results.map((r) => (r.id === id ? { ...r, ...(parsed || {}), status: parsed?.status ?? newStatus } : r));
        return { ...prev, results: updatedResults };
      });

      // if modal open for this review, update it
      setSelectedReview((sr) => (sr && sr.id === id ? { ...sr, ...(parsed || {}), status: parsed?.status ?? newStatus } : sr));

      await Swal.fire({ icon: 'success', title: 'Updated', text: `Status updated to "${newStatus}".`, timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error('Network error updating status:', err);
      await Swal.fire({ icon: 'error', title: 'Network error', text: 'Could not update status. See console.' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // modal
  const openView = (r: ReviewItem) => {
    setSelectedReview(r);
    document.body.style.overflow = 'hidden';
  };
  const closeView = () => {
    setSelectedReview(null);
    document.body.style.overflow = '';
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedReview) closeView();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedReview]);

  const rows = resp?.results ?? [];

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Reviews</h1>
          <div className="flex items-center gap-2">
            <button onClick={fetchReviews} className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded shadow hover:bg-teal-700">
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center"><SpinnerInline size="md" /></div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No reviews found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r, idx) => {
                  const imgs = r.images || [];
                  const total = imgs.length;
                  const status = (r.status ?? 'pending').toLowerCase();
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{idx + 1}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          {total === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <>
                              <div className="relative">
                                <img src={imgs[0].image} alt={`img-${imgs[0].id}`} className="w-12 h-12 object-cover rounded" />
                                <span className="absolute -bottom-1 -right-1 bg-black/70 text-white text-xs px-1 rounded">1 / {total}</span>
                              </div>

                              {imgs.slice(1, 3).map((img, i) => {
                                const isLastSlot = i === 1 && total > 3;
                                if (isLastSlot) {
                                  const remaining = total - 2;
                                  return (
                                    <div key={img.id} className="relative">
                                      <img src={img.image} alt={`img-${img.id}`} className="w-10 h-10 object-cover rounded opacity-90" />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded text-white text-sm">+{remaining}</div>
                                    </div>
                                  );
                                }
                                return <img key={img.id} src={img.image} alt={`img-${img.id}`} className="w-10 h-10 object-cover rounded" />;
                              })}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        <div className="truncate max-w-[12rem]">{truncateTable(r.comment ?? '', 20)}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        <StarRow rating={r.rating} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {status === 'approved' ? 'Approved' : 'Pending'}
                          </span>

                          {/* Dropdown to change status */}
                          <select
                            value={status}
                            onChange={(e) => handleChangeStatus(r.id, e.target.value)}
                            disabled={updatingStatusId === r.id}
                            className="ml-2 text-xs border rounded px-2 py-1"
                          >
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                          </select>

                          {updatingStatusId === r.id && (
                            <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openView(r)}
                          className="inline-flex items-center gap-2 px-2 py-1 rounded bg-sky-50 text-sky-600 hover:bg-sky-100"
                          title="View review"
                        >
                          <span className="bg-teal-600 text-white text-sm px-3 py-1 rounded-md hover:bg-teal-500">View</span>
                        </button>

                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-red-50 text-red-600"
                          title="Delete review"
                        >
                          {deletingId === r.id ? (
                            <svg className="animate-spin h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H3.5A1.5 1.5 0 002 5.5V6h16v-.5A1.5 1.5 0 0016.5 4H15V3a1 1 0 00-1-1H6zM4 7v9.5A1.5 1.5 0 005.5 18h9A1.5 1.5 0 0016 16.5V7H4zm3 2a1 1 0 012 0v6a1 1 0 11-2 0V9zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {resp && (
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">Total:</span> {resp.count}
            {resp.next && <span className="ml-3">More pages available</span>}
          </div>
        )}
      </div>

      {/* Modal: View Review */}
      {selectedReview && (
        <div role="dialog" aria-modal="true" aria-labelledby="view-review-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeView} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 id="view-review-title" className="text-lg font-semibold text-gray-800">Review #{selectedReview.id}</h3>
                <div className="text-xs text-gray-500 mt-1">By: {typeof selectedReview.user === 'object' ? String((selectedReview.user as any).id ?? JSON.stringify(selectedReview.user)) : String(selectedReview.user)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  <StarRow rating={selectedReview.rating} />
                </div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${selectedReview.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedReview.status === 'approved' ? 'Approved' : (selectedReview.status ?? 'Pending')}
                  </span>
                </div>
                <button onClick={closeView} className="text-gray-600 hover:text-gray-800 p-2" aria-label="Close">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReview.comment}</div>

              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedReview.images.map((img, idx) => (
                    <a key={img.id} href={img.image} target="_blank" rel="noreferrer" className="block relative group">
                      <img src={img.image} alt={`review-${selectedReview.id}-img-${img.id}`} className="w-full h-40 object-cover rounded" />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">#{idx + 1}</span>
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>Created: {formatDate(selectedReview.created_at)}</div>
                <div>Rating: {selectedReview.rating} / 5</div>
             
              </div>

              <div className="flex justify-end">
                <button onClick={closeView} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllReview;
