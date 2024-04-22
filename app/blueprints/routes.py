from flask import Blueprint, jsonify
from app.models.structure import FileStructure

bp = Blueprint('routes', __name__)

@bp.route('/base', methods=['GET'])
def base():
    try:
        base = FileStructure.base_folder()
        return jsonify(base)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/folder_contents/<path:folder_path>', methods=['GET'])
def folder_contents(folder_path):
    try:
        # Assuming folder_path is now the absolute path
        contents = FileStructure.get_folder_contents(folder_path)
        return jsonify(contents)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    






    ############# FOR TOMORROW
    # - create a list of exclusionary files - a list of files to disclude from @staticmethod - get_folder_contents(folder_path):
    # - create a copy paste button for prompting the GPT