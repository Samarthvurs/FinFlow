# Simple script to create blank PNG files for PWA icons
import os
from PIL import Image, ImageDraw, ImageFont

def create_finflow_icon(size, filename):
    """Creates a simple icon with 'FF' text"""
    img = Image.new('RGBA', (size, size), color=(76, 175, 80, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple circle background
    draw.ellipse([(10, 10), (size-10, size-10)], fill=(255, 255, 255, 200))
    
    # Try to add text "FF" in the center
    try:
        # This will work if PIL has font support
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
        draw.text((size//2, size//2), "FF", fill=(0, 100, 0, 255), font=font, anchor="mm")
    except:
        # Fallback if font support is not available
        draw.rectangle([(size//3, size//3), (2*size//3, 2*size//3)], fill=(0, 100, 0, 255))
    
    # Save the image
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, 'PNG')
    print(f"Created icon: {filename}")

# Create both icon sizes
create_finflow_icon(192, "static/icons/icon-192x192.png")
create_finflow_icon(512, "static/icons/icon-512x512.png")

print("Icons created successfully!") 