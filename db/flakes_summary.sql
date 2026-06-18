CREATE TABLE flakes_summary (
  id integer DEFAULT nextval('flakes_summary_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  total_jumlah integer DEFAULT 0,
  grand_total_ketebalan numeric DEFAULT 0,
  rata_rata_ketebalan numeric DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT now(),
  FOREIGN KEY (document_id) REFERENCES flakes_documents(id)
);