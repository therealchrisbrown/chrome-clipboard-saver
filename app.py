from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import logging
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS - Allow requests from Chrome extension and localhost
CORS(app, 
     resources={r"/*": {
         "origins": ["*"],  # Allow all origins, we'll filter in after_request
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Origin"],
         "supports_credentials": False,  # Changed to False since we're not using credentials
         "send_wildcard": True
     }})

# Configure the SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'clipboard.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class ClipboardItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    source_url = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    session_title = db.Column(db.String(100), default="Untitled Session")

with app.app_context():
    db.create_all()

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Origin')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

@app.after_request
def after_request(response):
    # Allow all origins for now (you can restrict this in production)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

@app.route('/api/clipboard', methods=['GET'])
def get_clipboard_items():
    try:
        items = ClipboardItem.query.order_by(ClipboardItem.timestamp.desc()).all()
        return jsonify([{
            'id': item.id,
            'content': item.content,
            'source_url': item.source_url,
            'timestamp': item.timestamp.isoformat(),
            'session_title': item.session_title
        } for item in items])
    except Exception as e:
        logger.error(f"Error in get_clipboard_items: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/clipboard', methods=['POST'])
def add_clipboard_item():
    try:
        data = request.get_json()
        logger.debug(f"Received clipboard data: {data}")
        
        if not data or 'content' not in data:
            return jsonify({'error': 'No content provided'}), 400
            
        new_item = ClipboardItem(
            content=data['content'],
            source_url=data.get('source_url', ''),
            session_title=data.get('session_title', 'Untitled Session')
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify({
            'id': new_item.id,
            'content': new_item.content,
            'source_url': new_item.source_url,
            'timestamp': new_item.timestamp.isoformat(),
            'session_title': new_item.session_title
        }), 201
    except Exception as e:
        logger.error(f"Error in add_clipboard_item: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/clipboard/<int:id>', methods=['DELETE'])
def delete_clipboard_item(id):
    try:
        item = ClipboardItem.query.get_or_404(id)
        db.session.delete(item)
        db.session.commit()
        return '', 204
    except Exception as e:
        logger.error(f"Error in delete_clipboard_item: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/title', methods=['PUT'])
def update_session_title():
    try:
        data = request.get_json()
        if not data or 'title' not in data:
            return jsonify({'error': 'No title provided'}), 400
            
        new_title = data['title']
        items = ClipboardItem.query.all()
        
        for item in items:
            item.session_title = new_title
            
        db.session.commit()
        return jsonify({'message': 'Session title updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error in update_session_title: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/end', methods=['POST'])
def end_session():
    try:
        data = request.get_json()
        title = data.get('title', 'Untitled Session')
        
        # Create sessions directory if it doesn't exist
        sessions_dir = os.path.join(basedir, 'sessions')
        if not os.path.exists(sessions_dir):
            os.makedirs(sessions_dir)
        
        # Create session directory
        session_dir = os.path.join(sessions_dir, title)
        if not os.path.exists(session_dir):
            os.makedirs(session_dir)
        
        # Get items for current session
        items = ClipboardItem.query.filter_by(session_title=title).order_by(ClipboardItem.timestamp.desc()).all()
        
        if not items:
            return jsonify({'message': 'No items to save'}), 200
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{title}_{timestamp}.txt"
        filepath = os.path.join(session_dir, filename)
        
        # Write items to file
        with open(filepath, 'w') as f:
            for item in items:
                f.write(f"Content: {item.content}\n")
                f.write(f"Source URL: {item.source_url}\n")
                f.write(f"Timestamp: {item.timestamp}\n")
                f.write("-" * 80 + "\n")
        
        # Clear items from database
        for item in items:
            db.session.delete(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Session saved successfully',
            'filepath': filepath
        }), 200
    except Exception as e:
        logger.error(f"Error in end_session: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    try:
        sessions_dir = os.path.join(basedir, 'sessions')
        if not os.path.exists(sessions_dir):
            return jsonify([])
            
        sessions = []
        for root, dirs, files in os.walk(sessions_dir):
            rel_path = os.path.relpath(root, sessions_dir)
            if rel_path == '.':
                continue
                
            session = {
                'name': os.path.basename(root),
                'path': rel_path,
                'files': []
            }
            
            for file in files:
                if file.endswith('.txt'):
                    file_path = os.path.join(root, file)
                    session['files'].append({
                        'name': file,
                        'path': os.path.join(rel_path, file),
                        'size': os.path.getsize(file_path),
                        'modified': os.path.getmtime(file_path)
                    })
                    
            if session['files']:
                sessions.append(session)
                
        return jsonify(sessions)
    except Exception as e:
        logger.error(f"Error in get_sessions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions/<path:filepath>', methods=['GET'])
def get_session_file(filepath):
    try:
        sessions_dir = os.path.join(basedir, 'sessions')
        file_path = os.path.join(sessions_dir, filepath)
        
        # Validate the file path
        if not os.path.commonprefix([os.path.abspath(file_path), sessions_dir]).startswith(sessions_dir):
            return jsonify({'error': 'Invalid file path'}), 400
            
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
            
        with open(file_path, 'r') as f:
            content = f.read()
            
        return jsonify({'content': content})
    except Exception as e:
        logger.error(f"Error in get_session_file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions/<path:filepath>', methods=['DELETE'])
def delete_session(filepath):
    try:
        sessions_dir = os.path.join(basedir, 'sessions')
        path = os.path.join(sessions_dir, filepath)
        
        # Validate the file path
        if not os.path.commonprefix([os.path.abspath(path), sessions_dir]).startswith(sessions_dir):
            return jsonify({'error': 'Invalid file path'}), 400
            
        if not os.path.exists(path):
            return jsonify({'error': 'Path not found'}), 404
            
        if os.path.isfile(path):
            os.remove(path)
        else:
            for root, dirs, files in os.walk(path, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir(path)
            
        return '', 204
    except Exception as e:
        logger.error(f"Error in delete_session: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({"message": "Server is running!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
