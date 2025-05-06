from flask import Flask, render_template, request
import requests

app = Flask(__name__)
LOGIC_APP_URL = 'https://<your-logic-app-url>'  # Replace with your actual URL

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/submit-score', methods=['POST'])
def submit_score():
    data = request.get_json()
    r = requests.post(LOGIC_APP_URL, json={'playerName': data.get('name'), 'scoreInSeconds': data.get('score')})
    return "Score submitted!" if r.ok else "Submission failed."

if __name__ == '__main__':
    app.run(debug=True)
