'use strict';

// ── DOM ELEMENTS ───────────────────────────────────────────
const views = {
    login: document.getElementById('loginView'),
    dashboard: document.getElementById('dashboard'),
    overview: document.getElementById('overviewSection'),
    portfolio: document.getElementById('portfolioSection'),
    settings: document.getElementById('settingsSection')
};

const forms = {
    login: document.getElementById('loginForm'),
    portfolio: document.getElementById('portfolioForm'),
    settings: document.getElementById('settingsForm')
};

const stats = {
    total: document.getElementById('stat-total-videos'),
    wedding: document.getElementById('stat-wedding-count'),
    commercial: document.getElementById('stat-commercial-count')
};

const lists = {
    recent: document.getElementById('recent-items-list'),
    full: document.getElementById('full-portfolio-list')
};

// Controls
const navLinks = document.querySelectorAll('.nav-link[data-view]');
const portfolioSearch = document.getElementById('portfolioSearch');
const addVideoBtn = document.getElementById('addVideoBtn');
const closeVideoModal = document.getElementById('closeVideoModal');
const logoutBtn = document.getElementById('logoutBtn');
const cropperModal = document.getElementById('cropperModal');
const globalImageUploader = document.getElementById('globalImageUploader');

// ── STATE ──────────────────────────────────────────────────
let currentToken = localStorage.getItem('illusionToken');
let portfolioData = [];
let editingId = null;
let currentCropTarget = null;
let currentCropRatio = NaN;
let crpInst = null;

// ── INITIALIZATION ────────────────────────────────────────
if (currentToken) {
    showView('dashboard');
    loadData();
}

// ── NAVIGATION & VIEWS ────────────────────────────────────
function showView(viewName) {
    if (viewName === 'dashboard') {
        views.login.style.display = 'none';
        views.dashboard.style.display = 'flex';
        switchTab('overview');
    } else {
        views.login.style.display = 'flex';
        views.dashboard.style.display = 'none';
    }
}

function switchTab(tabId) {
    // Update Nav
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.view === tabId);
    });

    // Update Sections
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `${tabId}Section`);
    });

    if (tabId === 'overview') updateStats();
}

navLinks.forEach(link => {
    link.addEventListener('click', () => switchTab(link.dataset.view));
});

// ── AUTHENTICATION ────────────────────────────────────────
forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = document.getElementById('adminPassword').value;
    const btn = document.getElementById('loginBtn');
    const err = document.getElementById('loginError');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        
        if (res.ok) {
            const data = await res.json();
            currentToken = data.token;
            localStorage.setItem('illusionToken', currentToken);
            err.style.display = 'none';
            showView('dashboard');
            loadData();
            showToast('Access Granted. Welcome, Master.', 'success');
        } else {
            err.style.display = 'block';
            showToast('Verification failed. Invalid signature.', 'error');
        }
    } catch (err) {
        showToast('Server connection error.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Verify Access';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('illusionToken');
    currentToken = null;
    showView('login');
    showToast('Secure Session Terminated.', 'info');
});

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
    };
}

// ── CORE DATA LOADING ─────────────────────────────────────
async function loadData() {
    try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
            portfolioData = await res.json();
            renderPortfolio();
            updateStats();
        } else if (res.status === 401) {
            logoutBtn.click();
        }

        // Load Settings
        const sRes = await fetch('/api/settings');
        if (sRes.ok) {
            const settings = await sRes.json();
            document.getElementById('bgMusicUrl').value = settings.bgMusic || '';
            document.getElementById('heroPhotoUrl').value = settings.heroPhoto || '';
            document.getElementById('aboutPhotoUrl').value = settings.aboutPhoto || '';
        }
    } catch (err) {
        showToast('Failed to sync with vault.', 'error');
    }
}

// ── PORTFOLIO RENDERING ───────────────────────────────────
function renderPortfolio(filter = '') {
    const filtered = portfolioData.filter(item => 
        item.title.toLowerCase().includes(filter.toLowerCase()) ||
        item.category.toLowerCase().includes(filter.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(filter.toLowerCase()))
    );

    // Sort by most recent for Full List
    const sorted = [...filtered].reverse();
    lists.full.innerHTML = sorted.length ? '' : '<p class="text-muted">No items match your search.</p>';
    
    sorted.forEach(item => {
        lists.full.appendChild(createItemCard(item));
    });

    // Recent items (last 3)
    const recent = [...portfolioData].reverse().slice(0, 3);
    lists.recent.innerHTML = recent.length ? '' : '<p class="text-muted">Your portfolio is empty.</p>';
    recent.forEach(item => {
        lists.recent.appendChild(createItemCard(item, true));
    });
}

function createItemCard(item, mini = false) {
    const div = document.createElement('div');
    div.className = 'item-card';
    const thumbId = item.thumbnail || item.driveId || '';
    let thumbUrl = 'https://via.placeholder.com/300x169?text=No+Media+ID';
    
    if (thumbId) {
        if (thumbId.startsWith('http') || thumbId.startsWith('uploads/')) {
            thumbUrl = thumbId;
        } else {
            thumbUrl = `https://drive.google.com/uc?export=view&id=${thumbId}`;
        }
    }

    div.innerHTML = `
        <div class="item-thumb">
            <img src="${thumbUrl}" alt="Thumbnail" onerror="this.src='https://via.placeholder.com/300x169?text=Broken+Link'">
            <span class="item-badge">${item.category}</span>
        </div>
        <div class="item-info">
            <h3>${item.title}</h3>
            <p>${item.subcategory || 'General'} · ${item.desc || 'No description'}</p>
        </div>
        <div class="item-actions">
            <button class="btn btn-secondary btn-icon" title="Edit" onclick="editItem('${item.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn btn-danger btn-icon" title="Delete" onclick="deleteItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
    return div;
}

function updateStats() {
    stats.total.innerText = portfolioData.length;
    stats.wedding.innerText = portfolioData.filter(i => i.category === 'wedding').length;
    stats.commercial.innerText = portfolioData.filter(i => i.category === 'commercial').length;
}

portfolioSearch.addEventListener('input', (e) => renderPortfolio(e.target.value));

// ── CRUD OPERATIONS ────────────────────────────────────────
addVideoBtn.addEventListener('click', () => {
    editingId = null;
    forms.portfolio.reset();
    document.getElementById('modalFormTitle').innerText = 'Add New Video';
    document.getElementById('saveBtn').innerText = 'Publish Video';
    openModal('videoModal');
});

forms.portfolio.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const item = {
        title: document.getElementById('title').value,
        driveId: document.getElementById('driveId').value,
        thumbnail: document.getElementById('thumbnail').value,
        desc: document.getElementById('desc').value,
        category: document.getElementById('category').value,
        subcategory: document.getElementById('subcategory').value,
        size: document.getElementById('size').value
    };

    try {
        const url = editingId ? `/api/portfolio/${editingId}` : '/api/portfolio';
        const method = editingId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(item)
        });

        if (res.ok) {
            showToast(editingId ? 'Memory updated.' : 'New memory published.', 'success');
            closeModal('videoModal');
            loadData();
        } else {
            showToast('Failed to save to vault.', 'error');
        }
    } catch (err) {
        showToast('Network error.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = editingId ? 'Update Video' : 'Publish Video';
    }
});

window.editItem = (id) => {
    const item = portfolioData.find(i => i.id === id);
    if (!item) return;

    editingId = id;
    document.getElementById('modalFormTitle').innerText = 'Edit Memory';
    document.getElementById('saveBtn').innerText = 'Update Video';
    
    document.getElementById('title').value = item.title || '';
    document.getElementById('driveId').value = item.driveId || '';
    document.getElementById('thumbnail').value = item.thumbnail || '';
    document.getElementById('desc').value = item.desc || '';
    document.getElementById('category').value = item.category || 'wedding';
    document.getElementById('subcategory').value = item.subcategory || '';
    document.getElementById('size').value = item.size || 'normal';

    openModal('videoModal');
};

window.deleteItem = async (id) => {
    if (!confirm('Are you certain you wish to erase this memory from the vault?')) return;

    try {
        const res = await fetch(`/api/portfolio/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (res.ok) {
            showToast('Memory erased successfully.', 'info');
            loadData();
        } else {
            showToast('The vault refused the deletion.', 'error');
        }
    } catch (err) {
        showToast('Connection severed.', 'error');
    }
};

forms.settings.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const data = {
        bgMusic: document.getElementById('bgMusicUrl').value,
        heroPhoto: document.getElementById('heroPhotoUrl').value,
        aboutPhoto: document.getElementById('aboutPhotoUrl').value
    };

    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('Global configurations updated.', 'success');
        } else {
            showToast('Vault rejected settings.', 'error');
        }
    } catch (err) {
        showToast('Network error.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Global Settings';
    }
});

// ── CROPPER & UPLOADS ──────────────────────────────────────
window.openCropper = function(inputId, ratio) {
    currentCropTarget = inputId;
    currentCropRatio = ratio;
    
    const existingValue = document.getElementById(inputId).value;
    if(existingValue && existingValue.trim() !== '' && confirm("Crop existing image? (Cancel to upload new file)")) {
        let imgUrl = existingValue;
        if(imgUrl.includes('drive.google.com')) {
           const match = imgUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
           if(match) imgUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
        
        setupCropper(imgUrl.startsWith('http') ? "/api/proxy?url=" + encodeURIComponent(imgUrl) : imgUrl);
        return;
    }
    
    globalImageUploader.click();
};

globalImageUploader.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setupCropper(evt.target.result);
    reader.readAsDataURL(file);
});

function setupCropper(src) {
    const modal = document.getElementById('cropperModal');
    const image = document.getElementById('cropperImage');
    
    modal.style.display = 'flex';
    image.crossOrigin = "anonymous";
    image.src = src;
    
    image.onload = () => {
        if(crpInst) crpInst.destroy();
        crpInst = new Cropper(image, { aspectRatio: currentCropRatio, viewMode: 2, background: false });
    };
}

window.closeCropper = () => {
    document.getElementById('cropperModal').style.display = 'none';
    if (crpInst) { crpInst.destroy(); crpInst = null; }
    globalImageUploader.value = '';
};

document.getElementById('saveCropBtn').addEventListener('click', async function() {
    if (!crpInst) return;
    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;
    
    const canvas = crpInst.getCroppedCanvas({ maxWidth: 1920, maxHeight: 1920, fillColor: '#fff' });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ image_data_base64: dataUrl })
        });
        
        if (res.ok) {
            const data = await res.json();
            document.getElementById(currentCropTarget).value = data.url;
            showToast('Image uploaded to cloud.', 'success');
            closeCropper();
        } else {
            showToast('Upload failed.', 'error');
        }
    } catch (err) {
        showToast('Upload error.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ── UI HELPERS ────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = '';
}

window.closeModal = closeModal;
closeVideoModal.onclick = () => closeModal('videoModal');

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-exclamation',
        info: 'fa-circle-info',
        warning: 'fa-triangle-exclamation'
    };

    toast.innerHTML = `
        <i class="fa-solid ${icons[type]}"></i>
        <span>${msg}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Category logic visibility
document.getElementById('category').addEventListener('change', (e) => {
    document.getElementById('subcategory-wrap').style.display = (e.target.value === 'wedding') ? 'block' : 'none';
});
