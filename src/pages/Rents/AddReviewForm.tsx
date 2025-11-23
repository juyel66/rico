import React, { useState } from 'react';
// ⚠️ IMPORTANT: Ensure SubmitHandler is imported for correct TypeScript usage
import type { DragEvent, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';

interface ReviewInputs {
  reviewText: string;
}

const AddReviewForm: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewInputs>({
    defaultValues: { reviewText: '' },
  });

  const MAX_FILE_SIZE_KB = 2048; // 2MB
  const MAX_FILES = 6;

  const processFiles = (newFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    const fileArray = Array.from(newFiles);

    for (const file of fileArray) {
      // ⚠️ Note: I am NOT restricting file types here, based on your prompt's previous mention of "Images, Docs, PDFs" in the file label.
      // I am only restricting size. If you want image-only, add: if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_FILE_SIZE_KB * 1024) continue;
      validFiles.push(file);
    }

    let updated = [...files, ...validFiles];
    if (updated.length > MAX_FILES) {
      updated = updated.slice(0, MAX_FILES);
      alert(
        `Maximum ${MAX_FILES} files allowed. Only first ${MAX_FILES} kept.`
      );
    }

    setFiles(updated);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemoveFile = (name: string) => {
    setFiles(files.filter((file) => file.name !== name));
  };

  // Drag Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  // Form Submission Handler
  const onSubmit: SubmitHandler<ReviewInputs> = (data) => {
    if (rating === 0) {
      alert('Please select a rating!');
      return;
    }

    const result = {
      review: data.reviewText,
      rating,
      uploadedFiles: files.map((f) => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        type: f.type,
      })),
    };

    console.clear();
    console.log('✅ Review Submitted', result);
    alert('Review submitted successfully! Check console for details.');
  };

  // Star Icon Component
  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={filled ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`w-5 h-5 transition-colors duration-200 ${
        filled ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
      }`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 4.298c.139.28.423.447.72.447h4.722a.562.562 0 01.385.91l-3.844 3.692a.563.563 0 01-.183.568l1.173 4.887a.563.563 0 01-.84.622l-4.302-2.583a.563.563 0 01-.588 0L6.96 19.427a.562.562 0 01-.84-.622l1.173-4.887a.563.563 0 01-.183-.568L3.05 9.154a.562.562 0 01.385-.91h4.722c.297 0 .581-.167.72-.447l2.125-4.298z"
      />
    </svg>
  );

  return (
    // Max width set to "xl" for better responsiveness and centering
    <div className="">
      <div>
        <header className="mb-6 mt-5 text-center ">
          <h2 className="text-4xl  font-bold text-gray-800">
            Add Your Review
          </h2>
        </header>
      </div>

      <div className=" mx-auto  mt-8 p-8 bg-white shadow-lg rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm mt-2 mb-4">
          Your email address will not be published.{' '}
          <span className="text-red-500">Required fields are marked</span>
        </p>

        {/* 🟢 Login Section Added Here, matching the red color in the image */}
        <p className="mb-4 text-sm font-medium text-red-500">
          Please{' '}
          <a href="/login" className="text-teal-600 hover:underline">
            login
          </a>{' '}
          to write review!
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Rating */}
          <div className="mb-6">
            <p className="text-base font-semibold text-gray-800 mb-2">
              Your rating: <span className="text-red-500">*</span>
            </p>
            <div
              className="flex cursor-pointer"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                >
                  <StarIcon filled={i <= (hoverRating || rating)} />
                </span>
              ))}
            </div>
            {rating === 0 && (
              <span className="text-red-500 text-xs mt-1 block">
                Rating is required.
              </span>
            )}
          </div>

          {/* Review */}
          <div className="mb-6">
            <label
              htmlFor="reviewText"
              className="block text-base font-semibold text-gray-800 mb-1"
            >
              Review <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('reviewText', {
                required: 'Review is required',
                minLength: {
                  value: 20,
                  message: 'Minimum 20 characters required',
                },
              })}
              id="reviewText"
              rows={5}
              placeholder="Write your review"
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-teal-500 focus:border-teal-500"
            ></textarea>
            {errors.reviewText && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.reviewText.message}
              </span>
            )}
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-base font-semibold text-gray-800 mb-1">
              File Upload
            </label>

            {/* File Drop Zone / Selector Area */}
            <div className="mb-6">
              <div
                className={`flex items-center justify-center gap-4 p-4 rounded-lg transition-all duration-200 border-2 ${
                  isDragActive
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-green-200 bg-green-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="uploadFiles"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="uploadFiles"
                  className="cursor-pointer text-sm font-medium"
                >
                  <span className="inline-block px-4 py-1.5 bg-[#00968933] text-gray-800 rounded hover:bg-green-400 transition border-gray-700">
                    Choose File
                  </span>
                </label>
                <span className="text-sm text-gray-700 text-center">
                  {files.length > 0
                    ? `${files.length} File(s) Selected`
                    : 'No File Chosen'}
                </span>
              </div>
            </div>

            {/* Info Box (Blue) */}
            <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-blue-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                You can upload up to <b>{MAX_FILES}</b> photos, each photo
                maximum size is <b>{MAX_FILE_SIZE_KB} kilobytes</b>.
              </p>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm max-h-32 overflow-y-auto p-2 rounded-lg bg-white border border-gray-200">
                {files.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded truncate"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(file.name)}
                      type="button"
                      className="text-red-500 hover:text-red-700 ml-2 text-lg"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            className="lg:w-40 py-3 w-full bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddReviewForm;
