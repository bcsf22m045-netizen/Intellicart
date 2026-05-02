# ML Model Files

This directory contains the pre-computed ML recommendation model files.

## Files
- `product_index.json` — Maps product MongoDB `_id` to matrix index
- `similarity_matrix.json` — Pre-computed top-N recommendations per product
- `model_metadata.json` — Model training info and quality metrics

## How to Generate
1. Run the Google Colab notebook: `ml/Product_Recommendation_Model.ipynb`
2. Download the 3 JSON files
3. Place them in this directory

## Re-training
Re-run the Colab notebook when:
- You add 50+ new products
- You add new categories
- Recommendation quality degrades

## File Sizes (typical)
- Small catalog (100 products): ~50 KB total
- Medium catalog (1,000 products): ~500 KB total
- Large catalog (10,000 products): ~5 MB total
