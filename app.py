from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Configure SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'clipboard.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define ClipboardItem model
class ClipboardItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    source_url = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'source_url': self.source_url,
            'timestamp': self.timestamp.isoformat()
        }

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/api/clipboard', methods=['POST'])
def save_clipboard():
    data = request.get_json()
    
    if not data or 'content' not in data:
        return jsonify({'error': 'No content provided'}), 400
    
    new_item = ClipboardItem(
        content=data['content'],
        source_url=data.get('source_url', '')
    )
    
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify(new_item.to_dict()), 201

@app.route('/api/clipboard', methods=['GET'])
def get_clipboard_items():
    items = ClipboardItem.query.order_by(ClipboardItem.timestamp.desc()).all()
    return jsonify([item.to_dict() for item in items])

@app.route('/api/clipboard/<int:item_id>', methods=['DELETE'])
def delete_clipboard_item(item_id):
    item = ClipboardItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5000)
