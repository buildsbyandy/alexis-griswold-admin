public_media/
├── videos/
│   ├── homepage/         # Homepage hero videos
│   ├── vlogs/           # Published vlog videos
│   └── healing/         # Published healing page videos
├── images/
│   ├── thumbnails/      # Custom thumbnails for published content
│   │   ├── vlogs/       # Custom vlog thumbnails
│   │   ├── recipes/     # Custom recipe (reel) thumbnails
│   │   └── healing/     # Custom healing video thumbnails
│   ├── recipes/         # Published recipe images
│   ├── healing/         # Published healing product images
│   └── products/        # Published storefront product images

private_media/
├── videos/
│   └── drafts/          # Draft/archived video content
├── images/
│   ├── thumbnails/      # Custom thumbnails for draft content
│   │   ├── vlogs/       # Draft vlog thumbnails
│   │   ├── recipes/     # Draft recipe thumbnails
│   │   └── healing/     # Draft healing video thumbnails
│   ├── recipes/         # Draft/archived recipe images
│   ├── healing/         # Draft/archived healing product images
│   └── products/        # Draft/archived storefront product images
└── uploads/
    ├── videos/          # General video uploads
    └── images/          # General image uploads

# Bucket Logic:
# - Published content (status: 'published') → public_media/
# - Draft/archived content (status: 'draft' | 'archived') → private_media/
# - Custom thumbnails follow same public/private rules as parent content
# - YouTube fallback: https://img.youtube.com/vi/<video_id>/hqdefault.jpg
