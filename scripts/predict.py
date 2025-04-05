def predict_limits(income, model):
    categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
    results = []

    for category in categories:
        data = {f'category_{cat}': [1 if cat == category else 0] for cat in categories}
        data['monthly_income'] = [income]
        input_df = pd.DataFrame(data)

        # Ensure column order consistency
        ordered_columns = [f'category_{cat}' for cat in sorted(categories)] + ['monthly_income']
        input_df = input_df.reindex(columns=ordered_columns, fill_value=0)

        # Perform predictions
        prediction = model.predict(input_df)[0]
        results.append({"category": category, "monthly_limit": prediction[0], "expected_transactions": prediction[1]})

    return results