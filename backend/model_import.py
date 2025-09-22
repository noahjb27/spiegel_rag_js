#!/usr/bin/env python3
"""
Model Import Script for SpiegelRAG

This script downloads and extracts the required FastText models for the SpiegelRAG backend.
Run this script after cloning the repository for the first time.

Usage:
    python model_import.py
"""

import requests
import zipfile
import os
import sys
from pathlib import Path

def download_and_extract_models():
    """Download and extract FastText models from HU Berlin Box."""
    
    # URL der Zip-Datei
    url = 'https://box.hu-berlin.de/f/34c17bfd74b84454b276/?dl=1'
    
    # Get the backend directory (where this script is located)
    backend_dir = Path(__file__).parent
    zip_filename = backend_dir / 'downloaded_models.zip'
    extract_dir = backend_dir / 'models'
    
    print("🔄 Downloading FastText models from HU Berlin Box...")
    print(f"📁 Target directory: {extract_dir}")
    
    try:
        # Zip-Datei herunterladen
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Progress tracking
        total_size = int(response.headers.get('content-length', 0))
        downloaded_size = 0
        
        print(f"📦 Downloading {total_size / (1024*1024):.1f} MB...")
        
        # Zip-Datei speichern
        with open(zip_filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded_size += len(chunk)
                    if total_size > 0:
                        progress = (downloaded_size / total_size) * 100
                        print(f"\r⬇️  Progress: {progress:.1f}%", end='', flush=True)
        
        print("\n✅ Download completed!")
        
        # Verzeichnis für extrahierte Dateien erstellen
        os.makedirs(extract_dir, exist_ok=True)
        
        print("📂 Extracting files...")
        
        # Dateien entpacken
        with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        print(f"✅ Files extracted to {extract_dir}")
        
        # Aufräumen: Zip-Datei löschen
        os.remove(zip_filename)
        print("🧹 Cleaned up temporary zip file")
        
        # Liste der extrahierten Dateien anzeigen
        print("\n📋 Extracted files:")
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(backend_dir)
                file_size = file_path.stat().st_size / (1024*1024)  # MB
                print(f"  📄 {relative_path} ({file_size:.1f} MB)")
        
        print("\n🎉 Model import completed successfully!")
        print("💡 You can now start the backend server with: python run.py")
        
    except requests.RequestException as e:
        print(f"❌ Error downloading models: {e}")
        sys.exit(1)
    except zipfile.BadZipFile as e:
        print(f"❌ Error extracting zip file: {e}")
        if zip_filename.exists():
            os.remove(zip_filename)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        if zip_filename.exists():
            os.remove(zip_filename)
        sys.exit(1)

def check_models_exist():
    """Check if models are already downloaded."""
    backend_dir = Path(__file__).parent
    models_dir = backend_dir / 'models'
    
    if models_dir.exists() and any(models_dir.iterdir()):
        print("ℹ️  Models directory already exists with files:")
        for file_path in models_dir.rglob('*'):
            if file_path.is_file():
                relative_path = file_path.relative_to(backend_dir)
                file_size = file_path.stat().st_size / (1024*1024)  # MB
                print(f"  📄 {relative_path} ({file_size:.1f} MB)")
        
        response = input("\n❓ Do you want to re-download the models? (y/N): ")
        return response.lower() in ['y', 'yes']
    
    return True

def main():
    """Main function."""
    print("🚀 SpiegelRAG Model Import Script")
    print("=" * 40)
    
    if check_models_exist():
        download_and_extract_models()
    else:
        print("✨ Skipping download. Models are already available.")

if __name__ == "__main__":
    main()
