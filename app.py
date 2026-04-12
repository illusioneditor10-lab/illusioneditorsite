import os
import uuid
import base64
import requests
from flask import Flask, json, request, Response, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import cloudinary
import cloudinary.uploader

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# --- ENVIRONMENT CONFIGURATION ---
print("VERSION: 3.0 - Ultra Sanitizer Active")
# These will be set on Render dashboard
# Render provides postgres:// but SQLAlchemy requires postgresql://
from urllib.parse import urlparse

database_url = os.environ.get('DATABASE_URL', 'sqlite:///local.db')

if database_url and (database_url.startswith("postgres") or "supabase" in database_url):
    # 1. CLEAN FIRST (Remove stray brackets, double symbols, and spaces)
    database_url = database_url.replace("[", "").replace("]", "")
    database_url = database_url.replace("@@", "@").replace("::", ":").strip()
    
    # 2. Normalize scheme
    if database_url.startswith("postgres://"):
        database_url = "postgresql" + database_url[8:]
    elif not database_url.startswith("postgresql://"):
        if "://" not in database_url:
            database_url = "postgresql://" + database_url

    try:
        # 3. Manual Extraction (Ultra-resilient version)
        # Format: postgresql://user:pwd@host:port/path
        clean = database_url.split("://")[-1]
        
        # We use rsplit to ensure the LAST '@' is the host separator
        creds, rest = clean.rsplit("@", 1)
        
        # Strip any accidental double separators (like @@ or :]@)
        creds = creds.rstrip("@").rstrip(":")
        
        user_pwd = creds.split(":", 1)
        user = user_pwd[0].strip()
        pwd = user_pwd[1].strip() if len(user_pwd) > 1 else ""
        
        # Extract host and path
        host_port_path = rest.split("/", 1)
        host_port = host_port_path[0].split(":", 1)
        host = host_port[0].replace("[", "").replace("]", "").strip()
        path = host_port_path[1] if len(host_port_path) > 1 else "postgres"
        if "?" in path: path = path.split("?")[0]
        
        # 4. Rebuild perfectly
        database_url = f"postgresql://{user}:{pwd}@{host}:6543/{path}?sslmode=require"
        print(f"REDACTED: Connected to host {host} on port 6543")
    except Exception as e:
        print(f"REDACTED: Manual URL cleanup failed: {str(e)}")

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SECRET_TOKEN = os.environ.get('SECRET_TOKEN', 'illusionmaster')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'illusionmaster')

# Cloudinary Setup
cloudinary.config(
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
  api_key = os.environ.get('CLOUDINARY_API_KEY'),
  api_secret = os.environ.get('CLOUDINARY_API_SECRET')
)

db = SQLAlchemy(app)

# --- MODELS ---

class PortfolioItem(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50))
    subCategory = db.Column(db.String(50))
    thumbnail = db.Column(db.Text)
    videoUrl = db.Column(db.Text)
    ytId = db.Column(db.String(50))
    driveId = db.Column(db.String(100))
    description = db.Column(db.Text)
    date = db.Column(db.String(50))
    size = db.Column(db.String(20), default='normal')

class Setting(db.Model):
    __tablename__ = 'site_settings'
    s_key = db.Column(db.String(50), primary_key=True)
    s_value = db.Column(db.Text)

# --- HELPERS ---

def check_auth():
    auth = request.headers.get('Authorization')
    return auth == f"Bearer {SECRET_TOKEN}"

def get_all_settings():
    settings = Setting.query.all()
    res = {"bgMusic": "ambient.wav"}
    for s in settings:
        res[s.s_key] = s.s_value
    return res

# --- API ROUTES ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if data.get('password') == ADMIN_PASSWORD:
        return jsonify({"token": SECRET_TOKEN}), 200
    return jsonify({"error": "Invalid password"}), 401

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    items = PortfolioItem.query.all()
    output = []
    for i in items:
        output.append({
            "id": i.id, "title": i.title, "category": i.category,
            "subcategory": i.subCategory, "thumbnail": i.thumbnail,
            "driveId": i.driveId, "desc": i.description, "date": i.date,
            "size": i.size
        })
    return jsonify(output), 200

@app.route('/api/portfolio', methods=['POST'])
def add_portfolio():
    if not check_auth(): return jsonify({"error": "Unauthorized"}), 401
    d = request.json
    item_id = d.get('id') or str(uuid.uuid4())
    item = PortfolioItem(
        id=item_id, title=d.get('title'), category=d.get('category'),
        subCategory=d.get('subCategory'), thumbnail=d.get('thumbnail'),
        videoUrl=d.get('videoUrl'), ytId=d.get('ytId'), driveId=d.get('driveId'),
        description=d.get('description'), date=d.get('date'), size=d.get('size', 'normal')
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Created", "id": item_id}), 201

@app.route('/api/portfolio/<item_id>', methods=['PUT', 'DELETE'])
def handle_portfolio_item(item_id):
    if not check_auth(): return jsonify({"error": "Unauthorized"}), 401
    item = PortfolioItem.query.get(item_id)
    if not item: return jsonify({"error": "Not found"}), 404
    
    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    
    # PUT
    d = request.json
    item.title = d.get('title', item.title)
    item.category = d.get('category', item.category)
    item.subCategory = d.get('subCategory', item.subCategory)
    item.thumbnail = d.get('thumbnail', item.thumbnail)
    item.videoUrl = d.get('videoUrl', item.videoUrl)
    item.ytId = d.get('ytId', item.ytId)
    item.driveId = d.get('driveId', item.driveId)
    item.description = d.get('description', item.description)
    item.date = d.get('date', item.date)
    item.size = d.get('size', item.size)
    db.session.commit()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'GET':
        return jsonify(get_all_settings()), 200
    
    if not check_auth(): return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    if not data: return jsonify({"error": "No data received"}), 400
    
    try:
        for k, v in data.items():
            s = db.session.get(Setting, k)
            if s:
                s.s_value = str(v)
            else:
                db.session.add(Setting(s_key=k, s_value=str(v)))
        db.session.commit()
        return jsonify({"message": "Settings updated"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"ERROR: Settings save failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload():
    if not check_auth(): return jsonify({"error": "Unauthorized"}), 401
    try:
        payload = request.json
        img_data = payload.get('image_data_base64')
        if not img_data: return jsonify({"error": "No data"}), 400
        
        # Upload to Cloudinary
        # This works with both base64 and URLs
        result = cloudinary.uploader.upload(img_data, folder="portfolio")
        return jsonify({"message": "Uploaded", "url": result.get('secure_url')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/proxy')
def proxy():
    url = request.args.get('url')
    if not url: return "Missing URL", 400
    try:
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, stream=True, timeout=10)
        flask_resp = Response(resp.content, content_type=resp.headers.get('Content-Type'))
        flask_resp.headers['Access-Control-Allow-Origin'] = '*'
        return flask_resp
    except Exception as e:
        return str(e), 500

# Static fallback
@app.route('/')
def index(): return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path): return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Simple migration for 'size' column if it doesn't exist
        try:
            from sqlalchemy import text
            db.session.execute(text('ALTER TABLE portfolio_item ADD COLUMN size VARCHAR(20) DEFAULT \'normal\''))
            db.session.commit()
        except:
            db.session.rollback()
    app.run(port=8000, debug=True)
