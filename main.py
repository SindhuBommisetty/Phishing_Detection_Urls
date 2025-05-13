from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import tldextract
import re
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np
from docx import Document
from urllib.parse import urlparse, urlunparse
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# List of known safe domains (you can extend this list with more domains you trust)
safe_domains = ["weebly.com", "wix.com", "wordpress.com", "github.com", "tumblr.com"]

def extract_features(url):
    features = []
    features.append(1 if url.startswith("https") else 0)
    features.append(len(url))
    features.append(sum(c.isdigit() for c in url))
    features.append(len(re.findall(r"[/?=&#]", url)))
    features.append(1 if re.match(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", url) else 0)

    extracted = tldextract.extract(url)
    features.append(len(extracted.domain))
    features.append(len(extracted.subdomain))
    path = url.split('/')
    features.append(len(path[-1]) if len(path) > 3 else 0)

    features.append(extracted.domain.count('-'))
    features.append(url.count('.'))
    features.append(1 if '@' in url else 0)
    features.append(url.count('/'))
    features.append(url.count('='))
    features.append(url.count('&'))
    features.append(url.count('%'))
    features.append(len(extracted.suffix))
    return features

def extract_urls_from_docx(file_path):
    doc = Document(file_path)
    urls = []
    for para in doc.paragraphs:
        line = para.text.strip()
        if line.startswith("http://") or line.startswith("https://"):
            urls.append(line)
    return urls

def sanitize_url(url):
    parsed = urlparse(url)

    # Removing query parameters, fragment, and path beyond the second level
    cleaned = parsed._replace(query="", params="", fragment="")

    # Cleaning path to keep only the first two segments
    path_parts = parsed.path.split('/')
    if len(path_parts) > 2:
        cleaned = cleaned._replace(path='/'.join(path_parts[:2]))

    # Remove digits from domain
    domain = cleaned.netloc
    domain = re.sub(r'\d+', '', domain)
    cleaned = cleaned._replace(netloc=domain)

    # Remove encoded characters and '@'
    url_str = urlunparse(cleaned)
    url_str = re.sub(r'@', '', url_str)
    url_str = re.sub(r'%[0-9A-Fa-f]{2}', '', url_str)

    return url_str

# Load and prepare data
df = pd.read_csv("url_dataset.csv").dropna(subset=['url', 'type'])
df['label'] = df['type'].map({'legitimate': 0, 'phishing': 1})

phishing_urls = extract_urls_from_docx("https.docx")
phishing_df = pd.DataFrame({'url': phishing_urls, 'label': [1] * len(phishing_urls)})

combined_df = pd.concat([df[['url', 'label']], phishing_df], ignore_index=True)

X_all = combined_df['url'].apply(lambda x: extract_features(x))
X_all = pd.DataFrame(X_all.tolist()).apply(pd.to_numeric, errors='coerce').dropna()
y_all = combined_df['label'].reset_index(drop=True).loc[X_all.index]

X_train, X_test, y_train, y_test = train_test_split(X_all, y_all, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = GradientBoostingClassifier(n_estimators=10, learning_rate=0.1, max_depth=3, subsample=0.8)
model.fit(X_train_scaled, y_train)

y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)

@app.route("/predict-url", methods=["POST"])
def predict_url():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        clean_url = sanitize_url(url)

        # Check if domain is in safe list
        domain = tldextract.extract(clean_url).domain
        if domain in safe_domains:
            return jsonify({
                "result": "Legitimate Link",
                "safe_url": url  # Show original user URL if known safe
            })

        # Predict with model
        features = np.array(extract_features(clean_url)).reshape(1, -1)
        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)[0]

        result = "Suspicious Link" if prediction == 1 else "Legitimate Link"
        safe_url = clean_url if prediction == 1 else url  # Show original if legit

        return jsonify({
            "result": result,
            "safe_url": safe_url
        })
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    try:
        with open("feedback_log.json", "a") as f:
            f.write(json.dumps(data) + "\n")
        return jsonify({"message": "Feedback received!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/model-accuracy", methods=["GET"])
def model_accuracy():
    return jsonify({"accuracy": accuracy})

if __name__ == "__main__":
    app.run(debug=True)
