# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('src/components/Navbar.tsx').read_text(encoding='utf-8')
for target in ["Öðrenci/Veli Giriþi", "Öðretmen Giriþi", "Kurum/Öðrenci Giriþi"]:
    if target not in text:
        print('missing', target)
