#!/bin/sh

# GitHub पर कोड पुश करने के लिए यह एक स्क्रिप्ट है।
# सुनिश्चित करें कि आपने टर्मिनल में git कॉन्फ़िगर कर लिया है।

# त्रुटि पर बाहर निकलें
set -e

# अपना GitHub रिपॉजिटरी URL यहाँ डालें
GITHUB_REPO_URL="https://github.com/kbzala12/Yt2026Ab.git"
COMMIT_MESSAGE="प्रोजेक्ट का प्रारंभिक संस्करण"

echo "Git रिपॉजिटरी को इनिशियलाइज़ किया जा रहा है..."
if [ -d ".git" ]; then
  rm -rf .git
fi
git init -b main

echo "फाइलों को स्टेज किया जा रहा है..."
git add .

echo "कमिट किया जा रहा है..."
git commit -m "$COMMIT_MESSAGE"

echo "रिमोट रिपॉजिटरी को जोड़ा जा रहा है..."
git remote add origin $GITHUB_REPO_URL

echo "GitHub पर पुश किया जा रहा है..."
git push -u origin main --force

echo "सफलतापूर्वक GitHub पर पुश हो गया!"
