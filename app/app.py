from flask import Flask, render_template
from app.blueprints.routes import bp as routes_bp

app = Flask(__name__)
app.register_blueprint(routes_bp, url_prefix='/api')

@app.route('/')
def index():
    return render_template('index.html')
