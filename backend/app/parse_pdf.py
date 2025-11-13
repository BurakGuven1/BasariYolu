import fitz
import easyocr
import cv2
import numpy as np
from pathlib import Path

reader = easyocr.Reader(['tr'])  # Türkçe destekli OCR

def get_question_positions(image):
    """OCR ile soru numaralarını (1., 2., 3.) ve koordinatlarını bulur"""
    results = reader.readtext(image)

    positions = []

    for (bbox, text, prob) in results:
        clean = text.replace(")", "").replace(".", "").strip()

        if clean.isdigit():
            # soru numarası bulduk
            q_number = int(clean)

            # bbox: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            y_top = min([p[1] for p in bbox])

            positions.append({
                "number": q_number,
                "y": y_top
            })

    return sorted(positions, key=lambda x: x["y"])


def crop_questions_from_page(image, positions):
    """Soru başlangıç pozisyonlarına göre crop alanlarını çıkarır"""

    if not positions:
        return []

    h = image.shape[0]

    crops = []
    for i, pos in enumerate(positions):
        y_start = pos["y"]

        if i + 1 < len(positions):
            y_end = positions[i+1]["y"]
        else:
            y_end = h   # son soru → sayfa sonuna kadar

        # Crop işlemi
        crop = image[int(y_start):int(y_end), :]

        crops.append({
            "number": pos["number"],
            "image": crop
        })

    return crops


def parse_pdf(file_path):
    doc = fitz.open(file_path)

    all_questions = []

    for page_number, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # yüksek çözünürlük
        img_bytes = pix.tobytes("png")

        # numpy array'e çevir
        np_arr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # 1) OCR ile soru başlangıçlarını bul
        positions = get_question_positions(image)

        # 2) Soru alanlarını crop et
        cropped_questions = crop_questions_from_page(image, positions)

        for cq in cropped_questions:
            all_questions.append({
                "page": page_number,
                "number": cq["number"],
                "image": cq["image"]
            })

    return all_questions


# TEST
if __name__ == "__main__":
    file = "deneme.pdf"  # buraya PDF yolunu koy
    questions = parse_pdf(file)

    # çıktıları kaydet
    out = Path("output_questions")
    out.mkdir(exist_ok=True)

    for q in questions:
        name = f"{q['number']}_p{q['page']}.png"
        cv2.imwrite(str(out / name), q["image"])

    print("Hazır! Tüm sorular output_questions klasörüne kaydedildi.")
