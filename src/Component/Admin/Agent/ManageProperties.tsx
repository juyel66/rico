import React, { useState } from 'react';
import { ChevronLeft, Check, Save, Home, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- DEMO DATA ---
const demoProperties = [
  { id: 1, name: 'Luxury Waterfront Villa', location: 'Miami Beach, FL', status: 'Published', type: 'sales', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', assigned: false },
  { id: 13, name: 'Luxury Waterfront Villa', location: 'Miami Beach, FL', status: 'Published', type: 'sales', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', assigned: false },
  { id: 2, name: 'Modern Downtown Penthouse', location: 'New York, NY', status: 'Published', type: 'sales', imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511', assigned: false },
  { id: 3, name: 'Elegant Historic Mansion', location: 'Boston, MA', status: 'Pending Review', type: 'sales', imageUrl: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154', assigned: false },
  { id: 4, name: 'Contemporary Beach House', location: 'Malibu, CA', status: 'Draft', type: 'rentals', imageUrl: 'https://images.unsplash.com/photo-1600607689390-1d5c2a3f0c4f', assigned: false },
  { id: 5, name: 'Stylish City Apartment', location: 'Seattle, WA', status: 'Published', type: 'rentals', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', assigned: false },
];

// --- HELPER COMPONENTS ---
const PropertyStatusBadge = ({ status }) => {
  let classes = '';
  switch (status.toLowerCase()) {
    case 'published':
      classes = 'bg-green-100 text-green-700';
      break;
    case 'pending review':
      classes = 'bg-yellow-100 text-yellow-700';
      break;
    case 'draft':
      classes = 'bg-gray-100 text-gray-700';
      break;
    default:
      classes = 'bg-gray-100 text-gray-700';
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classes} whitespace-nowrap capitalize`}>
      {status}
    </span>
  );
};

const PropertyListItem = ({ property, isSelected, onToggle }) => (
  <div
    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition duration-150 border w-full ${
      isSelected ? 'border-gray-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:bg-gray-50'
    }`}
    onClick={() => onToggle(property.id)}
  >
    <div className="flex items-center flex-grow min-w-0">
      <div
        className={`w-5 h-5 mr-4 flex items-center justify-center border-2 rounded-full transition duration-150 ${
          isSelected ? 'bg-gray-600 border-gray-600' : 'bg-white border-gray-400'
        }`}
      >
        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <img
        src={property.imageUrl}
        alt={property.name}
        className="w-28 h-20 object-cover rounded-md mr-4 flex-shrink-0"
        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/120x80/cccccc/333333?text=N/A"; }}
      />
      <div className="flex-grow min-w-0">
        <p className="text-lg font-semibold text-gray-800 truncate">{property.name}</p>
        <p className="text-sm text-gray-500 truncate">{property.location}</p>
      </div>
    </div>
    <PropertyStatusBadge status={property.status} />
  </div>
);

// --- MAIN COMPONENT ---
const ManageProperties = () => {
  const [properties] = useState(demoProperties);
  const [activeTab, setActiveTab] = useState('sales');
  const agentName = "John Smith";
  const [selectedPropertyIds, setSelectedPropertyIds] = useState(
    demoProperties.filter(p => p.assigned).map(p => p.id)
  );

  const handleToggleProperty = (propertyId) => {
    setSelectedPropertyIds(prevIds =>
      prevIds.includes(propertyId)
        ? prevIds.filter(id => id !== propertyId)
        : [...prevIds, propertyId]
    );
  };

  const handleSaveAssignments = () => {
    console.log(`Saving ${selectedPropertyIds.length} properties for ${agentName}:`, selectedPropertyIds);
    alert('Assignments Saved Successfully! (Check console for data)');
  };

  const handleCancel = () => {
    console.log('Assignment cancelled.');
    alert('Assignment Cancelled.');
  };

  const selectedCount = selectedPropertyIds.length;
  const filteredProperties = properties.filter(p => p.type === activeTab);

  return (
    <div className="  p-6 md:p-10   flex flex-col items-center">
      <div className="w-full bg-white rounded-xl  p-6 md:p-8">

        {/* Header */}
        <header className="mb-8 border-b border-gray-100 pb-4">
          <Link
            to="/dashboard/admin-agent"
            className="flex items-center text-gray-500   w-15 hover:text-gray-800 transition-colors mb-4"
            onClick={() => console.log('Back button clicked')}
            aria-label="Back to Agent List"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-800">Assign Properties to Agent</h1>
          <p className="text-xl font-medium text-gray-500 mt-1">{agentName}</p>
        </header>


         <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Properties</h2>

        {/* Tabs */}
        <div className="flex  gap-3 mb-6">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
              activeTab === 'sales'
                ? 'bg-[#009689] text-white border-[#009689]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('sales')}
          >
            <Home className="w-4 h-4" /> Properties Sales
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
              activeTab === 'rentals'
                ? 'bg-[#009689] text-white border-[#009689]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('rentals')}
          >
            <Building2 className="w-4 h-4" /> Properties Rentals
          </button>
        </div>

        {/* Property Selection List */}
        <main className="space-y-4 mb-8">
         
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {filteredProperties.map((property) => (
              <PropertyListItem
                key={property.id}
                property={property}
                isSelected={selectedPropertyIds.includes(property.id)}
                onToggle={handleToggleProperty}
              />
            ))}
            {filteredProperties.length === 0 && (
              <p className="text-center text-gray-500 py-6">No properties available in this category.</p>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-between items-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 font-medium">
            {selectedCount} property{selectedCount !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-3">
            <button
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 flex items-center bg-teal-600 text-white rounded-lg font-medium shadow-md hover:bg-teal-700 transition"
              onClick={handleSaveAssignments}
            >
              <Save className="w-5 h-5 mr-2" />
              Save Assignments
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ManageProperties;
