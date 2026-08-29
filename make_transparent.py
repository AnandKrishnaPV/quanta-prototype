from PIL import Image
import numpy as np

def main():
    img = Image.open('frontend/public/logo.jpg').convert("RGBA")
    data = np.array(img)

    r, g, b, a = data.T
    white_areas = (r > 235) & (g > 235) & (b > 235)

    data[..., :-1][white_areas.T] = (255, 255, 255)
    data[..., -1][white_areas.T] = 0

    Image.fromarray(data).save('frontend/public/logo.png')
    print("Saved transparent image to frontend/public/logo.png")

if __name__ == "__main__":
    main()
