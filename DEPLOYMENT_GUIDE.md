# 🚀 PythonAnywhere Deployment Guide

Follow these steps to host your Cinematic Portfolio live on PythonAnywhere.

## Step 1: Upload Your Files
1. Log in to [PythonAnywhere](https://www.pythonanywhere.com/).
2. Go to the **"Files"** tab.
3. Upload your **entire `website` folder** (or individual files if preferred). 
   - *Tip: If you use the "Dashboard > Files" view, make sure your files are in a folder named something like `/home/yourusername/portfolio/`.*

## Step 2: Create the Web App
1. Go to the **"Web"** tab.
2. Click **"Add a new web app"**.
3. Select **Manual Configuration** (IMPORTANT: Do not select Flask directly yet).
4. Choose **Python 3.10** (or higher).

## Step 3: Configure Virtual Environment
1. In the **"Web"** tab, scroll down to **"Virtualenv"**.
2. Click "Start a console in this virtualenv" (if available) or go to the **"Consoles"** tab and open a **Bash** console.
3. Run the following command:
   ```bash
   pip install flask flask-cors requests
   ```
4. Back in the **"Web"** tab, copy the path to your Virtualenv (usually `/home/yourusername/.virtualenvs/myenv`) and paste it into the Virtualenv section.

## Step 4: Configure WSGI
1. In the **"Web"** tab, find the **"Code"** section and click the link for your **WSGI configuration file**.
2. **Delete everything** inside that file and paste the following:

```python
import sys
import os

path = '/home/YOUR_USERNAME/portfolio' # Replace with your actual project path
if path not in sys.path:
    sys.path.append(path)

os.chdir(path)

from app import app as application
```
3. Click "Save".

## Step 5: Static Files (IMPORTANT)
To make your images and CSS work, you must tell PythonAnywhere where to find them:
1. Go to the **"Web"** tab and scroll to **"Static files"**.
2. Add these entries (replace `YOUR_USERNAME` and the folder name):

| URL | Path |
| :--- | :--- |
| `/` | `/home/YOUR_USERNAME/portfolio/index.html` |
| `/css` | `/home/YOUR_USERNAME/portfolio/css` (if you have a css folder) |
| `/uploads` | `/home/YOUR_USERNAME/portfolio/uploads` |
| `/data` | `/home/YOUR_USERNAME/portfolio/data` |
| `/logo.png` | `/home/YOUR_USERNAME/portfolio/logo.png` |

## Step 6: Reload
1. Go to the top of the **"Web"** tab and click the big green **"Reload"** button.
2. Visit `http://YOUR_USERNAME.pythonanywhere.com` to see your live site!

---
**🛠 Need Help?** If something isn't working, check the **"Error Logs"** at the bottom of the Web tab.
