/*
  # Seed missing CMS sections only
  (cms_section_videos table already exists — skip creation)
*/

-- ============================================
-- SEED MISSING SECTIONS (blog pages, etc.)
-- ============================================

INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('blog_hero', 'blog', 'Blog Hero', 'Blog listing page hero image', 'https://images.pexels.com/photos/1430677/pexels-photo-1430677.jpeg?auto=compress&cs=tinysrgb&w=1920', '')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('blog_post_hero', 'blog-post', 'Blog Post Hero', 'Individual blog post hero background', 'https://images.pexels.com/photos/1430677/pexels-photo-1430677.jpeg?auto=compress&cs=tinysrgb&w=1920', '')
ON CONFLICT (section_key) DO NOTHING;

-- Ocean Safari dining
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('ocean-safari_dining_1', 'ocean-safari', 'Ocean Safari - Sunset Dining', 'Ocean Safari dining experience image 1', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80', ''),
  ('ocean-safari_dining_2', 'ocean-safari', 'Ocean Safari - Exmouth Seafood', 'Ocean Safari dining experience image 2', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80', ''),
  ('ocean-safari_dining_3', 'ocean-safari', 'Ocean Safari - Premium Cellar', 'Ocean Safari dining experience image 3', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', ''),
  ('ocean-safari_dining_4', 'ocean-safari', 'Ocean Safari - Chefs Table', 'Ocean Safari dining experience image 4', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80', '')
ON CONFLICT (section_key) DO NOTHING;

-- Dive Expedition dining
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('dive-expedition_dining_1', 'dive-expedition', 'Dive Expedition - Sunset Dining', 'Dive Expedition dining experience image 1', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80', ''),
  ('dive-expedition_dining_2', 'dive-expedition', 'Dive Expedition - Exmouth Seafood', 'Dive Expedition dining experience image 2', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80', ''),
  ('dive-expedition_dining_3', 'dive-expedition', 'Dive Expedition - Margaret River Wines', 'Dive Expedition dining experience image 3', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', ''),
  ('dive-expedition_dining_4', 'dive-expedition', 'Dive Expedition - Beach BBQ', 'Dive Expedition dining experience image 4', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', ''),
  ('dive-expedition_dining_5', 'dive-expedition', 'Dive Expedition - Champagne Brunch', 'Dive Expedition dining experience image 5', 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=600&q=80', ''),
  ('dive-expedition_dining_6', 'dive-expedition', 'Dive Expedition - Chefs Table', 'Dive Expedition dining experience image 6', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80', '')
ON CONFLICT (section_key) DO NOTHING;

-- Ocean Safari itinerary (6 days / 5 nights)
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('ocean-safari_itinerary_day1', 'ocean-safari', 'Ocean Safari - Day 1 Itinerary', 'Day 1 Departure & First Anchorage', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', ''),
  ('ocean-safari_itinerary_day2', 'ocean-safari', 'Ocean Safari - Day 2 Itinerary', 'Day 2 Northern Reef & Snorkel', 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80', ''),
  ('ocean-safari_itinerary_day3', 'ocean-safari', 'Ocean Safari - Day 3 Itinerary', 'Day 3 Whale Shark Encounter', 'https://images.unsplash.com/photo-1719450589784-c2c36ccf8e5b?q=80&w=1075&auto=format&fit=crop', ''),
  ('ocean-safari_itinerary_day4', 'ocean-safari', 'Ocean Safari - Day 4 Itinerary', 'Day 4 Coral Gardens & Turquoise Bay', 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1200&q=80', ''),
  ('ocean-safari_itinerary_day5', 'ocean-safari', 'Ocean Safari - Day 5 Itinerary', 'Day 5 Yoga, Sailing & Exploration', 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80', ''),
  ('ocean-safari_itinerary_day6', 'ocean-safari', 'Ocean Safari - Day 6 Itinerary', 'Day 6 Final Morning & Return', 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=1200&q=80', '')
ON CONFLICT (section_key) DO NOTHING;

-- Dive Expedition itinerary (9 days / 8 nights)
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('dive-expedition_itinerary_day1', 'dive-expedition', 'Dive Expedition - Day 1 Itinerary', 'Day 1 Embarkation & Departure', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', ''),
  ('dive-expedition_itinerary_day2', 'dive-expedition', 'Dive Expedition - Day 2 Itinerary', 'Day 2 Northern Reef Exploration', 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80', ''),
  ('dive-expedition_itinerary_day3', 'dive-expedition', 'Dive Expedition - Day 3 Itinerary', 'Day 3 Whale Shark Encounter', 'https://images.unsplash.com/photo-1576124344805-c47cea66b0db?q=80&w=1112&auto=format&fit=crop', ''),
  ('dive-expedition_itinerary_day4', 'dive-expedition', 'Dive Expedition - Day 4 Itinerary', 'Day 4 Scuba Diving & Deep Reef', 'https://images.unsplash.com/photo-1616464592706-f39e5b192451?q=80&w=1633&auto=format&fit=crop', ''),
  ('dive-expedition_itinerary_day5', 'dive-expedition', 'Dive Expedition - Day 5 Itinerary', 'Day 5 Humpback Whale Swim (Seasonal)', 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=1200&q=80', ''),
  ('dive-expedition_itinerary_day6', 'dive-expedition', 'Dive Expedition - Day 6 Itinerary', 'Day 6 Turquoise Bay & Turtles', 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1200&q=80', ''),
  ('dive-expedition_itinerary_day7', 'dive-expedition', 'Dive Expedition - Day 7 Itinerary', 'Day 7 Expedition RIB Adventures', 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80', ''),
  ('dive-expedition_itinerary_day8', 'dive-expedition', 'Dive Expedition - Day 8 Itinerary', 'Day 8 Coral Bay & Manta Rays', 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=1200&q=80', ''),
  ('dive-expedition_itinerary_day9', 'dive-expedition', 'Dive Expedition - Day 9 Itinerary', 'Day 9 Final Morning & Farewell', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80', '')
ON CONFLICT (section_key) DO NOTHING;

-- Route map backgrounds
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('ocean-safari_route_bg', 'ocean-safari', 'Ocean Safari - Route Map Background', 'Background image for Ocean Safari route map section', 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1920&q=80', ''),
  ('dive-expedition_route_bg', 'dive-expedition', 'Dive Expedition - Route Map Background', 'Background image for Dive Expedition route map section', 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1920&q=80', '')
ON CONFLICT (section_key) DO NOTHING;

-- Ocean Safari vessel gallery
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('ocean-safari_vessel_1', 'ocean-safari', 'Ocean Safari - Vessel at Anchor', 'Ocean Safari vessel exterior', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80', ''),
  ('ocean-safari_vessel_2', 'ocean-safari', 'Ocean Safari - Premium Cabin', 'Ocean Safari cabin accommodation', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', ''),
  ('ocean-safari_vessel_3', 'ocean-safari', 'Ocean Safari - Sun Deck Lounge', 'Ocean Safari common areas', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80', ''),
  ('ocean-safari_vessel_4', 'ocean-safari', 'Ocean Safari - Master Suite', 'Ocean Safari master suite', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', ''),
  ('ocean-safari_vessel_5', 'ocean-safari', 'Ocean Safari - Dive Platform', 'Ocean Safari dive activities', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', ''),
  ('ocean-safari_vessel_6', 'ocean-safari', 'Ocean Safari - Dining Salon', 'Ocean Safari dining area', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80', '')
ON CONFLICT (section_key) DO NOTHING;

-- Dive Expedition vessel gallery
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('dive-expedition_vessel_1', 'dive-expedition', 'Dive Expedition - Vessel at Anchor', 'Dive Expedition vessel exterior', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80', ''),
  ('dive-expedition_vessel_2', 'dive-expedition', 'Dive Expedition - Premium Suite', 'Dive Expedition cabin accommodation', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', ''),
  ('dive-expedition_vessel_3', 'dive-expedition', 'Dive Expedition - Master Cabin', 'Dive Expedition master cabin', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', ''),
  ('dive-expedition_vessel_4', 'dive-expedition', 'Dive Expedition - Observation Deck', 'Dive Expedition common areas', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80', ''),
  ('dive-expedition_vessel_5', 'dive-expedition', 'Dive Expedition - Dining Salon', 'Dive Expedition dining area', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80', ''),
  ('dive-expedition_vessel_6', 'dive-expedition', 'Dive Expedition - Dive Platform', 'Dive Expedition dive activities', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', ''),
  ('dive-expedition_vessel_7', 'dive-expedition', 'Dive Expedition - Gourmet Galley', 'Dive Expedition kitchen', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80', ''),
  ('dive-expedition_vessel_8', 'dive-expedition', 'Dive Expedition - Lounge Area', 'Dive Expedition lounge', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', '')
ON CONFLICT (section_key) DO NOTHING;

-- About page grid
INSERT INTO cms_sections (section_key, page, label, description, default_image_url, default_video_url)
VALUES
  ('about_grid_1', 'about', 'About - Grid Image 1', 'About page manta ray image', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', ''),
  ('about_grid_2', 'about', 'About - Grid Image 2', 'About page sunset dining image', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80', ''),
  ('about_grid_3', 'about', 'About - Grid Image 3', 'About page turquoise waters image', 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=600&q=80', ''),
  ('about_grid_4', 'about', 'About - Grid Image 4', 'About page whale shark image', 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=600&q=80', '')
ON CONFLICT (section_key) DO NOTHING;