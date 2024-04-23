from flask import Blueprint, jsonify, request
from app.models.structure import FileStructure
import os

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
    


@bp.route('/copy_files', methods=['POST'])
def copy_files():
    print('ROUTE HAS BEEN CALLED')
    data = request.get_json()  # Get JSON data from the request
    selected_paths = data.get('paths', [])
    combined_content = ""
    base_dir = FileStructure.base_folder()  # Adjust according to your structure

    for i, path in enumerate(selected_paths, start=1):
        # Ensure correct path formatting and make the path relative
        relative_path = os.path.relpath(path, base_dir).replace("\\", "/")
        full_path = os.path.join(base_dir, relative_path)  # Construct full path
        try:
            with open(full_path, 'r') as file:
                contents = file.read()
                combined_content += f"\nSCRIPT {i}: {relative_path}\n\n{contents}\n\n"
        except OSError as e:
            combined_content += f"Error opening {relative_path}: {str(e)}\n"

    return jsonify({"combinedContent": combined_content})