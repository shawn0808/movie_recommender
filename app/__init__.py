from flask import Flask
import os

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__, 
                static_folder='../static',
                template_folder='../templates')
    
    # Load configuration
    app.config.from_pyfile('config.py')
    
    # Register routes
    from app import routes
    routes.init_app(app)
    
    return app
