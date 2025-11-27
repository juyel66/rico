// src/components/CreatePropertyRentals.jsx
import React, { useState, useRef } from 'react';
import { User, UploadCloud, X, Save, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import LocationCreateProperty from './LocationCreateProperty';
import toast from 'react-hot-toast';

const splitCommaSeparated = (value) => {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://10.10.13.60:8000/api';

const CreatePropertySales = () => {
  const { register, handleSubmit, formState: { errors }, reset, setError, clearErrors } = useForm({ mode: 'onTouched' });

  // Location
  const [location, setLocation] = useState({ lat: 25.79, lng: -80.13, address: '123 Ocean Drive, Miami' });

  // Images
  const [mediaImages, setMediaImages] = useState([]); // {id,url,file,isPrimary}
  const [bedroomImages, setBedroomImages] = useState([]);

  // Mark primary image by id
  const setPrimaryImage = (id) => {
    setMediaImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })));
    setBedroomImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })));
  };

  // Multiple-use arrays
  const [signatureList, setSignatureList] = useState(['']);
  const [interiorAmenities, setInteriorAmenities] = useState(['']);
  const [outdoorAmenities, setOutdoorAmenities] = useState(['']);
  // removed rules, check-in/out, staff states per request

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState('');

  // refs for focusing new inputs
  const interiorRefs = useRef([]);
  const outdoorRefs = useRef([]);
  const signatureRefs = useRef([]);
  // removed rulesRefs and staffNameRefs

  // helper: add files to state with preview
  const handleImageUpload = (e, setState) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImgs = files.map((file, i) => ({
      id: Date.now() + i + Math.random(),
      url: URL.createObjectURL(file),
      file,
      isPrimary: false
    }));
    setState(prev => [...prev, ...newImgs]);
    e.target.value = null;
    setMediaError('');
  };

  const removeImage = (id, setState) => {
    setState(prev => prev.filter(i => i.id !== id));
  };

  // array helpers (shared)
  const updateArray = (setter, arr, idx, value) => {
    const copy = [...arr]; copy[idx] = value; setter(copy);
  };
  const addArrayItem = (setter, arr, refs) => {
    setter(prev => {
      const next = [...prev, ''];
      // focus newly added item when available
      setTimeout(() => {
        const i = next.length - 1;
        if (refs && refs.current[i]) refs.current[i].focus();
      }, 60);
      return next;
    });
  };
  const removeArrayItem = (setter, arr, idx) => {
    if (arr.length === 1) { setter(['']); return; }
    setter(prev => prev.filter((_, i) => i !== idx));
  };

  // signature helpers
  const addSignatureItem = () => {
    setSignatureList(prev => {
      const next = [...prev, ''];
      setTimeout(() => {
        const i = next.length - 1;
        if (signatureRefs.current[i]) signatureRefs.current[i].focus();
      }, 60);
      return next;
    });
  };
  const removeSignatureItem = (idx) => {
    setSignatureList(prev => prev.filter((_, i) => i !== idx));
    if (signatureList.length === 1) setSignatureList(['']);
  };

  // metadata builder
  const buildMediaMetadata = (imgs, category, startOrder=0) => imgs.map((img, idx) => ({
    category,
    caption: `${category} image ${startOrder + idx + 1}`,
    is_primary: !!img.isPrimary,
    order: startOrder + idx
  }));

  // helper to focus + scroll to a field by name or selector
  const focusField = (nameOrSelector) => {
    try {
      let el = null;
      if (typeof nameOrSelector === 'string') {
        el = document.querySelector(`[name="${nameOrSelector}"]`) || document.querySelector(nameOrSelector);
      } else {
        el = nameOrSelector;
      }
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  };

  // validate basic fields + media (shows toast + focuses first missing field)
  const validateBeforeSubmit = (values) => {
    const required = ['title', 'price', 'address'];
    const labels = { title: 'Title', price: 'Price', address: 'Address' };

    for (const field of required) {
      if (!values[field] && values[field] !== 0) {
        setError(field, { type: 'required', message: `${labels[field]} is required` });
        toast.error(`${labels[field]} is required`);
        focusField(field);
        return false;
      }
    }

    const totalFiles = (mediaImages.length || 0) + (bedroomImages.length || 0);
    if (totalFiles === 0) {
      setMediaError('At least one property image is required.');
      toast.error('At least one property image is required.');
      const fileEl = document.querySelector('input[type="file"]');
      if (fileEl) fileEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return true;
  };

  // final submit
  const onSubmit = async (values) => {
    clearErrors();
    setMediaError('');
    if (!validateBeforeSubmit(values)) return;

    setSubmitting(true);
    try {
      const processed = {
        title: values.title,
        description: values.description || '',
        price: values.price ? String(values.price) : '0.00',
        listing_type: values.property_type === 'sales' ? 'sale' : 'rent',
        status: (values.status || 'draft').toLowerCase().replace(/\s+/g, '_'),
        address: values.address || location.address,
        city: values.city || '',
        add_guest: Number(values.add_guest) || 1,
        bedrooms: Number(values.bedrooms) || 0,
        bathrooms: Number(values.bathrooms) || 0,
        pool: Number(values.pool) || 0,
        signature_distinctions: signatureList.filter(Boolean),
        interior_amenities: interiorAmenities.filter(Boolean),
        outdoor_amenities: outdoorAmenities.filter(Boolean),
        // rules, check-in/out, staff removed per request
        calendar_link: values.calendar_link || '',
        seo_title: values.seo_title || '',
        seo_description: values.seo_description || '',
        latitude: location.lat ?? null,
        longitude: location.lng ?? null
      };

      // console log processed payload
      console.log('--- Processed payload to send ---');
      console.log(JSON.stringify(processed, null, 2));

      // Build FormData (keeps compatibility)
      const fd = new FormData();
      const append = (k, v) => {
        if (v === undefined || v === null) return;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') fd.append(k, String(v));
        else fd.append(k, JSON.stringify(v));
      };

      append('title', processed.title);
      append('description', processed.description);
      append('price', processed.price);
      append('listing_type', processed.listing_type);
      append('status', processed.status);
      append('address', processed.address);
      append('city', processed.city);
      append('add_guest', processed.add_guest);
      append('bedrooms', processed.bedrooms);
      append('bathrooms', processed.bathrooms);
      append('pool', processed.pool);
      append('signature_distinctions', processed.signature_distinctions);
      append('interior_amenities', processed.interior_amenities);
      append('outdoor_amenities', processed.outdoor_amenities);
      // removed rules, check-in/out, staff appends
      append('calendar_link', processed.calendar_link);
      append('seo_title', processed.seo_title);
      append('seo_description', processed.seo_description);
      append('latitude', processed.latitude);
      append('longitude', processed.longitude);

      // media metadata & files
      const mediaMeta = buildMediaMetadata(mediaImages, 'media', 0);
      const bedroomMeta = buildMediaMetadata(bedroomImages, 'bedroom', mediaImages.length);
      const combinedMeta = [...mediaMeta, ...bedroomMeta];
      const anyPrimary = combinedMeta.some(m => m.is_primary);
      if (!anyPrimary && combinedMeta.length > 0) combinedMeta[0].is_primary = true;

      mediaImages.forEach(img => fd.append('media_files', img.file));
      bedroomImages.forEach(img => fd.append('media_files', img.file));
      mediaImages.forEach(img => fd.append('media_images', img.file));
      bedroomImages.forEach(img => fd.append('bedrooms_images', img.file));
      combinedMeta.forEach(meta => fd.append('media_metadata', JSON.stringify(meta)));

      console.log('--- FormData entries ---');
      for (const pair of fd.entries()) {
        const [k, v] = pair;
        if (v instanceof File) console.log(k, 'File:', v.name);
        else console.log(k, (typeof v === 'string' && v.length > 200) ? v.slice(0, 200) + '...' : v);
      }

      // send
      const access = (() => { try { return localStorage.getItem('auth_access'); } catch { return null; } })();
      const headers = {};
      if (access) headers['Authorization'] = `Bearer ${access}`;

      const res = await fetch(`${API_BASE}/villas/properties/`, { method: 'POST', headers, body: fd });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('Create failed:', res.status, body);
        const message = body && (body.error || JSON.stringify(body)) ? (body.error || JSON.stringify(body)) : `HTTP ${res.status}`;
        if (message.includes('At least one media')) {
          setMediaError('At least one property image is required by the server.');
          toast.error('Server requires at least one property image.');
        } else {
          toast.error(`Failed to create property: ${message}`);
        }
        setSubmitting(false);
        return;
      }

      console.log('Created property response:', body);
      toast.success('Property created successfully.');
      

      // reset UI (keep location)
      reset();
      setMediaImages([]);
      setBedroomImages([]);
      setSignatureList(['']);
      setInteriorAmenities(['']);
      setOutdoorAmenities(['']);
      // removed resets for rules, check-in/out, staff
      setSubmitting(false);
    } catch (err) {
      console.error('Submission error', err);
      toast.error('Submission error — check console.');
      setSubmitting(false);
    }
  };

  // Single flat UI — no FormCard wrappers
  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen w-full">
      <Link to="/dashboard/admin-properties-rentals" className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4">
        <ChevronLeft className="w-5 h-5 mr-1" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <div className="lg:flex space-x-10 justify-between items-center mb-6 mt-2 w-full">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Create New Property Listing</h1>
          <p className="text-gray-500 mt-2">Fill out the details to create a comprehensive property listing.</p>
        </div>
        <div className="flex mt-2 items-center gap-4">
          <button type="button" className="border border-gray-300 text-black flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition shadow-sm"><User className="lg:h-5 lg:w-5" /> Preview Agent Portal</button>
        </div>
      </div>

      <div className='text-2xl mt-2 font-semibold mb-2'>Add Location</div>
      <div className='mb-5'>
        <LocationCreateProperty lat={location.lat} lng={location.lng} text={location.address}
          onLocationAdd={(villaData) => setLocation({ lat: villaData.lat, lng: villaData.lng, address: villaData.name, description: villaData.description })} 
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-full mx-auto space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
            <input name="title" {...register('title')} className={`w-full border rounded-lg p-3 ${errors.title ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" {...register('description')} rows="3" className="w-full border rounded-lg p-3 bg-gray-50" />
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input name="price" type="number" {...register('price')} className={`w-full border rounded-lg p-3 ${errors.price ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>}
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select name="property_type" {...register('property_type')} className="w-full border rounded-lg p-3 bg-gray-50">
              <option value="">Select type</option>
              {/* Rentals option removed */}
              <option value="sales">Sales</option>
            </select>
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" {...register('status')} className="w-full border rounded-lg p-3 bg-gray-50">
              <option>Draft</option>
              <option>Pending Review</option>
              <option>Published</option>
              <option>Archived</option>
            </select>
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Guest</label>
            <input name="add_guest" type='number' placeholder="Add guest" {...register('add_guest')} className="w-full border rounded-lg p-3" />
          </div>

          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
            <input name="bedrooms" type="number" {...register('bedrooms')} className="w-full border rounded-lg p-3" />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
            <input name="bathrooms" type="number" {...register('bathrooms')} className="w-full border rounded-lg p-3" />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pools</label>
            <input name="pool" type="number" {...register('pool')} className="w-full border rounded-lg p-3" />
          </div>

          <div className="col-span-12 md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input name="address" {...register('address')} className={`w-full border rounded-lg p-3 ${errors.address ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input name="city" {...register('city')} className="w-full border rounded-lg p-3" />
          </div>
        </div>

        {/* Media & Assets */}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Upload Media Images</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {mediaImages.map(img => (
              <div key={img.id} className="relative border rounded-xl overflow-hidden h-32">
                <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute left-2 bottom-2 flex gap-2">
                  <button type="button" onClick={() => setPrimaryImage(img.id)} className="px-2 py-1 bg-white/80 rounded text-xs">★</button>
                </div>
                <div className="absolute top-2 right-2">
                  <button onClick={() => removeImage(img.id, setMediaImages)} type="button" className="bg-red-500 rounded-full p-1 text-white"><X className="w-3 h-3" /></button>
                </div>
                {img.isPrimary && <span className="absolute top-2 left-2 bg-teal-600 text-white text-xs px-2 py-0.5 rounded">Primary</span>}
              </div>
            ))}

            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer text-gray-500 hover:border-teal-500 hover:text-teal-600 transition h-32">
              <UploadCloud className="w-6 h-6 mb-1" />
              <p className="text-sm">Upload Media Images</p>
              <input name="media_files" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, setMediaImages)} />
            </label>
          </div>

          {mediaError && <p className="text-sm text-red-600 mt-2">{mediaError}</p>}
        </div>

        {/* Bedrooms Images */}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bedrooms Images</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {bedroomImages.map(img => (
              <div key={img.id} className="relative border rounded-xl overflow-hidden h-32">
                <img src={img.url} alt="bedroom" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <button onClick={() => removeImage(img.id, setBedroomImages)} type="button" className="bg-red-500 rounded-full p-1 text-white"><X className="w-3 h-3" /></button>
                </div>
                {img.isPrimary && <span className="absolute top-2 left-2 bg-teal-600 text-white text-xs px-2 py-0.5 rounded">Primary</span>}
              </div>
            ))}

            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer text-gray-500 hover:border-teal-500 hover:text-teal-600 transition h-32">
              <UploadCloud className="w-6 h-6 mb-1" />
              <p className="text-sm">Upload Bedrooms Images</p>
              <input name="bedrooms_images" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, setBedroomImages)} />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Link (optional)</label>
          <input name="calendar_link" {...register('calendar_link')} className="w-full border rounded-lg p-3 bg-gray-50" placeholder="https://calendly.com/..." />
        </div>

        {/* Signature Distinctions as multiple items */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Signature Distinctions</label>
          <div className="space-y-2">
            {signatureList.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  ref={el => signatureRefs.current[i] = el}
                  value={s}
                  onChange={e => updateArray(setSignatureList, signatureList, i, e.target.value)}
                  placeholder="e.g. Ocean view"
                  className="flex-1 border rounded-lg p-2 bg-gray-50"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => addSignatureItem()} className="px-3 py-2 bg-teal-600 text-white rounded-lg">Add</button>
                  <button type="button" onClick={() => removeSignatureItem(i)} className="px-2 py-1 bg-red-100 text-red-600 rounded-lg">x</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floor Details */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Indoor Amenities</label>
            <div className="space-y-3">
              {interiorAmenities.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input ref={el => interiorRefs.current[i] = el} value={v} onChange={e => updateArray(setInteriorAmenities, interiorAmenities, i, e.target.value)} placeholder="e.g. WiFi" className="flex-1 border rounded-lg p-2 bg-gray-50" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addArrayItem(setInteriorAmenities, interiorAmenities, interiorRefs)} className="px-3 py-2 bg-teal-600 text-white rounded-lg">Add</button>
                    <button type="button" onClick={() => removeArrayItem(setInteriorAmenities, interiorAmenities, i)} className="px-2 py-1 bg-red-100 text-red-600 rounded-lg">x</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Outdoor Amenities</label>
            <div className="space-y-3">
              {outdoorAmenities.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input ref={el => outdoorRefs.current[i] = el} value={v} onChange={e => updateArray(setOutdoorAmenities, outdoorAmenities, i, e.target.value)} placeholder="e.g. Parking" className="flex-1 border rounded-lg p-2 bg-gray-50" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addArrayItem(setOutdoorAmenities, outdoorAmenities, outdoorRefs)} className="px-3 py-2 bg-teal-600 text-white rounded-lg">Add</button>
                    <button type="button" onClick={() => removeArrayItem(setOutdoorAmenities, outdoorAmenities, i)} className="px-2 py-1 bg-red-100 text-red-600 rounded-lg">x</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <input name="seo_title" {...register('seo_title')} placeholder="SEO title" className="w-full border rounded-lg p-3 bg-gray-50" />
          </div>
          <div className="col-span-12">
            <textarea name="seo_description" {...register('seo_description')} placeholder="SEO description" className="w-full border rounded-lg p-3 bg-gray-50" rows="2" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-6 w-full mb-10">
          <button type="submit" className="flex items-center justify-center w-full px-4 py-3 text-white rounded-lg transition shadow-md bg-teal-600 border border-teal-700 hover:bg-teal-700">
            {submitting ? 'Creating…' : <><img className='mr-2 w-5 h-5' src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760999922/Icon_41_fxo3ap.png" alt="icon" /> Create Property</>}
          </button>

          <button type="button" className="flex items-center justify-center w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-sm" onClick={() => toast('Save as draft clicked — implement server call with status=draft')}>
            <Save className="w-5 h-5 mr-2" /> Save as Draft
          </button>

          <Link to="/dashboard/admin-properties-rentals" className="flex items-center justify-center w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default CreatePropertySales;
