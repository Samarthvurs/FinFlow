from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

# Load the CSV
CSV_PATH = "classified_transactions.csv"

@app.route("/transactions", methods=["GET"])
def get_transactions():
    try:
        df = pd.read_csv(CSV_PATH)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
