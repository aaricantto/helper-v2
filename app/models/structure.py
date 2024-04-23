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
    def get_exclusions():
        exclusions_file = os.path.join(FileStructure.get_project_root(), 'app', 'utils', 'exclude.txt')
        try:
            with open(exclusions_file, 'r') as file:
                # Read the exclusions, strip whitespace, and ignore empty lines
                exclusions = [line.strip() for line in file.readlines() if line.strip()]
        except FileNotFoundError:
            exclusions = []
        return exclusions

    @staticmethod
    def get_folder_contents(folder_path):
        exclusions = FileStructure.get_exclusions()
        contents = {'folders': [], 'files': []}

        with os.scandir(folder_path) as entries:
            for entry in entries:
                # Prepare the relative path for exclusion check
                relative_path = os.path.relpath(entry.path, FileStructure.base_folder())
                # Check if the entry is in the exclusion list
                if any(part in exclusions for part in relative_path.split(os.sep)):
                    continue  # Skip this entry

                if entry.is_dir():
                    contents['folders'].append(entry.name)
                elif entry.is_file():
                    contents['files'].append(entry.name)
        print(contents)
        return contents