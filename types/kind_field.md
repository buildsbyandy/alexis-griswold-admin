| kind     | Correct Field to Use | Fields to be NULL                |
|----------|----------------------|----------------------------------|
| video    | youtube_id           | ref_id, album_id, link_url       |
| album    | album_id             | ref_id, youtube_id, link_url     |
| recipe   | ref_id               | album_id, youtube_id, link_url   |
| product  | ref_id               | album_id, youtube_id, link_url   |
| tiktok   | link_url             | ref_id, album_id, youtube_id     |
| external | link_url             | ref_id, album_id, youtube_id     |
