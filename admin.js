const loginView = document.getElementById('loginView');
const dashboard = document.getElementById('dashboard');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const passInput = document.getElementById('adminPassword');
const logoutBtn = document.getElementById('logoutBtn');

const form = document.getElementById('portfolioForm');
const itemList = document.getElementById('itemList');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const addNewBtn = document.getElementById('addNewBtn');

const settingsForm = document.getElementById('settingsForm');
const bgMusicUrl = document.getElementById('bgMusicUrl');
const heroPhotoUrl = document.getElementById('heroPhotoUrl');
const aboutPhotoUrl = document.getElementById('aboutPhotoUrl');
const settingsFeedback = document.getElementById('settingsFeedback');

let currentToken = localStorage.getItem('illusionToken');
let portfolioData = [];
let editingId = null;

// Initialization
if (currentToken) {
  showDashboard();
  loadData();
}

// Auth
loginBtn.addEventListener('click', async () => {
  const pwd = passInput.value;
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
      loginError.style.display = 'none';
      showDashboard();
      loadData();
    } else {
      loginError.style.display = 'block';
    }
  } catch (err) {
    console.error(err);
  }
});

logoutBtn.addEventListener('click', () => {
  currentToken = null;
  localStorage.removeItem('illusionToken');
  dashboard.style.display = 'none';
  loginView.style.display = 'block';
  passInput.value = '';
});

function showDashboard() {
  loginView.style.display = 'none';
  dashboard.style.display = 'block';
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentToken}`
  };
}

async function loadData() {
  itemList.innerHTML = '<p style="color:#999">Loading items...</p>';
  try {
    const res = await fetch('/api/portfolio');
    if (res.ok) {
      portfolioData = await res.json();
      renderItems();
    } else if (res.status === 401) {
      logoutBtn.click();
      return;
    }
    
    // Load Settings
    const sRes = await fetch('/api/settings');
    if(sRes.ok) {
        const settings = await sRes.json();
        if(settings.bgMusic) bgMusicUrl.value = settings.bgMusic;
        if(settings.heroPhoto) heroPhotoUrl.value = settings.heroPhoto;
        if(settings.aboutPhoto) aboutPhotoUrl.value = settings.aboutPhoto;
    }
  } catch (err) {
    console.error(err);
    itemList.innerHTML = '<p style="color:#e94560">Error loading data</p>';
  }
}

function renderItems() {
  itemList.innerHTML = '';
  if (portfolioData.length === 0) {
    itemList.innerHTML = '<p style="color:#999">No videos yet. Add one!</p>';
    return;
  }
  
  portfolioData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-card';
    const tId = item.thumbnail || item.driveId;
    
    div.innerHTML = `
      <img src="https://drive.google.com/uc?export=view&id=${tId}" alt="Thumb" onerror="this.src='https://via.placeholder.com/120x70?text=No+Thumb'"/>
      <div class="item-card-info">
        <h3>${item.title}</h3>
        <p>${item.category.toUpperCase()} ${item.subcategory ? '· ' + item.subcategory : ''} | ${item.desc || ''}</p>
        <p style="font-size:0.7rem;opacity:0.5;">ID: ${item.driveId}</p>
      </div>
      <div class="item-actions">
        <button class="btn" style="padding:0.4rem 0.8rem;font-size:0.8rem" onclick="editItem('${item.id}')">Edit</button>
        <button class="btn danger" style="padding:0.4rem 0.8rem;font-size:0.8rem" onclick="deleteItem('${item.id}')">Delete</button>
      </div>
    `;
    itemList.appendChild(div);
  });
}

// Form Submission (Add/Edit)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newItem = {
    title: document.getElementById('title').value,
    driveId: document.getElementById('driveId').value,
    thumbnail: document.getElementById('thumbnail').value,
    desc: document.getElementById('desc').value,
    category: document.getElementById('category').value,
    subcategory: document.getElementById('subcategory').value,
    size: document.getElementById('size').value
  };

  try {
    let res;
    if (editingId) {
      res = await fetch(`/api/portfolio/${editingId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(newItem)
      });
    } else {
      res = await fetch(`/api/portfolio`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newItem)
      });
    }
    
    if (res.ok) {
      resetForm();
      loadData();
    } else if (res.status === 401) {
      logoutBtn.click();
    }
  } catch (err) {
    console.error("Save error: ", err);
  }
});

window.editItem = function(id) {
  const item = portfolioData.find(i => i.id === id);
  if (!item) return;
  
  editingId = id;
  formTitle.textContent = "Edit Video";
  document.getElementById('title').value = item.title || '';
  document.getElementById('driveId').value = item.driveId || '';
  document.getElementById('thumbnail').value = item.thumbnail || '';
  document.getElementById('desc').value = item.desc || '';
  document.getElementById('category').value = item.category || 'wedding';
  document.getElementById('subcategory').value = item.subcategory || '';
  document.getElementById('size').value = item.size || 'normal';
  
  cancelBtn.hidden = false;
};

cancelBtn.addEventListener('click', resetForm);
if(addNewBtn) addNewBtn.addEventListener('click', resetForm);

function resetForm() {
  editingId = null;
  formTitle.textContent = "Add New Video";
  form.reset();
  cancelBtn.hidden = true;
}

window.deleteItem = async function(id) {
  if (!confirm("Are you sure you want to delete this video?")) return;
  
  try {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      loadData();
    } else if (res.status === 401) {
      logoutBtn.click();
    }
  } catch (err) {
    console.error("Delete error", err);
  }
};

if(settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          bgMusic: bgMusicUrl.value,
          heroPhoto: heroPhotoUrl ? heroPhotoUrl.value : '',
          aboutPhoto: aboutPhotoUrl ? aboutPhotoUrl.value : ''
        })
      });
      if(res.ok) {
        settingsFeedback.style.display = 'block';
        setTimeout(() => settingsFeedback.style.display = 'none', 3000);
      }
    } catch(e) {
      console.error(e);
    }
  });
}

/* ── CROPPER UI LOGIC ─────────────────────────────────────── */
let crpInst = null;
let currentCropTarget = null;
let currentCropRatio = NaN;

window.openCropper = function(inputId, ratio) {
  currentCropTarget = inputId;
  currentCropRatio = ratio;
  
  const existingValue = document.getElementById(inputId).value;
  if(existingValue && existingValue.trim() !== '' && confirm("Do you want to crop the existing link? (Click Cancel to upload a new file from your computer instead)")) {
      let imgUrl = existingValue;
      const match = imgUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if(match && match[1]) {
         imgUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
      
      document.getElementById('cropperModal').style.display = 'flex';
      const image = document.getElementById('cropperImage');
      
      // We must trick CORS parsing using an open proxy so Canvas can export it
      image.crossOrigin = "anonymous";
      
      // If it's a local relative file (like uploads/123.png), it doesn't need a proxy
      if(imgUrl.startsWith('http')) {
         image.src = "/api/proxy?url=" + encodeURIComponent(imgUrl);
      } else {
         image.src = imgUrl;
      }
      
      image.onload = function() {
          if(crpInst) crpInst.destroy();
          crpInst = new Cropper(image, { aspectRatio: currentCropRatio, viewMode: 2, background: false });
      };
      
      image.onerror = function() {
          alert("Error loading external image. Try downloading it to your Mac and uploading it directly.");
          closeCropper();
      }
      return;
  }
  
  // Normal File Upload flow
  document.getElementById('globalImageUploader').click();
};

window.closeCropper = function() {
  document.getElementById('cropperModal').style.display = 'none';
  if (crpInst) {
    crpInst.destroy();
    crpInst = null;
  }
  document.getElementById('globalImageUploader').value = '';
};

const uploader = document.getElementById('globalImageUploader');
if (uploader) {
  uploader.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('cropperModal').style.display = 'flex';
      const image = document.getElementById('cropperImage');
      image.src = evt.target.result;
      
      if (crpInst) crpInst.destroy();
      crpInst = new Cropper(image, {
        aspectRatio: currentCropRatio,
        viewMode: 2,
        background: false
      });
    };
    reader.readAsDataURL(file);
  });
}

const saveCropBtn = document.getElementById('saveCropBtn');
if (saveCropBtn) {
  saveCropBtn.addEventListener('click', async function() {
    if (!crpInst) return;
    const btn = this;
    btn.innerText = 'Uploading...';
    
    const canvas = crpInst.getCroppedCanvas({
       maxWidth: 1920,
       maxHeight: 1920,
       fillColor: '#fff'
    });
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
        closeCropper();
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error.");
    }
    btn.innerText = 'Save Crop & Upload';
  });
}
