# SCRIPT 1: app/models/structure.py

import os

class FileStructure:
    @staticmethod
    def get_project_root():
        # Assuming this returns the path up to the 'helper-v2' folder
        return os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

    @classmethod
    def base_folder(cls):
        # This should return the full path to the base folder
        base_folder_path = os.path.dirname(cls.get_project_root())
        return base_folder_path


    @staticmethod
    def get_folder_contents(folder_path):
        # Here we assume folder_path is an absolute path
        contents = {'folders': [], 'files': []}
        with os.scandir(folder_path) as entries:
            for entry in entries:
                if entry.is_dir():
                    contents['folders'].append(entry.name)
                elif entry.is_file():
                    contents['files'].append(entry.name)
        return contents
