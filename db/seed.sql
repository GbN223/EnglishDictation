INSERT INTO stopwords (word) VALUES
  ('a'), ('an'), ('the'), ('is'), ('are'), ('was'), ('were'), ('be'), ('been'),
  ('being'), ('am'), ('to'), ('in'), ('on'), ('at'), ('for'), ('of'), ('from'),
  ('by'), ('with'), ('as'), ('and'), ('or'), ('but'), ('if'), ('then'), ('than'),
  ('that'), ('this'), ('these'), ('those'), ('it'), ('its'), ('he'), ('she'),
  ('they'), ('we'), ('you'), ('i'), ('do'), ('does'), ('did'), ('done'), ('have'),
  ('has'), ('had'), ('can'), ('could'), ('will'), ('would'), ('should'), ('may'),
  ('might'), ('must'), ('not'), ('no'), ('yes'), ('up'), ('down'), ('out'), ('into'),
  ('over'), ('under'), ('about'), ('after'), ('before'), ('during'), ('while'),
  ('because'), ('so'), ('very')
ON CONFLICT (word) DO NOTHING;

INSERT INTO static_vocabulary (word, cef_level, meaning_vi) VALUES
  ('practice', 'A2', 'Thuc hanh de cai thien ky nang'),
  ('listen', 'A2', 'Lang nghe am thanh, loi noi hoac cuoc tro chuyen'),
  ('sentence', 'A2', 'Mot cau hoan chinh trong ngon ngu'),
  ('vocabulary', 'B1', 'Tap hop tu vung cua mot ngon ngu'),
  ('analysis', 'B2', 'Qua trinh phan tich chi tiet de hieu ro'),
  ('communication', 'B2', 'Hanh dong trao doi thong tin giua moi nguoi'),
  ('improve', 'B1', 'Lam cho tot hon hoac hieu qua hon'),
  ('strategy', 'B2', 'Ke hoach hanh dong de dat muc tieu')
ON CONFLICT (word) DO NOTHING;
