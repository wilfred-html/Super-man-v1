
// Configuration
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID = 'app6js5HlKSJaPs9J';
const CONTENT_TABLE_ID = 'tblMImhEcmQPpdWtz';
const ACTIONS_TABLE_ID = 'tblt0hrAShIrkVWz6';

// DOM Elements
const app = document.getElementById('app');
const loading = document.getElementById('loading');
const tokenModal = document.getElementById('tokenModal');
const toast = document.getElementById('toast');

// Views
const views = {
  dashboard: document.getElementById('dashboard-view'),
  content: document.getElementById('content-view'),
  actions: document.getElementById('actions-view'),
  calendar: document.getElementById('calendar-view'),
  singleContent: document.getElementById('single-content-view'),
  createContent: document.getElementById('create-content-view')
};

// Nav Elements
const navItems = {
  dashboard: document.getElementById('nav-dashboard'),
  content: document.getElementById('nav-content'),
  actions: document.getElementById('nav-actions'),
  calendar: document.getElementById('nav-calendar')
};

// Global State
let state = {
  currentView: 'dashboard',
  contentData: [],
  actionsData: [],
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 12,
  currentFilter: 'all',
  currentContentId: null,
  currentMonth: new Date()
};

// Utility Functions
function showLoading() { loading.style.display = 'flex'; }
function hideLoading() { loading.style.display = 'none'; }

function showToast(message, type = 'success', description = '') {
  const toastEl = document.getElementById('toast');
  const messageEl = document.getElementById('toast-message');
  const descriptionEl = document.getElementById('toast-description');
  const iconEl = document.getElementById('toast-icon');
  const iconI = document.getElementById('toast-icon-i');
  
  messageEl.textContent = message;
  descriptionEl.textContent = description;
  
  if (type === 'success') {
    toastEl.className = 'fixed bottom-4 right-4 px-4 py-3 bg-gradient-to-br from-dark-100 to-dark-200 border border-green-600/30 rounded-lg shadow-modern transform transition-all duration-300 z-50 flex items-center';
    iconEl.className = 'w-8 h-8 rounded-full bg-gradient-to-br from-green-600/20 to-green-500/20 flex items-center justify-center mr-3 shadow-lg';
    iconI.className = 'fas fa-check text-green-400';
  } else if (type === 'error') {
    toastEl.className = 'fixed bottom-4 right-4 px-4 py-3 bg-gradient-to-br from-dark-100 to-dark-200 border border-red-600/30 rounded-lg shadow-modern transform transition-all duration-300 z-50 flex items-center';
    iconEl.className = 'w-8 h-8 rounded-full bg-gradient-to-br from-red-600/20 to-red-500/20 flex items-center justify-center mr-3 shadow-lg';
    iconI.className = 'fas fa-times text-red-400';
  } else if (type === 'info') {
    toastEl.className = 'fixed bottom-4 right-4 px-4 py-3 bg-gradient-to-br from-dark-100 to-dark-200 border border-primary-600/30 rounded-lg shadow-modern transform transition-all duration-300 z-50 flex items-center';
    iconEl.className = 'w-8 h-8 rounded-full bg-gradient-to-br from-primary-600/20 to-primary-500/20 flex items-center justify-center mr-3 shadow-lg';
    iconI.className = 'fas fa-info text-primary-400';
  }
  
  toastEl.classList.remove('translate-y-20', 'opacity-0');
  toastEl.classList.add('translate-y-0', 'opacity-100');
  
  setTimeout(() => {
    toastEl.classList.remove('translate-y-0', 'opacity-100');
    toastEl.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusColors(status) {
  if (!status) return { bg: 'bg-gradient-to-r from-gray-600/20 to-gray-500/20', text: 'text-gray-400' };
  
  switch(status) {
    case 'In-Progress':
    case 'In Progress':
      return { bg: 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20', text: 'text-yellow-400' };
    case 'Needs Review':
      return { bg: 'bg-gradient-to-r from-orange-600/20 to-orange-500/20', text: 'text-orange-400' };
    case 'Approved':
      return { bg: 'bg-gradient-to-r from-green-600/20 to-green-500/20', text: 'text-green-400' };
    case 'Scheduled':
      return { bg: 'bg-gradient-to-r from-blue-600/20 to-blue-500/20', text: 'text-blue-400' };
    case 'Published':
      return { bg: 'bg-gradient-to-r from-purple-600/20 to-purple-500/20', text: 'text-purple-400' };
    default:
      return { bg: 'bg-gradient-to-r from-gray-600/20 to-gray-500/20', text: 'text-gray-400' };
  }
}

// Now getOverallStatus expects an object of fields.
function getOverallStatus(fields) {
  if (fields.Published) return 'Published';
  if (fields.Schedule) return 'Scheduled';
  
  const textStatus = fields['Text Status'];
  const imageStatus = fields['Image Status'];
  
  if (!textStatus || !imageStatus) return 'In Progress';
  
  if (textStatus === 'Approved' && imageStatus === 'Approved') {
    return 'Approved';
  } else if (textStatus === 'Needs Review' || imageStatus === 'Needs Review') {
    return 'Needs Review';
  } else {
    return 'In Progress';
  }
}

// API Functions
function getAuthHeaders() {
  const token = "patWIccg6g6M6RUeN.3335205e114ef1f17aec15b16ca10146602f2b01d240da007e8cc4bf89a4937e";
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function fetchContent() {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${CONTENT_TABLE_ID}?pageSize=100`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch content');
    const data = await response.json();
    state.contentData = data.records;
    return state.contentData;
  } catch (error) {
    console.error('Error fetching content:', error);
    showToast('Error fetching content', 'error', 'Please check your connection');
    return [];
  }
}

async function fetchActions() {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${ACTIONS_TABLE_ID}?filterByFormula={Active}=TRUE()`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch actions');
    const data = await response.json();
    state.actionsData = data.records;
    return state.actionsData;
  } catch (error) {
    console.error('Error fetching actions:', error);
    showToast('Error fetching actions', 'error', 'Please check your connection');
    return [];
  }
}

async function updateContentStatus(contentId, updates) {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${CONTENT_TABLE_ID}/${contentId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fields: updates })
    });
    if (!response.ok) throw new Error('Failed to update content');
    const data = await response.json();
    const index = state.contentData.findIndex(item => item.id === contentId);
    if (index !== -1) {
      state.contentData[index].fields = { ...state.contentData[index].fields, ...updates };
    }
    return data;
  } catch (error) {
    console.error('Error updating content:', error);
    showToast('Error updating content', 'error', 'Please try again');
    throw error;
  }
}

async function createNewContent(contentData) {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${CONTENT_TABLE_ID}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fields: contentData })
    });
    if (!response.ok) throw new Error('Failed to create content');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating content:', error);
    showToast('Error creating content', 'error', 'Please try again');
    throw error;
  }
}

// UI Update Functions
function switchView(viewName) {
  views[state.currentView].classList.add('hidden');
  views[viewName].classList.remove('hidden');
  state.currentView = viewName;
  
  Object.keys(navItems).forEach(nav => {
    if (nav === viewName) {
      navItems[nav].classList.remove('text-gray-400', 'hover:bg-primary-600/10', 'hover:text-primary-400');
      navItems[nav].classList.add('bg-primary-600/20', 'text-primary-400', 'shadow-inner-bright');
    } else {
      navItems[nav].classList.add('text-gray-400', 'hover:bg-primary-600/10', 'hover:text-primary-400');
      navItems[nav].classList.remove('bg-primary-600/20', 'text-primary-400', 'shadow-inner-bright');
    }
  });
}

function updateDashboard() {
  const ideasCount = document.getElementById('ideas-count');
  const inProgressCount = document.getElementById('in-progress-count');
  const reviewCount = document.getElementById('review-count');
  const publishedCount = document.getElementById('published-count');
  const recentContentTable = document.getElementById('recent-content-table');
  const upcomingSchedule = document.getElementById('upcoming-schedule');
  
  let ideas = 0, inProgress = 0, review = 0, published = 0;
  
  state.contentData.forEach(content => {
    const status = getOverallStatus(content.fields);
    if (status === 'Published') published++;
    else if (status === 'Needs Review') review++;
    else if (status === 'In Progress') inProgress++;
    else ideas++;
  });
  
  ideasCount.textContent = ideas;
  inProgressCount.textContent = inProgress;
  reviewCount.textContent = review;
  publishedCount.textContent = published;
  
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  recentContentTable.innerHTML = '';
  
  const recentContent = [...state.contentData]
    .sort((a, b) => new Date(b.fields.Created) - new Date(a.fields.Created))
    .slice(0, 5);
  
  if (recentContent.length === 0) {
    recentContentTable.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
          No content found
        </td>
      </tr>
    `;
  } else {
    recentContent.forEach(content => {
      const status = getOverallStatus(content.fields);
      const statusColors = getStatusColors(status);
      const title = content.fields['Title'] || content.fields['Description'] || 'Untitled';
      recentContentTable.innerHTML += `
        <tr class="border-b border-gray-800/50 hover:bg-dark-200/30 transition-colors cursor-pointer content-row" data-id="${content.id}">
          <td class="px-6 py-4">
            <div class="flex items-center">
              <div class="h-9 w-9 rounded bg-gradient-to-br from-dark-200 to-dark-300 flex items-center justify-center mr-3 shadow-md">
                <i class="fas fa-file-alt text-gray-500"></i>
              </div>
              <div>
                <div class="font-medium text-white">${title}</div>
                <div class="text-xs text-gray-500">${content.fields['Content ID'] || ''}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="status-pill ${statusColors.bg} ${statusColors.text}">
              ${status}
            </span>
          </td>
          <td class="px-6 py-4 text-sm text-gray-400">
            ${formatDate(content.fields['Publish Date'])}
          </td>
          <td class="px-6 py-4 text-right">
            <button class="text-primary-400 hover:text-primary-300 transition-colors view-content-btn relative group" data-id="${content.id}">
              View Details
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
            </button>
          </td>
        </tr>
      `;
    });
  }
  
  upcomingSchedule.innerHTML = '';
  
  const todayObj = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(todayObj.getDate() + 7);
  
  const scheduledContent = state.contentData.filter(content => {
    if (!content.fields['Publish Date'] || !content.fields['Schedule']) return false;
    const publishDate = new Date(content.fields['Publish Date']);
    return publishDate >= todayObj && publishDate <= nextWeek;
  }).sort((a, b) => new Date(a.fields['Publish Date']) - new Date(b.fields['Publish Date']));
  
  if (scheduledContent.length === 0) {
    upcomingSchedule.innerHTML = `
      <div class="text-center py-10 text-gray-500">
        No upcoming scheduled content
      </div>
    `;
  } else {
    scheduledContent.forEach(content => {
      const publishDate = new Date(content.fields['Publish Date']);
      const isToday = publishDate.toDateString() === todayObj.toDateString();
      const isTomorrow = publishDate.toDateString() === new Date(todayObj.getTime() + 86400000).toDateString();
      let dateDisplay;
      if (isToday) dateDisplay = 'Today';
      else if (isTomorrow) dateDisplay = 'Tomorrow';
      else dateDisplay = publishDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const title = content.fields['Title'] || content.fields['Description'] || 'Untitled';
      
      upcomingSchedule.innerHTML += `
        <div class="mb-3 p-3 bg-dark-200/60 rounded-lg hover:bg-dark-300/60 transition-all cursor-pointer schedule-item card-hover shadow-md" data-id="${content.id}">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-white">${title}</span>
            <span class="status-pill ${isToday ? 'bg-gradient-to-r from-green-600/20 to-green-500/20 text-green-400' : 'bg-gradient-to-r from-primary-600/20 to-primary-500/20 text-primary-400'}">
              ${dateDisplay}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">${content.fields['Content ID'] || ''}</p>
        </div>
      `;
    });
  }
  
  document.querySelectorAll('.content-row, .view-content-btn, .schedule-item').forEach(el => {
    el.addEventListener('click', () => {
      const contentId = el.getAttribute('data-id');
      viewContentDetails(contentId);
    });
  });
}

function updateContentList() {
  const contentGrid = document.getElementById('content-grid');
  const paginationStart = document.getElementById('pagination-start');
  const paginationEnd = document.getElementById('pagination-end');
  const paginationTotal = document.getElementById('pagination-total');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  
  let filteredContent = [...state.contentData];
  
  if (state.currentFilter !== 'all') {
    filteredContent = filteredContent.filter(content => {
      const status = getOverallStatus(content.fields);
      switch(state.currentFilter) {
        case 'in-progress': return status === 'In Progress';
        case 'needs-review': return status === 'Needs Review';
        case 'approved': return status === 'Approved';
        case 'scheduled': return status === 'Scheduled';
        case 'published': return status === 'Published';
        default: return true;
      }
    });
  }
  
  filteredContent.sort((a, b) => new Date(b.fields['Last Modified']) - new Date(a.fields['Last Modified']));
  
  state.totalPages = Math.ceil(filteredContent.length / state.itemsPerPage);
  
  if (state.currentPage > state.totalPages && state.totalPages > 0) {
    state.currentPage = state.totalPages;
  }
  
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = Math.min(startIndex + state.itemsPerPage, filteredContent.length);
  
  paginationStart.textContent = filteredContent.length > 0 ? startIndex + 1 : 0;
  paginationEnd.textContent = endIndex;
  paginationTotal.textContent = filteredContent.length;
  
  prevPageBtn.disabled = state.currentPage === 1;
  nextPageBtn.disabled = state.currentPage === state.totalPages || state.totalPages === 0;
  
  contentGrid.innerHTML = '';
  
  if (filteredContent.length === 0) {
    contentGrid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16">
        <i class="fas fa-folder-open text-4xl text-gray-700 mb-3"></i>
        <p class="text-gray-500">No content found</p>
      </div>
    `;
    return;
  }
  
  const pageContent = filteredContent.slice(startIndex, endIndex);
  
  pageContent.forEach(content => {
    const status = getOverallStatus(content.fields);
    const statusColors = getStatusColors(status);
    const title = content.fields['Title'] || content.fields['Description'] || 'Untitled';
    const hasImage = content.fields['Image'] && content.fields['Image'].length > 0;
    const thumbnailUrl = hasImage ? content.fields['Image'][0].thumbnails.large.url : '';
    
    contentGrid.innerHTML += `
      <div class="content-card bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl overflow-hidden shadow-modern border border-gray-800/50" data-id="${content.id}">
        <div class="h-48 bg-dark-200/80 relative">
          ${hasImage ? 
            `<img src="${thumbnailUrl}" alt="${title}" class="h-full w-full object-cover">`
            : `<div class="flex h-full items-center justify-center">
              <i class="fas fa-image text-4xl text-dark-300/80"></i>
            </div>`
          }
          <div class="absolute top-3 right-3">
            <span class="status-pill ${statusColors.bg} ${statusColors.text} shadow-md">
              ${status}
            </span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 truncate">${title}</h3>
          <p class="text-sm text-gray-500 mt-1 mb-4">
            ${content.fields['Content ID'] || ''}
            <span class="mx-2">•</span>
            ${formatDate(content.fields['Publish Date'])}
          </p>
          <div class="flex justify-between items-center">
            <div class="flex space-x-2">
              ${content.fields['Text URL'] ? 
                `<a href="${content.fields['Text URL']}" target="_blank" class="p-2 rounded-lg bg-dark-200/60 hover:bg-dark-300/60 text-gray-400 transition-colors shadow-md">
                  <i class="fas fa-file-alt"></i>
                </a>` : ''
              }
              ${content.fields['Folder URL'] ? 
                `<a href="${content.fields['Folder URL']}" target="_blank" class="p-2 rounded-lg bg-dark-200/60 hover:bg-dark-300/60 text-gray-400 transition-colors shadow-md">
                  <i class="fas fa-folder"></i>
                </a>` : ''
              }
            </div>
            <button class="text-sm text-primary-400 hover:text-primary-300 transition-colors view-content-btn relative group" data-id="${content.id}">
              View Details
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  document.querySelectorAll('.content-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('a') && !e.target.classList.contains('view-content-btn')) {
        const contentId = card.getAttribute('data-id');
        viewContentDetails(contentId);
      }
    });
  });
  
  document.querySelectorAll('.view-content-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const contentId = btn.getAttribute('data-id');
      viewContentDetails(contentId);
    });
  });
}

function updateActionsList() {
  const actionsList = document.getElementById('actions-list');
  const selectAction = document.getElementById('select-action');
  const contentActionSelect = document.getElementById('content-action-select');
  
  selectAction.innerHTML = '<option value="">Choose an action...</option>';
  contentActionSelect.innerHTML = '<option value="">Select an action...</option>';
  
  state.actionsData.forEach(action => {
    const actionName = action.fields['Action Name'];
    const actionId = action.id;
    selectAction.innerHTML += `<option value="${actionId}">${actionName}</option>`;
    contentActionSelect.innerHTML += `<option value="${actionId}">${actionName}</option>`;
  });
  
  actionsList.innerHTML = '';
  
  if (state.actionsData.length === 0) {
    actionsList.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-10">
        <span class="text-gray-500">No actions available</span>
      </div>
    `;
    return;
  }
  
  state.actionsData.forEach(action => {
    const actionName = action.fields['Action Name'];
    const notes = action.fields['Notes'] || 'Transform your content with this automation';
    
    actionsList.innerHTML += `
      <div class="bg-gradient-to-br from-dark-200/80 to-dark-300/80 rounded-xl p-4 card-hover shadow-md border border-gray-800/30">
        <div class="flex items-center mb-3">
          <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-600/20 to-primary-500/20 flex items-center justify-center mr-3 shadow-md">
            <i class="fas fa-bolt text-primary-400"></i>
          </div>
          <h4 class="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">${actionName}</h4>
        </div>
        <p class="text-sm text-gray-400 mb-4">${notes}</p>
        <button class="px-3 py-1.5 text-sm bg-gradient-to-r from-primary-600/10 to-primary-500/10 hover:from-primary-600/20 hover:to-primary-500/20 text-primary-400 rounded-lg transition-colors apply-action-btn shadow-md" data-id="${action.id}">
          Apply Action
        </button>
      </div>
    `;
  });
  
  document.querySelectorAll('.apply-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('select-action').value = btn.getAttribute('data-id');
      updateSelectContent();
      document.querySelector('#actions-view .col-span-1').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function updateSelectContent() {
  const selectContent = document.getElementById('select-content');
  selectContent.innerHTML = '<option value="">Choose content...</option>';
  
  const initializedContent = state.contentData.filter(content => content.fields['Initialized'] === 1);
  
  initializedContent.forEach(content => {
    const title = content.fields['Title'] || content.fields['Description'] || 'Untitled';
    const contentId = content.id;
    selectContent.innerHTML += `<option value="${contentId}">${title}</option>`;
  });
}

function viewContentDetails(contentId) {
  const content = state.contentData.find(item => item.id === contentId);
  if (!content) return;
  
  state.currentContentId = contentId;
  
  document.getElementById('content-title').textContent = content.fields['Title'] || content.fields['Description'] || 'Untitled';
  document.getElementById('content-id').textContent = content.fields['Content ID'] || '';
  document.getElementById('content-publish-date').textContent = formatDate(content.fields['Publish Date']);
  document.getElementById('content-last-modified').textContent = formatDate(content.fields['Last Modified']);
  document.getElementById('content-scheduled').textContent = content.fields['Schedule'] ? 'Yes' : 'No';
  document.getElementById('content-description').textContent = content.fields['Description'] || 'No description';
  
  const textElement = document.getElementById('content-text');
  textElement.innerHTML = content.fields['Text'] ? content.fields['Text'] : 'No text content available';
  
  const overallStatus = getOverallStatus(content.fields);
  const overallColors = getStatusColors(overallStatus);
  document.getElementById('content-status-badge').className = `status-pill ${overallColors.bg} ${overallColors.text} shadow-md`;
  document.getElementById('content-status-badge').textContent = overallStatus;
  
  const textStatus = content.fields['Text Status'] || 'Not Set';
  const textColors = getStatusColors(textStatus);
  document.getElementById('text-status-badge').className = `status-pill ${textColors.bg} ${textColors.text} shadow-md`;
  document.getElementById('text-status-badge').textContent = textStatus;
  
  const imageStatus = content.fields['Image Status'] || 'Not Set';
  const imageColors = getStatusColors(imageStatus);
  document.getElementById('image-status-badge').className = `status-pill ${imageColors.bg} ${imageColors.text} shadow-md`;
  document.getElementById('image-status-badge').textContent = imageStatus;
  
  document.getElementById('text-status-select').value = content.fields['Text Status'] || 'In-Progress';
  document.getElementById('image-status-select').value = content.fields['Image Status'] || 'In-Progress';
  
  const textDocLink = document.getElementById('text-doc-link');
  textDocLink.href = content.fields['Text URL'] || '#';
  textDocLink.classList.toggle('opacity-50', !content.fields['Text URL']);
  textDocLink.classList.toggle('pointer-events-none', !content.fields['Text URL']);
  
  const folderLink = document.getElementById('folder-link');
  folderLink.href = content.fields['Folder URL'] || '#';
  folderLink.classList.toggle('opacity-50', !content.fields['Folder URL']);
  folderLink.classList.toggle('pointer-events-none', !content.fields['Folder URL']);
  
  const contentMedia = document.getElementById('content-media');
  contentMedia.innerHTML = '';
  
  let hasMedia = false;
  
  if (content.fields['Image'] && content.fields['Image'].length > 0) {
    hasMedia = true;
    content.fields['Image'].forEach(image => {
      contentMedia.innerHTML += `
        <div class="bg-dark-200/60 rounded-lg overflow-hidden card-hover shadow-md border border-gray-800/30">
          <div class="h-48 overflow-hidden">
            <img src="${image.url}" alt="Content image" class="w-full h-full object-cover">
          </div>
          <div class="p-2 text-xs text-gray-500">
            ${image.filename}
          </div>
        </div>
      `;
    });
  }
  
  if (content.fields['Video'] && content.fields['Video'].length > 0) {
    hasMedia = true;
    content.fields['Video'].forEach(video => {
      contentMedia.innerHTML += `
        <div class="bg-dark-200/60 rounded-lg overflow-hidden card-hover shadow-md border border-gray-800/30">
          <div class="h-48 overflow-hidden relative">
            <img src="${video.thumbnails.large.url}" alt="Video thumbnail" class="w-full h-full object-cover">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600/50 to-primary-500/50 flex items-center justify-center shadow-lg">
                <i class="fas fa-play text-white"></i>
              </div>
            </div>
          </div>
          <div class="p-2 text-xs text-gray-500">
            ${video.filename}
          </div>
        </div>
      `;
    });
  }
  
  if (!hasMedia) {
    contentMedia.innerHTML = `
      <div class="col-span-full flex justify-center items-center py-10">
        <span class="text-gray-500">No media found for this content</span>
      </div>
    `;
  }
  
  switchView('singleContent');
}

function updateCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const currentMonthElement = document.getElementById('current-month');
  
  currentMonthElement.textContent = state.currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  calendarGrid.innerHTML = '';
  
  const firstDay = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1);
  const lastDay = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay();
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarGrid.innerHTML += `<div class="bg-dark-200/40 p-2 calendar-day opacity-50"></div>`;
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    
    const dayContent = state.contentData.filter(content => 
      content.fields['Publish Date'] === dateString && content.fields['Schedule']
    );
    
    const isToday = new Date().toDateString() === date.toDateString();
    const dayClass = isToday ? 'border-2 border-primary-500/50 bg-primary-600/10 shadow-md' : 'border border-gray-800/30 bg-dark-100/60';
    
    let dayHtml = `<div class="${dayClass} p-2 calendar-day">
      <div class="flex justify-between items-center mb-2">
        <span class="${isToday ? 'text-primary-400 font-medium' : 'text-gray-300'}">${day}</span>
        ${dayContent.length > 0 ? `<span class="text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary-600/20 to-primary-500/20 text-primary-400 shadow-sm">${dayContent.length}</span>` : ''}
      </div>`;
    
    if (dayContent.length > 0) {
      dayContent.forEach(content => {
        const title = content.fields['Title'] || content.fields['Description'] || 'Untitled';
        const status = getOverallStatus(content.fields);
        const statusColors = getStatusColors(status);
        
        dayHtml += `
          <div class="mt-1 text-xs p-1.5 rounded bg-dark-200/60 hover:bg-dark-300/60 transition-all cursor-pointer calendar-content shadow-md" data-id="${content.id}">
            <div class="truncate text-white">${title}</div>
            <div class="flex justify-between items-center mt-1">
              <span class="text-2xs text-gray-500">${content.fields['Content ID'] || ''}</span>
              <span class="status-pill ${statusColors.bg} ${statusColors.text} text-2xs py-0 shadow-sm">${status}</span>
            </div>
          </div>
        `;
      });
    }
    
    dayHtml += `</div>`;
    calendarGrid.innerHTML += dayHtml;
  }
  
  document.querySelectorAll('.calendar-content').forEach(item => {
    item.addEventListener('click', () => {
      const contentId = item.getAttribute('data-id');
      viewContentDetails(contentId);
    });
  });
}

// Initialize Application
async function initializeApp() {
  try {
    await Promise.all([
      fetchContent(),
      fetchActions()
    ]);
    updateDashboard();
    updateContentList();
    updateActionsList();
    updateSelectContent();
    updateCalendar();
    app.classList.remove('hidden');
    app.classList.add('fade-in');
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Error loading data', 'error', 'Please check your Airtable token');
  } finally {
    hideLoading();
  }
}

// Check token and start app
const token = localStorage.getItem('airtableToken');
if (token) {
  tokenModal.style.display = 'none';
  showLoading();
  initializeApp();
} else {
  tokenModal.style.display = 'flex';
  hideLoading();
}

// Set current date in dashboard
const today = new Date();
document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Hotkeys for navigation
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.altKey) {
    switch(e.key) {
      case 'd':
        switchView('dashboard');
        updateDashboard();
        break;
      case 'c':
        switchView('content');
        updateContentList();
        break;
      case 'a':
        switchView('actions');
        updateActionsList();
        break;
      case 'l':
        switchView('calendar');
        updateCalendar();
        break;
      case 'n':
        document.getElementById('create-content-btn').click();
        break;
    }
  }
});

// Periodic refresh every minute
setInterval(async () => {
  if (app.classList.contains('hidden') || loading.style.display === 'flex') return;
  try {
    const contentChanged = await (async () => {
      const response = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${CONTENT_TABLE_ID}?pageSize=100`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to refresh content');
      const data = await response.json();
      if (JSON.stringify(data.records) !== JSON.stringify(state.contentData)) {
        state.contentData = data.records;
        return true;
      }
      return false;
    })();
    
    const actionsChanged = await (async () => {
      const response = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${ACTIONS_TABLE_ID}?filterByFormula={Active}=TRUE()`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to refresh actions');
      const data = await response.json();
      if (JSON.stringify(data.records) !== JSON.stringify(state.actionsData)) {
        state.actionsData = data.records;
        return true;
      }
      return false;
    })();
    
    if (contentChanged || actionsChanged) {
      if (state.currentView === 'dashboard') updateDashboard();
      else if (state.currentView === 'content') updateContentList();
      else if (state.currentView === 'actions') updateActionsList();
      else if (state.currentView === 'calendar') updateCalendar();
      else if (state.currentView === 'singleContent' && state.currentContentId) {
        viewContentDetails(state.currentContentId);
      }
      updateSelectContent();
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}, 60000);

// Responsive layout
function handleResponsiveLayout() {
  const width = window.innerWidth;
  if (width < 768) {
    document.querySelector('aside').classList.add('hidden');
    if (!document.getElementById('mobile-nav-toggle')) {
      const mobileNavToggle = document.createElement('button');
      mobileNavToggle.id = 'mobile-nav-toggle';
      mobileNavToggle.className = 'fixed bottom-4 left-4 h-12 w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-lg z-40';
      mobileNavToggle.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.appendChild(mobileNavToggle);
      mobileNavToggle.addEventListener('click', () => {
        const sidebar = document.querySelector('aside');
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('fixed');
        sidebar.classList.toggle('inset-0');
        sidebar.classList.toggle('z-30');
        if (!sidebar.classList.contains('hidden')) {
          const closeButton = document.createElement('button');
          closeButton.id = 'mobile-nav-close';
          closeButton.className = 'absolute top-4 right-4 h-8 w-8 rounded-full bg-dark-300 text-gray-400 flex items-center justify-center shadow-md';
          closeButton.innerHTML = '<i class="fas fa-times"></i>';
          sidebar.appendChild(closeButton);
          closeButton.addEventListener('click', () => {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('fixed', 'inset-0', 'z-30');
            closeButton.remove();
          });
        } else {
          const closeButton = document.getElementById('mobile-nav-close');
          if (closeButton) closeButton.remove();
        }
      });
    }
  } else {
    document.querySelector('aside').classList.remove('hidden', 'fixed', 'inset-0', 'z-30');
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    if (mobileNavToggle) mobileNavToggle.remove();
    const closeButton = document.getElementById('mobile-nav-close');
    if (closeButton) closeButton.remove();
  }
}
handleResponsiveLayout();
window.addEventListener('resize', handleResponsiveLayout);

// Custom right-click menu
document.addEventListener('contextmenu', (e) => {
  const contentCard = e.target.closest('.content-card');
  if (contentCard) {
    e.preventDefault();
    const existingMenu = document.getElementById('custom-context-menu');
    if (existingMenu) existingMenu.remove();
    const contentId = contentCard.getAttribute('data-id');
    const content = state.contentData.find(item => item.id === contentId);
    if (!content) return;
    const menu = document.createElement('div');
    menu.id = 'custom-context-menu';
    menu.className = 'fixed bg-gradient-to-br from-dark-100 to-dark-200 border border-gray-700/50 rounded-lg shadow-modern z-50 py-2 w-48';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${e.pageX - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${e.pageY - rect.height}px`;
      }
    }, 0);
    menu.innerHTML = `
      <div class="px-4 py-2 text-xs font-medium text-gray-400 uppercase">
        ${content.fields['Content ID'] || 'Content'}
      </div>
      <div class="border-b border-gray-700/50 my-1"></div>
      <button class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/60 view-item transition-colors">
        <i class="fas fa-eye mr-2 text-primary-400"></i> View Details
      </button>
      ${content.fields['Text URL'] ? `
      <a href="${content.fields['Text URL']}" target="_blank" class="block w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/60 transition-colors">
        <i class="fas fa-file-alt mr-2 text-blue-400"></i> Open Document
      </a>` : ''}
      ${content.fields['Folder URL'] ? `
      <a href="${content.fields['Folder URL']}" target="_blank" class="block w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/60 transition-colors">
        <i class="fas fa-folder mr-2 text-yellow-400"></i> Open Folder
      </a>` : ''}
      <div class="border-b border-gray-700/50 my-1"></div>
      <button class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/60 status-item transition-colors">
        <i class="fas fa-tasks mr-2 text-green-400"></i> Update Status
      </button>
      <button class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/60 action-item transition-colors">
        <i class="fas fa-bolt mr-2 text-amber-400"></i> Apply Action
      </button>
    `;
    document.body.appendChild(menu);
    menu.querySelector('.view-item').addEventListener('click', () => {
      viewContentDetails(contentId);
      menu.remove();
    });
    menu.querySelector('.status-item').addEventListener('click', () => {
      viewContentDetails(contentId);
      setTimeout(() => {
        document.getElementById('update-status-btn').scrollIntoView({ behavior: 'smooth' });
      }, 100);
      menu.remove();
    });
    menu.querySelector('.action-item').addEventListener('click', () => {
      viewContentDetails(contentId);
      setTimeout(() => {
        document.getElementById('content-action-select').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('content-action-select').focus();
      }, 100);
      menu.remove();
    });
    document.addEventListener('click', function closeMenu() {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    });
  }
});

// Drag and drop for images
document.addEventListener('dragover', (e) => {
  const contentMedia = document.getElementById('content-media');
  const contentMediaRect = contentMedia?.getBoundingClientRect();
  if (contentMediaRect &&
      e.clientX >= contentMediaRect.left &&
      e.clientX <= contentMediaRect.right &&
      e.clientY >= contentMediaRect.top &&
      e.clientY <= contentMediaRect.bottom &&
      state.currentContentId) {
    e.preventDefault();
    contentMedia.classList.add('border-2', 'border-dashed', 'border-primary-400', 'bg-primary-600/10');
  }
});

document.addEventListener('dragleave', (e) => {
  const contentMedia = document.getElementById('content-media');
  if (contentMedia) {
    contentMedia.classList.remove('border-2', 'border-dashed', 'border-primary-400', 'bg-primary-600/10');
  }
});

document.addEventListener('drop', (e) => {
  const contentMedia = document.getElementById('content-media');
  if (contentMedia) {
    contentMedia.classList.remove('border-2', 'border-dashed', 'border-primary-400', 'bg-primary-600/10');
    const contentMediaRect = contentMedia.getBoundingClientRect();
    if (state.currentContentId &&
        e.clientX >= contentMediaRect.left &&
        e.clientX <= contentMediaRect.right &&
        e.clientY >= contentMediaRect.top &&
        e.clientY <= contentMediaRect.bottom) {
      e.preventDefault();
      showToast('Image upload in development', 'info', 'This would upload the images to Airtable');
    }
  }
});

// Export functionality (simulated)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'e' && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    showToast('Export initiated', 'success', 'This would export the current view data');
  }
});

// Tooltips initialization
function initTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute bg-gradient-to-br from-dark-300 to-dark-400 text-white text-xs rounded px-2 py-1 z-50 opacity-0 transition-opacity shadow-modern';
    tooltip.textContent = el.getAttribute('data-tooltip');
    tooltip.style.bottom = 'calc(100% + 5px)';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    el.appendChild(tooltip);
    el.addEventListener('mouseenter', () => {
      tooltip.classList.remove('opacity-0');
      tooltip.classList.add('opacity-100');
    });
    el.addEventListener('mouseleave', () => {
      tooltip.classList.remove('opacity-100');
      tooltip.classList.add('opacity-0');
    });
  });
}
document.addEventListener('DOMContentLoaded', initTooltips);

// Theme toggle
function createThemeToggle() {
  const themeToggle = document.createElement('button');
  themeToggle.id = 'theme-toggle';
  themeToggle.className = 'fixed top-4 right-4 h-8 w-8 rounded-full bg-dark-200/80 text-gray-400 flex items-center justify-center shadow-modern z-40 border border-gray-700/50';
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  themeToggle.setAttribute('data-tooltip', 'Toggle Light/Dark Mode');
  document.body.appendChild(themeToggle);
  let isDark = true;
  themeToggle.addEventListener('click', () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggle.className = 'fixed top-4 right-4 h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-white text-gray-700 flex items-center justify-center shadow-modern z-40 border border-gray-300/50';
      document.querySelector('main').classList.remove('bg-gradient-animate');
      document.querySelector('main').classList.add('bg-gray-100');
      document.querySelector('aside').classList.remove('bg-gradient-to-b', 'from-dark-200', 'to-dark-300', 'border-gray-800/80');
      document.querySelector('aside').classList.add('bg-gradient-to-b', 'from-white', 'to-gray-100', 'border-gray-200/80');
      showToast('Light mode activated', 'info', 'Your preference will be saved');
    } else {
      document.documentElement.classList.add('dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggle.className = 'fixed top-4 right-4 h-8 w-8 rounded-full bg-dark-200/80 text-gray-400 flex items-center justify-center shadow-modern z-40 border border-gray-700/50';
      document.querySelector('main').classList.add('bg-gradient-animate');
      document.querySelector('main').classList.remove('bg-gray-100');
      document.querySelector('aside').classList.add('bg-gradient-to-b', 'from-dark-200', 'to-dark-300', 'border-gray-800/80');
      document.querySelector('aside').classList.remove('bg-gradient-to-b', 'from-white', 'to-gray-100', 'border-gray-200/80');
      showToast('Dark mode activated', 'info', 'Your preference will be saved');
    }
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    themeToggle.click();
  }
}
document.addEventListener('DOMContentLoaded', createThemeToggle);

// Content duplication
async function duplicateContent(contentId) {
  const content = state.contentData.find(item => item.id === contentId);
  if (!content) return;
  showLoading();
  try {
    const newContentData = {
      'Title': content.fields['Title'] ? `Copy of ${content.fields['Title']}` : content.fields['Title'],
      'Description': content.fields['Description'],
      'Publish Date': new Date().toISOString().split('T')[0],
      'Schedule': false,
      'Text Status': 'In-Progress',
      'Image Status': 'In-Progress',
      'Text': content.fields['Text']
    };
    const result = await createNewContent(newContentData);
    if (result) {
      showToast('Content duplicated successfully', 'success', 'New copy created');
      await fetchContent();
      updateDashboard();
      viewContentDetails(result.id);
    }
  } catch (error) {
    console.error('Error duplicating content:', error);
    showToast('Error duplicating content', 'error', 'Please try again');
  }
  hideLoading();
}

function addDuplicateButton() {
  const actionsContainer = document.querySelector('#single-content-view .space-y-6');
  if (actionsContainer && !document.getElementById('duplicate-content-btn')) {
    const duplicateCard = document.createElement('div');
    duplicateCard.className = 'bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl overflow-hidden shadow-modern border border-gray-800/50';
    duplicateCard.innerHTML = `
      <div class="px-5 py-4 border-b border-gray-800/80">
        <h3 class="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Duplicate Content</h3>
      </div>
      <div class="p-5">
        <button id="duplicate-content-btn" class="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white py-2 px-4 rounded-lg transition duration-300 shadow-md btn-highlight">
          <i class="fas fa-copy mr-2"></i> Create Copy
        </button>
      </div>
    `;
    actionsContainer.appendChild(duplicateCard);
    document.getElementById('duplicate-content-btn').addEventListener('click', () => {
      if (state.currentContentId) duplicateContent(state.currentContentId);
    });
  }
}

const originalViewContentDetails = viewContentDetails;
viewContentDetails = function(contentId) {
  originalViewContentDetails(contentId);
  setTimeout(addDuplicateButton, 100);
};

// Content Analytics
function addContentAnalytics() {
  const dashboardView = document.getElementById('dashboard-view');
  if (!document.getElementById('content-analytics')) {
    const analyticsCard = document.createElement('div');
    analyticsCard.id = 'content-analytics';
    analyticsCard.className = 'mt-6 bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl overflow-hidden shadow-modern border border-gray-800/50';
    analyticsCard.innerHTML = `
      <div class="px-5 py-4 flex justify-between items-center border-b border-gray-800/80">
        <h3 class="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Content Analytics</h3>
        <div class="flex space-x-2">
          <button class="analytics-period px-2 py-1 text-xs rounded-full bg-gradient-to-r from-primary-600/20 to-primary-500/20 text-primary-400 shadow-sm" data-period="week">Week</button>
          <button class="analytics-period px-2 py-1 text-xs rounded-full text-gray-400 hover:bg-dark-200/50 shadow-sm" data-period="month">Month</button>
          <button class="analytics-period px-2 py-1 text-xs rounded-full text-gray-400 hover:bg-dark-200/50 shadow-sm" data-period="year">Year</button>
        </div>
      </div>
      <div class="p-5">
        <div class="flex justify-around items-center h-64">
          <div class="w-1/2 h-full flex flex-col items-center justify-center">
            <h4 class="text-sm font-medium text-gray-400 mb-4">Content Type Distribution</h4>
            <div class="relative w-48 h-48">
              <svg class="w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="url(#blue-gradient)" stroke-width="10" stroke-dasharray="282.7" stroke-dashoffset="155.5" transform="rotate(-90 50 50)"></circle>
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="url(#green-gradient)" stroke-width="10" stroke-dasharray="282.7" stroke-dashoffset="197.9" transform="rotate(25 50 50)"></circle>
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="url(#amber-gradient)" stroke-width="10" stroke-dasharray="282.7" stroke-dashoffset="212" transform="rotate(114 50 50)"></circle>
                <defs>
                  <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#0284c7" />
                  </linearGradient>
                  <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#10b981" />
                    <stop offset="100%" stop-color="#059669" />
                  </linearGradient>
                  <linearGradient id="amber-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#d97706" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">32</div>
                  <div class="text-xs text-gray-400">Total Items</div>
                </div>
              </div>
            </div>
            <div class="flex justify-center mt-4 space-x-4">
              <div class="flex items-center">
                <span class="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-1"></span>
                <span class="text-xs text-gray-400">Text</span>
              </div>
              <div class="flex items-center">
                <span class="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-1"></span>
                <span class="text-xs text-gray-400">Image</span>
              </div>
              <div class="flex items-center">
                <span class="w-3 h-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mr-1"></span>
                <span class="text-xs text-gray-400">Video</span>
              </div>
            </div>
          </div>
          <div class="w-1/2 h-full flex flex-col items-center justify-center">
            <h4 class="text-sm font-medium text-gray-400 mb-4">Content Creation Trend</h4>
            <div class="w-full h-48 px-2">
              <svg class="w-full h-full drop-shadow-lg" viewBox="0 0 300 200">
                <line x1="0" y1="0" x2="300" y2="0" stroke="#374151" stroke-width="1" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#374151" stroke-width="1" />
                <line x1="0" y1="100" x2="300" y2="100" stroke="#374151" stroke-width="1" />
                <line x1="0" y1="150" x2="300" y2="150" stroke="#374151" stroke-width="1" />
                <line x1="0" y1="200" x2="300" y2="200" stroke="#374151" stroke-width="1" />
                <path d="M0,180 L50,160 L100,140 L150,90 L200,70 L250,40 L300,30" fill="none" stroke="url(#blue-line-gradient)" stroke-width="3" />
                <path d="M0,190 L50,180 L100,170 L150,150 L200,120 L250,100 L300,80" fill="none" stroke="url(#green-line-gradient)" stroke-width="3" stroke-dasharray="5,5" />
                
                <defs>
                  <linearGradient id="blue-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#0284c7" />
                  </linearGradient>
                  <linearGradient id="green-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#10b981" />
                    <stop offset="100%" stop-color="#059669" />
                  </linearGradient>
                </defs>
                
                <circle cx="0" cy="180" r="4" fill="#38bdf8" />
                <circle cx="50" cy="160" r="4" fill="#38bdf8" />
                <circle cx="100" cy="140" r="4" fill="#38bdf8" />
                <circle cx="150" cy="90" r="4" fill="#38bdf8" />
                <circle cx="200" cy="70" r="4" fill="#38bdf8" />
                <circle cx="250" cy="40" r="4" fill="#38bdf8" />
                <circle cx="300" cy="30" r="4" fill="#38bdf8" />
                <circle cx="0" cy="190" r="4" fill="#10b981" />
                <circle cx="50" cy="180" r="4" fill="#10b981" />
                <circle cx="100" cy="170" r="4" fill="#10b981" />
                <circle cx="150" cy="150" r="4" fill="#10b981" />
                <circle cx="200" cy="120" r="4" fill="#10b981" />
                <circle cx="250" cy="100" r="4" fill="#10b981" />
                <circle cx="300" cy="80" r="4" fill="#10b981" />
              </svg>
            </div>
            <div class="flex justify-center mt-2 space-x-4">
              <div class="flex items-center">
                <span class="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-1"></span>
                <span class="text-xs text-gray-400">Created</span>
              </div>
              <div class="flex items-center">
                <span class="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-1"></span>
                <span class="text-xs text-gray-400">Published</span>
              </div>
            </div>
          </div>
        </div>
      `;
    dashboardView.appendChild(analyticsCard);
    document.querySelectorAll('.analytics-period').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.analytics-period').forEach(b => {
          b.classList.remove('bg-gradient-to-r', 'from-primary-600/20', 'to-primary-500/20', 'text-primary-400');
          b.classList.add('text-gray-400', 'hover:bg-dark-200/50');
        });
        btn.classList.add('bg-gradient-to-r', 'from-primary-600/20', 'to-primary-500/20', 'text-primary-400');
        btn.classList.remove('text-gray-400', 'hover:bg-dark-200/50');
        showToast('Analytics period updated', 'info', `Showing data for ${btn.getAttribute('data-period')}`);
      });
    });
  }
}

const originalUpdateDashboard = updateDashboard;
updateDashboard = function() {
  originalUpdateDashboard();
  setTimeout(addContentAnalytics, 100);
};

function createNotificationsCenter() {
  const notifyBtn = document.createElement('button');
  notifyBtn.id = 'notifications-btn';
  notifyBtn.className = 'fixed top-4 right-16 h-8 w-8 rounded-full bg-dark-200/80 text-gray-400 flex items-center justify-center shadow-modern z-40 border border-gray-700/50';
  notifyBtn.innerHTML = '<i class="fas fa-bell"></i>';
  notifyBtn.setAttribute('data-tooltip', 'Notifications');
  document.body.appendChild(notifyBtn);
  const notifyPanel = document.createElement('div');
  notifyPanel.id = 'notifications-panel';
  notifyPanel.className = 'fixed top-14 right-16 w-80 bg-gradient-to-br from-dark-100 to-dark-200 border border-gray-700/50 rounded-lg shadow-modern z-40 hidden transform transition-transform duration-300 scale-95 opacity-0';
  notifyPanel.innerHTML = `
    <div class="px-4 py-3 border-b border-gray-700/80 flex justify-between items-center">
      <h3 class="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Notifications</h3>
      <button id="mark-all-read" class="text-xs text-primary-400 hover:text-primary-300 relative group">
        Mark all as read
        <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
      </button>
    </div>
    <div class="max-h-96 overflow-y-auto">
      <div id="notifications-list" class="divide-y divide-gray-800/50">
        <div class="p-4 hover:bg-dark-200/30 transition-colors">
          <div class="flex items-start">
            <div class="h-8 w-8 rounded-full bg-gradient-to-br from-amber-600/20 to-amber-500/20 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
              <i class="fas fa-clock text-amber-400"></i>
            </div>
            <div>
              <p class="text-sm text-white">"Maximizing Automation on Airtable" needs review</p>
              <p class="text-xs text-gray-400 mt-1">10 minutes ago</p>
            </div>
          </div>
        </div>
        <div class="p-4 hover:bg-dark-200/30 transition-colors">
          <div class="flex items-start">
            <div class="h-8 w-8 rounded-full bg-gradient-to-br from-green-600/20 to-green-500/20 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
              <i class="fas fa-check text-green-400"></i>
            </div>
            <div>
              <p class="text-sm text-white">"Content System in Airtable" is published</p>
              <p class="text-xs text-gray-400 mt-1">1 hour ago</p>
            </div>
          </div>
        </div>
        <div class="p-4 hover:bg-dark-200/30 transition-colors">
          <div class="flex items-start">
            <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-500/20 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
              <i class="fas fa-bolt text-blue-400"></i>
            </div>
            <div>
              <p class="text-sm text-white">Action "Text To AI Video" completed</p>
              <p class="text-xs text-gray-400 mt-1">3 hours ago</p>
            </div>
          </div>
        </div>
      </div>
      <div class="p-4 text-center text-sm text-gray-500">
        No more notifications
      </div>
    </div>
  `;
  document.body.appendChild(notifyPanel);
  notifyBtn.addEventListener('click', () => {
    if (notifyPanel.classList.contains('hidden')) {
      notifyPanel.classList.remove('hidden', 'scale-95', 'opacity-0');
      notifyPanel.classList.add('scale-100', 'opacity-100');
      const badge = notifyBtn.querySelector('.notification-badge');
      if (badge) badge.remove();
    } else {
      notifyPanel.classList.add('hidden', 'scale-95', 'opacity-0');
      notifyPanel.classList.remove('scale-100', 'opacity-100');
    }
  });
  document.addEventListener('click', (e) => {
    if (!notifyBtn.contains(e.target) && !notifyPanel.contains(e.target) && !notifyPanel.classList.contains('hidden')) {
      notifyPanel.classList.add('hidden', 'scale-95', 'opacity-0');
      notifyPanel.classList.remove('scale-100', 'opacity-100');
    }
  });
  document.getElementById('mark-all-read').addEventListener('click', () => {
    showToast('All notifications marked as read', 'success');
    const badge = notifyBtn.querySelector('.notification-badge');
    if (badge) badge.remove();
  });
  setTimeout(() => {
    if (!notifyBtn.querySelector('.notification-badge')) {
      const badge = document.createElement('span');
      badge.className = 'notification-badge absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md';
      notifyBtn.appendChild(badge);
    }
    const notificationsList = document.getElementById('notifications-list');
    const newNotification = document.createElement('div');
    newNotification.className = 'p-4 hover:bg-dark-200/30 transition-colors bg-dark-200/30';
    newNotification.innerHTML = `
      <div class="flex items-start">
        <div class="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-500/20 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
          <i class="fas fa-calendar text-purple-400"></i>
        </div>
        <div>
          <p class="text-sm text-white">Reminder: Content scheduled for tomorrow</p>
          <p class="text-xs text-gray-400 mt-1">Just now</p>
        </div>
      </div>
    `;
    notificationsList.insertBefore(newNotification, notificationsList.firstChild);
  }, 30000);
}
document.addEventListener('DOMContentLoaded', createNotificationsCenter);

function createQuickActions() {
  const quickActionsBtn = document.createElement('button');
  quickActionsBtn.id = 'quick-actions-btn';
  quickActionsBtn.className = 'fixed bottom-4 right-4 h-12 w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-lg z-40 hover:from-primary-500 hover:to-primary-400 transition-colors';
  quickActionsBtn.innerHTML = '<i class="fas fa-bolt"></i>';
  document.body.appendChild(quickActionsBtn);
  const actionsMenu = document.createElement('div');
  actionsMenu.id = 'quick-actions-menu';
  actionsMenu.className = 'fixed bottom-20 right-4 bg-gradient-to-br from-dark-100 to-dark-200 border border-gray-700/50 rounded-lg shadow-modern z-40 hidden transform transition-transform duration-300 scale-95 opacity-0 w-48';
  actionsMenu.innerHTML = `
    <div class="py-2">
      <button id="quick-new-content" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/50 flex items-center group transition-colors">
        <i class="fas fa-plus w-5 text-center mr-2 text-primary-400 group-hover:scale-110 transition-transform"></i> New Content
      </button>
      <button id="quick-view-content" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/50 flex items-center group transition-colors">
        <i class="fas fa-layer-group w-5 text-center mr-2 text-amber-400 group-hover:scale-110 transition-transform"></i> View Content
      </button>
      <button id="quick-calendar" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/50 flex items-center group transition-colors">
        <i class="fas fa-calendar w-5 text-center mr-2 text-green-400 group-hover:scale-110 transition-transform"></i> Calendar
      </button>
      <div class="border-t border-gray-700/50 my-1"></div>
      <button id="quick-search" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-200/50 flex items-center group transition-colors">
        <i class="fas fa-search w-5 text-center mr-2 text-blue-400 group-hover:scale-110 transition-transform"></i> Quick Search
      </button>
    </div>
  `;
  document.body.appendChild(actionsMenu);
  quickActionsBtn.addEventListener('click', () => {
    if (actionsMenu.classList.contains('hidden')) {
      actionsMenu.classList.remove('hidden', 'scale-95', 'opacity-0');
      actionsMenu.classList.add('scale-100', 'opacity-100');
    } else {
      actionsMenu.classList.add('hidden', 'scale-95', 'opacity-0');
      actionsMenu.classList.remove('scale-100', 'opacity-100');
    }
  });
  document.addEventListener('click', (e) => {
    if (!quickActionsBtn.contains(e.target) && !actionsMenu.contains(e.target) && !actionsMenu.classList.contains('hidden')) {
      actionsMenu.classList.add('hidden', 'scale-95', 'opacity-0');
      actionsMenu.classList.remove('scale-100', 'opacity-100');
    }
  });
  document.getElementById('quick-new-content').addEventListener('click', () => {
    document.getElementById('create-content-btn').click();
    actionsMenu.classList.add('hidden');
  });
  document.getElementById('quick-view-content').addEventListener('click', () => {
    switchView('content');
    updateContentList();
    actionsMenu.classList.add('hidden');
  });
  document.getElementById('quick-calendar').addEventListener('click', () => {
    switchView('calendar');
    updateCalendar();
    actionsMenu.classList.add('hidden');
  });
  document.getElementById('quick-search').addEventListener('click', () => {
    switchView('content');
    setTimeout(() => {
      document.getElementById('content-search').focus();
    }, 100);
    actionsMenu.classList.add('hidden');
  });
}
document.addEventListener('DOMContentLoaded', createQuickActions);

// Event Handlers
document.getElementById('saveTokenBtn').addEventListener('click', () => {
  const token = document.getElementById('tokenInput').value.trim();
  if (!token) {
    showToast('Please enter a valid token', 'error', 'Token is required for access');
    return;
  }
  localStorage.setItem('airtableToken', token);
  tokenModal.style.display = 'none';
  showLoading();
  initializeApp();
});

document.getElementById('togglePassword').addEventListener('click', () => {
  const input = document.getElementById('tokenInput');
  const icon = document.querySelector('#togglePassword i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  }
});

Object.keys(navItems).forEach(nav => {
  navItems[nav].addEventListener('click', (e) => {
    e.preventDefault();
    switchView(nav);
    if (nav === 'dashboard') updateDashboard();
    else if (nav === 'content') updateContentList();
    else if (nav === 'actions') updateActionsList();
    else if (nav === 'calendar') updateCalendar();
  });
});

document.getElementById('content-filter').addEventListener('change', (e) => {
  state.currentFilter = e.target.value;
  state.currentPage = 1;
  updateContentList();
});

document.getElementById('prev-page').addEventListener('click', () => {
  if (state.currentPage > 1) {
    state.currentPage--;
    updateContentList();
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  if (state.currentPage < state.totalPages) {
    state.currentPage++;
    updateContentList();
  }
});

document.getElementById('view-all-content').addEventListener('click', (e) => {
  e.preventDefault();
  switchView('content');
  document.getElementById('content-filter').value = 'all';
  state.currentFilter = 'all';
  state.currentPage = 1;
  updateContentList();
});

document.getElementById('view-calendar').addEventListener('click', (e) => {
  e.preventDefault();
  switchView('calendar');
  updateCalendar();
});

document.getElementById('back-to-content').addEventListener('click', () => {
  if (state.currentView === 'singleContent') {
    switchView('content');
  }
});

document.getElementById('update-status-btn').addEventListener('click', async () => {
  if (!state.currentContentId) return;
  const textStatus = document.getElementById('text-status-select').value;
  const imageStatus = document.getElementById('image-status-select').value;
  const updates = {
    'Text Status': textStatus,
    'Image Status': imageStatus
  };
  showLoading();
  try {
    await updateContentStatus(state.currentContentId, updates);
    showToast('Status updated successfully', 'success');
    const textColors = getStatusColors(textStatus);
    const imageColors = getStatusColors(imageStatus);
    document.getElementById('text-status-badge').className = `status-pill ${textColors.bg} ${textColors.text} shadow-md`;
    document.getElementById('text-status-badge').textContent = textStatus;
    document.getElementById('image-status-badge').className = `status-pill ${imageColors.bg} ${imageColors.text} shadow-md`;
    document.getElementById('image-status-badge').textContent = imageStatus;
    const content = state.contentData.find(item => item.id === state.currentContentId);
    const overallStatus = getOverallStatus(content.fields);
    const overallColors = getStatusColors(overallStatus);
    document.getElementById('content-status-badge').className = `status-pill ${overallColors.bg} ${overallColors.text} shadow-md`;
    document.getElementById('content-status-badge').textContent = overallStatus;
  } catch (error) {
    console.error('Error updating status:', error);
  }
  hideLoading();
});

document.getElementById('content-apply-action-btn').addEventListener('click', async () => {
  if (!state.currentContentId) return;
  const actionSelect = document.getElementById('content-action-select');
  const actionId = actionSelect.value;
  if (!actionId) {
    showToast('Please select an action', 'info');
    return;
  }
  const action = state.actionsData.find(a => a.id === actionId);
  if (!action) return;
  showLoading();
  try {
    await updateContentStatus(state.currentContentId, { 'Action': [actionId] });
    showToast(`Action "${action.fields['Action Name']}" applied`, 'success', 'The action is now being processed');
    await fetchContent();
    viewContentDetails(state.currentContentId);
  } catch (error) {
    console.error('Error applying action:', error);
  }
  hideLoading();
});

document.getElementById('apply-action-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const actionId = document.getElementById('select-action').value;
  const contentId = document.getElementById('select-content').value;
  if (!actionId || !contentId) {
    showToast('Please select both an action and content', 'info');
    return;
  }
  const action = state.actionsData.find(a => a.id === actionId);
  const content = state.contentData.find(a => a.id === contentId);
  if (!action || !content) return;
  showLoading();
  try {
    await updateContentStatus(contentId, { 'Action': [actionId] });
    showToast(`Action applied successfully`, 'success', `${action.fields['Action Name']} applied to ${content.fields['Title'] || 'content'}`);
    await fetchContent();
    updateDashboard();
    const actionActivity = document.getElementById('action-activity');
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    actionActivity.innerHTML = `
      <div class="flex items-start">
        <div class="h-6 w-6 rounded-full bg-gradient-to-br from-green-600/20 to-green-500/20 flex items-center justify-center mr-2 shadow-md">
          <i class="fas fa-check text-green-400 text-xs"></i>
        </div>
        <div>
          <p class="text-gray-300">${action.fields['Action Name']} applied</p>
          <p class="text-gray-500">Today at ${now}</p>
        </div>
      </div>
    ` + actionActivity.innerHTML;
  } catch (error) {
    console.error('Error applying action:', error);
  }
  hideLoading();
});

document.getElementById('prev-month').addEventListener('click', () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
  updateCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
  updateCalendar();
});

document.getElementById('today-btn').addEventListener('click', () => {
  state.currentMonth = new Date();
  updateCalendar();
});

document.getElementById('create-content-btn').addEventListener('click', () => {
  document.getElementById('new-content-title').value = '';
  document.getElementById('new-content-description').value = '';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('new-content-publish-date').value = tomorrow.toISOString().split('T')[0];
  switchView('createContent');
});

document.getElementById('cancel-create-content').addEventListener('click', () => {
  switchView('dashboard');
});

document.getElementById('cancel-create-btn').addEventListener('click', () => {
  switchView('dashboard');
});

document.getElementById('create-content-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('new-content-title').value.trim();
  const description = document.getElementById('new-content-description').value.trim();
  const publishDate = document.getElementById('new-content-publish-date').value;
  const schedule = document.getElementById('new-content-schedule').checked;
  if (!title || !description || !publishDate) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  showLoading();
  try {
    const newContent = {
      'Title': title,
      'Description': description,
      'Publish Date': publishDate,
      'Schedule': schedule,
      'Text Status': 'In-Progress',
      'Image Status': 'In-Progress'
    };
    const result = await createNewContent(newContent);
    if (result) {
      showToast('Content created successfully', 'success');
      await fetchContent();
      updateDashboard();
      switchView('dashboard');
    }
  } catch (error) {
    console.error('Error creating content:', error);
  }
  hideLoading();
});

document.getElementById('content-search').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  if (searchTerm.length < 2) {
    document.getElementById('content-filter').value = state.currentFilter;
    updateContentList();
    return;
  }
  const contentGrid = document.getElementById('content-grid');
  contentGrid.innerHTML = '';
  let baseContent = [...state.contentData];
  if (state.currentFilter !== 'all') {
    baseContent = baseContent.filter(content => {
      const status = getOverallStatus(content.fields);
      switch(state.currentFilter) {
        case 'in-progress': return status === 'In Progress';
        case 'needs-review': return status === 'Needs Review';
        case 'approved': return status === 'Approved';
        case 'scheduled': return status === 'Scheduled';
        case 'published': return status === 'Published';
        default: return true;
      }
    });
  }
  const filteredContent = baseContent.filter(content => {
    const title = (content.fields['Title'] || '').toLowerCase();
    const description = (content.fields['Description'] || '').toLowerCase();
    const contentId = (content.fields['Content ID'] || '').toLowerCase();
    const text = (content.fields['Text'] || '').toLowerCase();
    return title.includes(searchTerm) || description.includes(searchTerm) || contentId.includes(searchTerm) || text.includes(searchTerm);
  });
  if (filteredContent.length === 0) {
    contentGrid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16">
        <i class="fas fa-search text-4xl text-gray-700 mb-3"></i>
        <p class="text-gray-500">No results found for "${searchTerm}"</p>
      </div>
    `;
    return;
  }
  filteredContent.forEach(content => {
    const status = getOverallStatus(content.fields);
    const statusColors = getStatusColors(status);
    const title = content.fields['Title'] || content.fields['Description'] || 'Untitled';
    const hasImage = content.fields['Image'] && content.fields['Image'].length > 0;
    const thumbnailUrl = hasImage ? content.fields['Image'][0].thumbnails.large.url : '';
    contentGrid.innerHTML += `
      <div class="content-card bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl overflow-hidden shadow-modern border border-gray-800/50" data-id="${content.id}">
        <div class="h-48 bg-dark-200/80 relative">
          ${hasImage ? 
            `<img src="${thumbnailUrl}" alt="${title}" class="h-full w-full object-cover">`
            : `<div class="flex h-full items-center justify-center">
              <i class="fas fa-image text-4xl text-dark-300/80"></i>
            </div>`
          }
          <div class="absolute top-3 right-3">
            <span class="status-pill ${statusColors.bg} ${statusColors.text} shadow-md">
              ${status}
            </span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 truncate">${title}</h3>
          <p class="text-sm text-gray-500 mt-1 mb-4">
            ${content.fields['Content ID'] || ''}
            <span class="mx-2">•</span>
            ${formatDate(content.fields['Publish Date'])}
          </p>
          <div class="flex justify-between items-center">
            <div class="flex space-x-2">
              ${content.fields['Text URL'] ? 
                `<a href="${content.fields['Text URL']}" target="_blank" class="p-2 rounded-lg bg-dark-200/60 hover:bg-dark-300/60 text-gray-400 transition-colors shadow-md">
                  <i class="fas fa-file-alt"></i>
                </a>` : ''
              }
              ${content.fields['Folder URL'] ? 
                `<a href="${content.fields['Folder URL']}" target="_blank" class="p-2 rounded-lg bg-dark-200/60 hover:bg-dark-300/60 text-gray-400 transition-colors shadow-md">
                  <i class="fas fa-folder"></i>
                </a>` : ''
              }
            </div>
            <button class="text-sm text-primary-400 hover:text-primary-300 transition-colors view-content-btn relative group" data-id="${content.id}">
              View Details
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  document.querySelectorAll('.content-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('a') && !e.target.classList.contains('view-content-btn')) {
        const contentId = card.getAttribute('data-id');
        viewContentDetails(contentId);
      }
    });
  });
  document.querySelectorAll('.view-content-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const contentId = btn.getAttribute('data-id');
      viewContentDetails(contentId);
    });
  });
});
