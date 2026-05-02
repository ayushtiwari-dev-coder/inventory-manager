import os

# Configuration
OUTPUT_FILE = "inventory_full_context.txt"
# We only want actual code and design files
EXTENSIONS = ('.py', '.html', '.css', '.js')
# Folders to ignore so the file doesn't get cluttered
IGNORE_DIRS = {'__pycache__', '.git', '.vscode', 'venv'}

def bundle_everything():
    print("🚀 Starting deep scan of your Inventory System...")
    file_count = 0
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as master:
        # os.walk "walks" through every single folder and subfolder
        for root, dirs, files in os.walk('.'):
            # Skip the folders we don't want
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for filename in files:
                if filename.endswith(EXTENSIONS) and filename != 'bundle.py':
                    file_path = os.path.join(root, filename)
                    relative_path = os.path.relpath(file_path, '.')
                    
                    # Create a clear header 
                    master.write(f"\n\n{'#'*60}\n")
                    master.write(f" LOCATION: {relative_path}\n")
                    master.write(f"{'#'*60}\n\n")
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            master.write(f.read())
                        file_count += 1
                        print(f"✅ Added: {relative_path}")
                    except Exception as e:
                        master.write(f"Error reading file: {e}")

    print(f"\n✨ Done! {file_count} files bundled into {OUTPUT_FILE}")

if __name__ == "__main__":
    bundle_everything()