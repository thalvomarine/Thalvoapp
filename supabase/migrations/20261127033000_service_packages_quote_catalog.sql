-- Expand routine service catalogue for quote-first booking (no fixed price UX).
-- Idempotent: ON CONFLICT (key) DO NOTHING.

INSERT INTO public.service_packages (key, title_tr, title_en, category, base_duration_min) VALUES
  ('svc_oil', 'Yağ ve Filtre Değişimi', 'Oil & Filter Change', 'mechanic', 60),
  ('svc_fuel', 'Yakıt Sistemi Servisi', 'Fuel System Service', 'mechanic', 90),
  ('svc_cooling', 'Soğutma Sistemi (Termostat / Pompa)', 'Cooling System Service', 'mechanic', 120),
  ('svc_elec', 'Elektrik ve Alternatör Kontrolü', 'Electrical & Alternator Check', 'mechanic', 90),
  ('svc_prop', 'Şaft ve Salmastra Kontrolü', 'Shaft & Stuffing Box Check', 'mechanic', 120),
  ('svc_wreck', 'Batık / Suya Batan Tekne Çıkarma', 'Sunken Vessel Recovery', 'diver', 240),
  ('svc_anchor_rec', 'Çapa Kurtarma', 'Anchor Recovery', 'diver', 90),
  ('svc_prop_wrap', 'Pervane / Mil Sarımı Açma', 'Propeller & Line Entanglement', 'diver', 60),
  ('svc_seacock', 'Deniz Suyu Girişi (Kingstone) Kontrolü', 'Seacock Inspection', 'diver', 60)
ON CONFLICT (key) DO NOTHING;
