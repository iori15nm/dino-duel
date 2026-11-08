# 실사 공룡 이미지 생성 가이드

AI 이미지 도구(ChatGPT 이미지, Gemini 등)에 붙여 넣어 쓰는 프롬프트입니다.
만든 PNG를 대화창에 첨부하면 게임에 넣어 드립니다.

## 꼭 지킬 것
1. **공룡 하나당 2장:** 기본 자세(`_idle`)를 먼저 만들고, **같은 대화창에서** 공격 자세(`_attack`)를 "이 이미지를 수정해서"로 요청합니다. 그래야 같은 공룡으로 나옵니다.
2. **8종 모두 같은 스타일:** 아래 [공통 스타일] 문장을 매번 프롬프트 끝에 붙입니다.
3. **투명 배경 PNG**가 가장 좋습니다. 안 되면 완전한 흰색 배경도 괜찮습니다 (배경 제거는 제가 처리합니다).
4. 다른 게임이나 영화 이름("쥬라기 월드" 등)은 프롬프트에 넣지 않습니다.

## [공통 스타일] — 모든 공룡 프롬프트 끝에 붙이기
```
full body side view facing right, entire body visible from tail tip to snout, scientifically accurate anatomy, photorealistic 3D render, highly detailed scaly skin with wrinkles and skin folds, realistic subsurface lighting, soft key light from the upper left, warm natural colors, isolated on a transparent background, no ground, no shadow, no text, no blood
```

## 공룡별 프롬프트

| 파일 이름 | 기본 자세 프롬프트 (앞에 붙이고, 뒤에 공통 스타일) | 공격 자세 수정 요청 |
|---|---|---|
| `trex_idle` / `trex_attack` | Tyrannosaurus rex standing, horizontal body, tail held straight off the ground, massive jaws closed, tiny two-fingered arms, brown and ochre skin with darker stripes on the back | mouth wide open roaring showing all teeth, head lunging forward |
| `trice_idle` / `trice_attack` | Triceratops standing on four sturdy legs, large bony frill with orange-red edge, two long brow horns and a short nose horn, beak, grey-green skin | head lowered, horns pointed forward, charging |
| `stego_idle` / `stego_attack` | Stegosaurus standing, two alternating rows of tall red-orange back plates, four tail spikes, small head held low, olive-green skin | body twisted, spiked tail swinging toward the right |
| `ankylo_idle` / `ankylo_attack` | Ankylosaurus standing low, back covered in bony armor plates and side spikes, heavy bony tail club, sandy brown skin | tail club raised high, ready to strike |
| `spino_idle` / `spino_attack` | Spinosaurus standing, tall red-orange sail on its back, long crocodile-like snout, paddle-shaped tail, grey-blue skin with dark bands | jaws open, head thrust forward, claws raised |
| `theri_idle` / `theri_attack` | Therizinosaurus standing upright, pot-bellied body covered in brown feathers, long neck, small beaked head, very long arms with three huge scythe-like claws | arms raised high, claws spread, slashing pose |
| `pachy_idle` / `pachy_attack` | Pachycephalosaurus standing, thick dome-shaped skull with small bony knobs, bipedal, blue-grey skin with sandy belly | head lowered, dome skull pointed forward, ramming |
| `ptera_idle` / `ptera_attack` | Pteranodon flying, wings spread wide, long backward-pointing orange-red crest, long toothless beak, brown wing membranes | diving downward, wings folded back, beak pointed forward |

## 배경 (선택, 16:9)
| 파일 이름 | 프롬프트 |
|---|---|
| `bg_forest` | Photorealistic prehistoric forest, wide panoramic side view for a 2D fighting game stage, warm golden sunlight, tall conifers and giant ferns, misty mountains, flat open dirt clearing across the bottom 25% of the image, cinematic 3D render, no animals, no text, 16:9 |
