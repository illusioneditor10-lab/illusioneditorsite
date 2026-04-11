import http.server
import socketserver
import json
import os
import uuid
import base64

PORT = 8000
DATA_FILE = 'data/portfolio.json'
SETTINGS_FILE = 'data/settings.json'
SECRET_TOKEN = 'illusionmaster'

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def send_json_response(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
        
    def check_auth(self):
        auth_header = self.headers.get('Authorization')
        if auth_header == f"Bearer {SECRET_TOKEN}":
            return True
        self.send_json_response(401, {"error": "Unauthorized"})
        return False

    def load_data(self):
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r') as f:
            try: return json.load(f)
            except json.JSONDecodeError: return []
            
    def save_data(self, data):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def load_settings(self):
        if not os.path.exists(SETTINGS_FILE):
            return {"bgMusic": "ambient.wav"}
        with open(SETTINGS_FILE, 'r') as f:
            try: return json.load(f)
            except json.JSONDecodeError: return {"bgMusic": "ambient.wav"}

    def save_settings(self, data):
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def do_GET(self):
        if self.path.startswith('/api/portfolio'):
            self.send_json_response(200, self.load_data())
        elif self.path.startswith('/api/settings'):
            self.send_json_response(200, self.load_settings())
        elif self.path.startswith('/api/proxy'):
            import urllib.parse
            import urllib.request
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if 'url' in qs:
                try:
                    req = urllib.request.Request(qs['url'][0], headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req) as response:
                        self.send_response(200)
                        self.send_header('Content-Type', response.headers.get('Content-Type', 'image/jpeg'))
                        self.end_headers()
                        self.wfile.write(response.read())
                    return
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(str(e).encode())
                    return
            self.send_response(400)
            self.end_headers()
        elif self.path == '/':
            self.path = '/index.html'
            super().do_GET()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/login':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(body)
                # Hardcoded secure password 'admin123'
                if data.get('password') == 'admin123':
                    self.send_json_response(200, {"token": SECRET_TOKEN})
                else:
                    self.send_json_response(401, {"error": "Invalid password"})
            except:
                self.send_json_response(400, {"error": "Bad request"})
            return

        if self.path.startswith('/api/portfolio'):
            if not self.check_auth(): return
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                new_item = json.loads(body)
                if 'id' not in new_item or not new_item['id']:
                    new_item['id'] = str(uuid.uuid4())
                
                data = self.load_data()
                data.append(new_item)
                self.save_data(data)
                self.send_json_response(201, {"message": "Created", "item": new_item})
            except Exception as e:
                self.send_json_response(400, {"error": str(e)})
            return

        if self.path.startswith('/api/settings'):
            if not self.check_auth(): return
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                new_settings = json.loads(body)
                settings = self.load_settings()
                settings.update(new_settings)
                self.save_settings(settings)
                self.send_json_response(200, {"message": "Settings updated", "settings": settings})
            except Exception as e:
                self.send_json_response(400, {"error": str(e)})
            return

        if self.path.startswith('/api/upload'):
            if not self.check_auth(): return
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                payload = json.loads(body)
                img_data = payload.get('image_data_base64')
                if not img_data:
                    self.send_json_response(400, {"error": "Missing base64 data"})
                    return
                
                if ',' in img_data:
                    img_data = img_data.split(',')[1]
                
                os.makedirs('uploads', exist_ok=True)
                filename = f"upload_{uuid.uuid4().hex[:8]}.png"
                filepath = os.path.join('uploads', filename)
                
                with open(filepath, 'wb') as f:
                    f.write(base64.b64decode(img_data))
                    
                self.send_json_response(200, {"message": "Uploaded", "url": f"uploads/{filename}"})
            except Exception as e:
                self.send_json_response(400, {"error": str(e)})
            return

        self.send_error(404)
        
    def do_DELETE(self):
        if self.path.startswith('/api/portfolio/'):
            if not self.check_auth(): return
            item_id = self.path.split('/')[-1]
            data = self.load_data()
            new_data = [item for item in data if item['id'] != item_id]
            if len(data) == len(new_data):
                self.send_json_response(404, {"error": "Not found"})
            else:
                self.save_data(new_data)
                self.send_json_response(200, {"message": "Deleted"})
            return
        self.send_error(404)

    def do_PUT(self):
        if self.path.startswith('/api/portfolio/'):
            if not self.check_auth(): return
            item_id = self.path.split('/')[-1]
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                updated_item = json.loads(body)
                updated_item['id'] = item_id
                data = self.load_data()
                for i, item in enumerate(data):
                    if item['id'] == item_id:
                        data[i] = updated_item
                        self.save_data(data)
                        self.send_json_response(200, {"message": "Updated", "item": updated_item})
                        return
                self.send_json_response(404, {"error": "Not found"})
            except Exception as e:
                self.send_json_response(400, {"error": str(e)})
            return
        self.send_error(404)

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
        print(f"Backend Server running at http://localhost:{PORT}")
        httpd.serve_forever()
