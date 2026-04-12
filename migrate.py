import json
import os
from app import app, db, PortfolioItem, Setting

def migrate():
    print("🚀 Starting Migration: JSON -> Database...")
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # 1. Migrate Settings
        settings_path = 'data/settings.json'
        if os.path.exists(settings_path):
            with open(settings_path, 'r') as f:
                data = json.load(f)
                for k, v in data.items():
                    if not db.session.get(Setting, k):
                        db.session.add(Setting(s_key=k, s_value=str(v)))
            print("✅ Settings migrated.")
        
        # 2. Migrate Portfolio
        portfolio_path = 'data/portfolio.json'
        if os.path.exists(portfolio_path):
            with open(portfolio_path, 'r') as f:
                items = json.load(f)
                for i in items:
                    if not PortfolioItem.query.get(i['id']):
                        item = PortfolioItem(
                            id=i['id'], 
                            title=i.get('title'), 
                            category=i.get('category'),
                            subCategory=i.get('subcategory') or i.get('subCategory'), 
                            thumbnail=i.get('thumbnail'),
                            videoUrl=i.get('videoUrl'), 
                            ytId=i.get('ytId'), 
                            driveId=i.get('driveId'),
                            description=i.get('desc') or i.get('description'), 
                            date=i.get('date') or '2024'
                        )
                        db.session.add(item)
            print(f"✅ {len(items)} Portfolio items migrated.")
            
        db.session.commit()
        print("🎉 Migration Complete! Your live database is now synced.")

if __name__ == '__main__':
    migrate()
