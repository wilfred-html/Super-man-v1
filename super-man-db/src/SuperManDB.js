import React, { useState, useEffect } from 'react';
import { Trash, Edit, Search, Plus, FileText, ChevronDown, ChevronUp, X, Check, Star, RefreshCw } from 'lucide-react';

// Base API settings
const BASE_ID = 'app6js5HlKSJaPs9J';
const CONTENT_TABLE_ID = 'tblMImhEcmQPpdWtz';
const ACTIONS_TABLE_ID = 'tblt0hrAShIrkVWz6';

// Status options for various content types
const STATUS_OPTIONS = [
  { id: 'selomspGIoKJRGw11', name: 'In-Progress', color: 'bg-red-500' },
  { id: 'selshn08ovgLJn594', name: 'Needs Review', color: 'bg-yellow-500' },
  { id: 'selnIShuE3Rlripl0', name: 'Approved', color: 'bg-green-500' }
];

const SuperManDB = () => {
  // State variables
  const [activeTab, setActiveTab] = useState('content');
  const [contentRecords, setContentRecords] = useState([]);
  const [actionRecords, setActionRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    text: '',
    textURL: '',
    textStatus: '',
    publishDate: '',
    schedule: false,
    published: false,
    rate: 0
  });
  const [expandedRecords, setExpandedRecords] = useState({});
  const [notification, setNotification] = useState(null);

  // Fetch content records from Airtable
  const fetchContentRecords = async () => {
    setLoading(true);
    try {
      const response = await window.antml.invoke('list_records', {
        baseId: BASE_ID,
        tableId: CONTENT_TABLE_ID,
        maxRecords: 100
      });
      setContentRecords(response.records || []);
    } catch (error) {
      showNotification(`Error fetching content: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch action records from Airtable
  const fetchActionRecords = async () => {
    setLoading(true);
    try {
      const response = await window.antml.invoke('list_records', {
        baseId: BASE_ID,
        tableId: ACTIONS_TABLE_ID,
        maxRecords: 100
      });
      setActionRecords(response.records || []);
    } catch (error) {
      showNotification(`Error fetching actions: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Display notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Create new content record
  const createContentRecord = async () => {
    setLoading(true);
    try {
      const fields = {
        'Title': formData.title,
        'Description': formData.description,
        'Text': formData.text,
        'Text URL': formData.textURL,
        'Text Status': formData.textStatus ? { id: formData.textStatus } : null,
        'Publish Date': formData.publishDate ? formData.publishDate : null,
        'Schedule': formData.schedule,
        'Published': formData.published,
        'Rate': formData.rate || 0
      };

      await window.antml.invoke('create_record', {
        baseId: BASE_ID,
        tableId: CONTENT_TABLE_ID,
        fields: fields
      });
      
      showNotification('Content created successfully!');
      setIsFormOpen(false);
      resetForm();
      fetchContentRecords();
    } catch (error) {
      showNotification(`Error creating content: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update existing content record
  const updateContentRecord = async () => {
    if (!selectedRecord) return;
    
    setLoading(true);
    try {
      const fields = {
        'Title': formData.title,
        'Description': formData.description,
        'Text': formData.text,
        'Text URL': formData.textURL,
        'Text Status': formData.textStatus ? { id: formData.textStatus } : null,
        'Publish Date': formData.publishDate ? formData.publishDate : null,
        'Schedule': formData.schedule,
        'Published': formData.published,
        'Rate': formData.rate || 0
      };

      await window.antml.invoke('update_records', {
        baseId: BASE_ID,
        tableId: CONTENT_TABLE_ID,
        records: [
          {
            id: selectedRecord.id,
            fields: fields
          }
        ]
      });
      
      showNotification('Content updated successfully!');
      setIsFormOpen(false);
      resetForm();
      fetchContentRecords();
    } catch (error) {
      showNotification(`Error updating content: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete content record
  const deleteContentRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    setLoading(true);
    try {
      await window.antml.invoke('delete_records', {
        baseId: BASE_ID,
        tableId: CONTENT_TABLE_ID,
        recordIds: [recordId]
      });
      
      showNotification('Content deleted successfully!');
      fetchContentRecords();
    } catch (error) {
      showNotification(`Error deleting content: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search content records
  const searchContentRecords = async () => {
    if (!searchTerm.trim()) {
      fetchContentRecords();
      return;
    }
    
    setLoading(true);
    try {
      const response = await window.antml.invoke('search_records', {
        baseId: BASE_ID,
        tableId: CONTENT_TABLE_ID,
        searchTerm: searchTerm
      });
      
      setContentRecords(response.records || []);
    } catch (error) {
      showNotification(`Error searching content: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle record expansion
  const toggleRecordExpansion = (recordId) => {
    setExpandedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  // Open edit form with record data
  const openEditForm = (record) => {
    const fields = record.fields;
    setSelectedRecord(record);
    setFormData({
      title: fields['Title'] || '',
      description: fields['Description'] || '',
      text: fields['Text'] || '',
      textURL: fields['Text URL'] || '',
      textStatus: fields['Text Status']?.[0]?.id || '',
      publishDate: fields['Publish Date'] || '',
      schedule: fields['Schedule'] || false,
      published: fields['Published'] || false,
      rate: fields['Rate'] || 0
    });
    setFormMode('edit');
    setIsFormOpen(true);
  };

  // Open create form
  const openCreateForm = () => {
    resetForm();
    setFormMode('create');
    setIsFormOpen(true);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      text: '',
      textURL: '',
      textStatus: '',
      publishDate: '',
      schedule: false,
      published: false,
      rate: 0
    });
    setSelectedRecord(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formMode === 'create') {
      createContentRecord();
    } else {
      updateContentRecord();
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchContentRecords();
    fetchActionRecords();
  }, []);

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        fill={i < rating ? '#FFD700' : 'none'} 
        stroke={i < rating ? '#FFD700' : '#888'} 
      />
    ));
  };

  // Get status badge color
  const getStatusBadge = (statusId) => {
    const status = STATUS_OPTIONS.find(s => s.id === statusId);
    return status ? (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.color} text-white`}>
        {status.name}
      </span>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-white text-2xl font-bold flex items-center">
              <FileText className="mr-2" />
              Super-man DB
              <span className="ml-2 text-sm bg-blue-800 px-2 py-1 rounded">v1.0</span>
            </h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  fetchContentRecords();
                  fetchActionRecords();
                }}
                className="p-2 rounded-full bg-blue-500 hover:bg-blue-700 text-white"
                title="Refresh Data"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'actions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('actions')}
          >
            Actions
          </button>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            {/* Search and Add Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center w-1/2">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search content..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchContentRecords()}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                <button
                  className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={searchContentRecords}
                >
                  Search
                </button>
              </div>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                onClick={openCreateForm}
              >
                <Plus size={18} className="mr-1" /> Add Content
              </button>
            </div>

            {/* Content List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : contentRecords.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No content found. Create some content to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contentRecords.map(record => (
                  <div key={record.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                      onClick={() => toggleRecordExpansion(record.id)}
                    >
                      <div className="flex items-center">
                        <div className="mr-2">
                          {expandedRecords[record.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{record.fields['Title'] || 'Untitled'}</h3>
                          <p className="text-gray-500 text-sm">{record.fields['Content ID'] || 'No ID'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          {renderStars(record.fields['Rate'] || 0)}
                        </div>
                        {record.fields['Text Status'] && 
                          getStatusBadge(record.fields['Text Status'][0]?.id)}
                        <div className="flex space-x-2">
                          <button 
                            className="p-1 rounded text-blue-500 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm(record);
                            }}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="p-1 rounded text-red-500 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteContentRecord(record.id);
                            }}
                            title="Delete"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedRecords[record.id] && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-gray-600 text-sm font-semibold">Description</p>
                            <p className="text-gray-800">{record.fields['Description'] || 'No description'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-semibold">Text URL</p>
                            <p className="text-gray-800 truncate">
                              {record.fields['Text URL'] ? (
                                <a 
                                  href={record.fields['Text URL']} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  {record.fields['Text URL']}
                                </a>
                              ) : 'No URL'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-semibold">Publish Date</p>
                            <p className="text-gray-800">{record.fields['Publish Date'] || 'Not scheduled'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-semibold">Created</p>
                            <p className="text-gray-800">{record.fields['Created'] || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-semibold">Status</p>
                            <div className="flex space-x-2 mt-1">
                              <div className="flex items-center">
                                <span className="text-gray-600 text-sm mr-2">Schedule:</span>
                                {record.fields['Schedule'] ? 
                                  <span className="text-green-500"><Check size={16} /></span> : 
                                  <span className="text-red-500"><X size={16} /></span>
                                }
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-600 text-sm mr-2">Published:</span>
                                {record.fields['Published'] ? 
                                  <span className="text-green-500"><Check size={16} /></span> : 
                                  <span className="text-red-500"><X size={16} /></span>
                                }
                              </div>
                            </div>
                          </div>
                          {record.fields['Text'] && (
                            <div className="col-span-2">
                              <p className="text-gray-600 text-sm font-semibold">Text Content</p>
                              <p className="text-gray-800 whitespace-pre-line">{record.fields['Text']}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div>
            {/* Actions List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : actionRecords.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No actions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionRecords.map(record => (
                  <div key={record.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{record.fields['Action Name'] || 'Untitled Action'}</h3>
                        <p className="text-gray-500 text-sm">{record.fields['Action'] || ''}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <span className="text-gray-600 text-sm mr-2">Active:</span>
                          {record.fields['Active'] ? 
                            <span className="text-green-500"><Check size={16} /></span> : 
                            <span className="text-red-500"><X size={16} /></span>
                          }
                        </div>
                        {record.fields['Status'] && (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full 
                            ${record.fields['Status'][0]?.name === 'Todo' ? 'bg-red-200 text-red-800' : 
                              record.fields['Status'][0]?.name === 'In progress' ? 'bg-yellow-200 text-yellow-800' : 
                              'bg-green-200 text-green-800'}`}
                          >
                            {record.fields['Status'][0]?.name || 'Unknown'}
                          </span>
                        )}
                      </div>
                    </div>
                    {record.fields['Notes'] && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-sm font-semibold">Notes</p>
                        <p className="text-gray-800 text-sm">{record.fields['Notes']}</p>
                      </div>
                    )}
                    {record.fields['Webhook URL'] && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-sm font-semibold">Webhook URL</p>
                        <p className="text-blue-500 hover:underline text-sm truncate">
                          <a href={record.fields['Webhook URL']} target="_blank" rel="noopener noreferrer">
                            {record.fields['Webhook URL']}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {formMode === 'create' ? 'Create New Content' : 'Edit Content'}
                </h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsFormOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Text Content
                    </label>
                    <textarea
                      name="text"
                      value={formData.text}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Text URL
                    </label>
                    <input
                      type="url"
                      name="textURL"
                      value={formData.textURL}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Text Status
                    </label>
                    <select
                      name="textStatus"
                      value={formData.textStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select status</option>
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Publish Date
                    </label>
                    <input
                      type="date"
                      name="publishDate"
                      value={formData.publishDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Rating
                    </label>
                    <select
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[0, 1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>
                          {num} star{num !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="schedule"
                      id="schedule"
                      checked={formData.schedule}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="schedule" className="text-gray-700 text-sm font-medium">
                      Schedule
                    </label>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="published"
                      id="published"
                      checked={formData.published}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="published" className="text-gray-700 text-sm font-medium">
                      Published
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 ${formMode === 'create' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      formMode === 'create' ? 'Create Content' : 'Update Content'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white max-w-md`}>
            {notification.message}
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperManDB;