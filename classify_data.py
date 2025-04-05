# classify_data.py

import tensorflow as tf
import pickle
import pandas as pd

def load_model_and_encoder(model_path, encoder_path, vocab_path):
    # Load model
    model = tf.keras.models.load_model(model_path)

    # Load label encoder
    with open(encoder_path, "rb") as f:
        label_encoder = pickle.load(f)

    # Load vocabulary
    with open(vocab_path, "r") as f:
        vocab = [line.strip() for line in f]

    # Rebuild vectorizer
    vectorizer = tf.keras.layers.TextVectorization(
        max_tokens=1000, output_mode="int", output_sequence_length=20
    )
    vectorizer.set_vocabulary(vocab)

    return model, label_encoder, vectorizer

def classify_transactions(descriptions, model, vectorizer, label_encoder):
    vectorized = vectorizer(descriptions.astype(str))
    predictions = model.predict(vectorized)
    predicted_labels = label_encoder.inverse_transform(predictions.argmax(axis=1))
    return predicted_labels
