import joblib
import pandas as pd

# Load scikit-learn models and support files
def load_model_and_encoder(classifier_path, encoder_path, vectorizer_path):
    classifier = joblib.load(classifier_path)
    label_encoder = joblib.load(encoder_path)
    vectorizer = joblib.load(vectorizer_path)
    return classifier, label_encoder, vectorizer

# Classify transactions based on descriptions
def classify_transactions(descriptions, classifier, vectorizer, label_encoder):
    vectorized = vectorizer.transform(descriptions)
    predictions = classifier.predict(vectorized)
    predicted_labels = label_encoder.inverse_transform(predictions)
    return predicted_labels

if __name__ == "__main__":
    # Example usage
    classifier_path = "model/transaction_classifier.pkl"
    encoder_path = "model/label_encoder.pkl"
    vectorizer_path = "model/vectorizer.pkl"

    # Load models
    classifier, label_encoder, vectorizer = load_model_and_encoder(
        classifier_path, encoder_path, vectorizer_path
    )

    # Classify sample descriptions
    descriptions = pd.Series(["Starbucks Coffee", "Uber Ride", "Electricity Bill"])
    predicted_categories = classify_transactions(descriptions, classifier, vectorizer, label_encoder)

    print("Predicted categories:", predicted_categories)