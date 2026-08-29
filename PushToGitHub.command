#!/bin/bash
cd "/Users/anandkrishnapv/Documents/QUANTA PROTOTYPE FILES" || exit

echo "======================================"
echo "🚀 PUSHING QATION TO GITHUB 🚀"
echo "======================================"
echo ""

# Ensure we're a git repo and add the remote
git init
git add .
git commit -m "Initial commit of QATION prototype"

# Connect to GitHub
git remote remove origin 2>/dev/null
git remote add origin https://github.com/AnandKrishnaPV/QATION.git

# Set the main branch
git branch -M main

echo "Uploading main branch (Production Code)..."
echo "👉 Note: If a popup appears asking for your GitHub password or token, please enter it."
echo ""
git push -u origin main

echo ""
echo "Creating and uploading develop branch (Feature Code)..."
git checkout -b develop
git push -u origin develop

echo ""
echo "======================================"
echo "✅ SUCCESS! ALL DONE!"
echo "======================================"
echo ""
echo "You can now safely close this window."
