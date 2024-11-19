from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import logging
import json

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configure SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'clipboard.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Create sessions directory if it doesn't exist
SESSIONS_DIR = os.path.join(basedir, 'sessions')
os.makedirs(SESSIONS_DIR, exist_ok=True)

db = SQLAlchemy(app)

class ClipboardItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    source_url = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    session_title = db.Column(db.String(200), default="Untitled Session")

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'source_url': self.source_url,
            'timestamp': self.timestamp.isoformat(),
            'session_title': self.session_title
        }

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/api/clipboard', methods=['GET'])
def get_clipboard_items():
    try:
        items = ClipboardItem.query.order_by(ClipboardItem.timestamp.desc()).all()
        items_dict = [item.to_dict() for item in items]
        logger.debug(f"Returning {len(items_dict)} items")
        return jsonify(items_dict)
    except Exception as e:
        logger.error(f"Error in get_clipboard_items: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/clipboard', methods=['POST'])
def save_clipboard():
    try:
        data = request.get_json()
        logger.debug(f"Received POST data: {data}")
        
        if not data or 'content' not in data:
            return jsonify({'error': 'No content provided'}), 400
        
        # Get the current session title from the most recent item
        current_title = "Untitled Session"
        latest_item = ClipboardItem.query.order_by(ClipboardItem.timestamp.desc()).first()
        if latest_item:
            current_title = latest_item.session_title
        
        new_item = ClipboardItem(
            content=data['content'],
            source_url=data.get('source_url', ''),
            session_title=current_title  # Use the current session title
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        logger.error(f"Error in save_clipboard: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/clipboard/<int:item_id>', methods=['DELETE'])
def delete_clipboard_item(item_id):
    try:
        logger.debug(f"Attempting to delete item {item_id}")
        item = ClipboardItem.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        logger.debug(f"Successfully deleted item {item_id}")
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting item {item_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/title', methods=['PUT'])
def update_session_title():
    try:
        data = request.get_json()
        new_title = data.get('title')
        logger.debug(f"Updating session title to: {new_title}")
        
        if not new_title:
            return jsonify({'error': 'No title provided'}), 400
            
        # Update all items without a saved session
        items = ClipboardItem.query.all()  # Update all items to maintain consistency
        for item in items:
            item.session_title = new_title
        
        db.session.commit()
        logger.debug(f"Successfully updated session title")
        return jsonify({'message': 'Session title updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error updating session title: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/end', methods=['POST'])
def end_session():
    try:
        data = request.get_json()
        session_title = data.get('title', 'Untitled Session')
        
        # Get all items for this session
        items = ClipboardItem.query.filter_by(session_title=session_title).all()
        
        if not items:
            return jsonify({'message': 'No items to save'}), 200
            
        # Create session directory
        session_dir = os.path.join(SESSIONS_DIR, session_title)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save items to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"session_{timestamp}.txt"
        filepath = os.path.join(session_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"Session: {session_title}\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            for item in items:
                f.write(f"--- Entry from {item.timestamp.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
                f.write(f"Source: {item.source_url}\n")
                f.write(f"Content:\n{item.content}\n\n")
        
        # Delete items from database
        for item in items:
            db.session.delete(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Session ended and saved successfully',
            'filepath': filepath
        }), 200
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def get_saved_sessions():
    try:
        sessions = []
        # List all directories in the sessions folder
        for session_name in os.listdir(SESSIONS_DIR):
            session_path = os.path.join(SESSIONS_DIR, session_name)
            if os.path.isdir(session_path):
                # Get all files in the session directory
                session_files = []
                for file in os.listdir(session_path):
                    if file.endswith('.txt'):
                        file_path = os.path.join(session_path, file)
                        session_files.append({
                            'filename': file,
                            'path': file_path,
                            'modified': datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                            'size': os.path.getsize(file_path)
                        })
                
                if session_files:  # Only include sessions that have files
                    sessions.append({
                        'title': session_name,
                        'files': sorted(session_files, key=lambda x: x['modified'], reverse=True)
                    })
        
        return jsonify(sorted(sessions, key=lambda x: x['files'][0]['modified'], reverse=True))
    except Exception as e:
        logger.error(f"Error getting saved sessions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions/<path:filepath>', methods=['GET'])
def get_session_content(filepath):
    try:
        # Ensure the file is within the sessions directory
        abs_path = os.path.abspath(os.path.join(SESSIONS_DIR, filepath))
        if not abs_path.startswith(os.path.abspath(SESSIONS_DIR)):
            return jsonify({'error': 'Invalid file path'}), 403
        
        if not os.path.exists(abs_path):
            return jsonify({'error': 'File not found'}), 404
            
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return jsonify({
            'content': content,
            'filename': os.path.basename(filepath)
        })
    except Exception as e:
        logger.error(f"Error reading session file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({"message": "Server is running!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
